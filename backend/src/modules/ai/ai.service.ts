import {
  Injectable,
  Inject,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { SUPABASE_ADMIN } from '../../config/supabase.module';
import { RagService } from './rag.service';
import { CreateConversationDto, SendMessageDto, AnalyzeDocumentDto } from './ai.dto';

const VALID_RISK_LEVELS = ['low', 'medium', 'high', 'critical'];
const VALID_CATEGORIES = ['abusiva', 'ambigua', 'faltante', 'ilegal', 'desbalanceada', 'ok'];

// Model routing by advisor — legal needs stronger reasoning
const ADVISOR_MODELS: Record<string, string> = {
  legal: 'claude-sonnet-4-6',
  health: 'claude-haiku-4-5-20251001',
  finance: 'claude-haiku-4-5-20251001',
  psychology: 'claude-haiku-4-5-20251001',
  home: 'claude-haiku-4-5-20251001',
};

export interface StreamChunk {
  type: 'token' | 'done' | 'error';
  content?: string;
  messageId?: string;
  model?: string;
  tokensInput?: number;
  tokensOutput?: number;
  error?: string;
}

type AnthropicMessage = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly openai: OpenAI;
  private readonly anthropic: Anthropic;
  private readonly primaryProvider: string;
  private readonly promptCacheEnabled: boolean;
  private readonly maxHistory: number;

  constructor(
    @Inject(SUPABASE_ADMIN) private readonly supabase: SupabaseClient,
    private readonly config: ConfigService,
    private readonly ragService: RagService,
  ) {
    this.openai = new OpenAI({ apiKey: config.get('OPENAI_API_KEY') });
    this.anthropic = new Anthropic({ apiKey: config.get('ANTHROPIC_API_KEY') });
    // Default to anthropic — Claude is the primary model
    this.primaryProvider = config.get('AI_PROVIDER', 'anthropic');
    this.promptCacheEnabled = config.get('CLAUDE_PROMPT_CACHE', 'true') === 'true';
    this.maxHistory = parseInt(config.get('CLAUDE_MAX_HISTORY', '50'));
  }

  // ─── Advisors ─────────────────────────────────────────────────────────────

  async listAdvisors(tenantId: string) {
    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('plan')
      .eq('id', tenantId)
      .single();

    const { data: advisors, error } = await this.supabase
      .from('advisors')
      .select('id, name, category, title, description, icon, color, welcome_message, quick_actions, capabilities, requires_plan, sort_order')
      .eq('is_active', true)
      .order('sort_order');

    if (error) throw new BadRequestException('Error al obtener asesores');

    return advisors.map((a) => ({
      ...a,
      available: this.isPlanSufficient(tenant?.plan || 'start', a.requires_plan),
    }));
  }

  async getAdvisor(advisorId: string, tenantId: string) {
    const [advisorResult, tenantResult] = await Promise.all([
      this.supabase
        .from('advisors')
        .select('id, name, category, title, description, icon, color, welcome_message, quick_actions, capabilities, requires_plan')
        .eq('id', advisorId)
        .eq('is_active', true)
        .single(),
      this.supabase.from('tenants').select('plan').eq('id', tenantId).single(),
    ]);

    if (advisorResult.error || !advisorResult.data) {
      throw new NotFoundException('Asesor no encontrado');
    }

    const advisor = advisorResult.data;
    const available = this.isPlanSufficient(tenantResult.data?.plan || 'start', advisor.requires_plan);
    return { ...advisor, available };
  }

  // ─── Conversations ────────────────────────────────────────────────────────

  async createConversation(dto: CreateConversationDto, userId: string, tenantId: string) {
    const advisorId = dto.advisorId || dto.advisor_id || 'legal';

    const { data: advisor, error: advisorError } = await this.supabase
      .from('advisors')
      .select('id, name, icon, color, requires_plan, welcome_message')
      .eq('id', advisorId)
      .eq('is_active', true)
      .single();

    if (advisorError || !advisor) throw new NotFoundException('Asesor no encontrado');

    const { data: tenant } = await this.supabase
      .from('tenants')
      .select('plan, max_ai_queries_per_month')
      .eq('id', tenantId)
      .single();

    if (!this.isPlanSufficient(tenant?.plan || 'start', advisor.requires_plan)) {
      throw new ForbiddenException('Tu plan no incluye acceso a este asesor');
    }

    await this.checkMonthlyLimit(tenantId, tenant?.max_ai_queries_per_month);

    const { data: conversation, error } = await this.supabase
      .from('conversations')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        advisor_id: advisorId,
        type: dto.type || 'chat',
        title: dto.title || `Consulta con ${advisor.name}`,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw new BadRequestException('Error al crear conversación');

    return {
      ...conversation,
      advisor: { id: advisor.id, name: advisor.name, icon: advisor.icon, color: advisor.color },
      welcomeMessage: advisor.welcome_message,
    };
  }

  async sendMessage(conversationId: string, dto: SendMessageDto, userId: string, tenantId: string) {
    const { conversation, systemPrompt, messages } = await this.prepareMessageContext(
      conversationId, dto, tenantId,
    );

    await this.saveUserMessage(conversationId, tenantId, dto.content);

    const model = this.resolveModel(conversation.advisor_id);
    const aiResponse = await this.callAI(systemPrompt, messages, model);

    const savedMessage = await this.saveAssistantMessage(
      conversationId, tenantId, aiResponse,
    );

    this.updateConversationStats(conversationId, conversation, aiResponse).catch(() => {});

    return {
      messageId: savedMessage?.id,
      content: aiResponse.content,
      model: aiResponse.model,
      conversationId,
      advisorId: conversation.advisor_id,
      advisorColor: conversation.advisor.color,
    };
  }

  async *streamMessage(
    conversationId: string,
    dto: SendMessageDto,
    userId: string,
    tenantId: string,
  ): AsyncGenerator<StreamChunk> {
    const { conversation, systemPrompt, messages } = await this.prepareMessageContext(
      conversationId, dto, tenantId,
    );

    await this.saveUserMessage(conversationId, tenantId, dto.content);

    const model = this.resolveModel(conversation.advisor_id);

    try {
      let fullContent = '';
      let tokensInput = 0;
      let tokensOutput = 0;

      const systemBlock = this.buildSystemBlock(systemPrompt);
      const dedupedMessages = this.dedupeMessages(messages);

      const stream = this.anthropic.messages.stream({
        model,
        system: systemBlock as any,
        messages: dedupedMessages,
        max_tokens: 4096,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          fullContent += event.delta.text;
          yield { type: 'token', content: event.delta.text };
        }
      }

      const finalMsg = await stream.finalMessage();
      tokensInput = finalMsg.usage.input_tokens;
      tokensOutput = finalMsg.usage.output_tokens;

      const savedMessage = await this.saveAssistantMessage(conversationId, tenantId, {
        content: fullContent,
        tokensInput,
        tokensOutput,
        model,
      });

      this.updateConversationStats(conversationId, conversation, { tokensInput, tokensOutput }).catch(() => {});

      yield { type: 'done', messageId: savedMessage?.id, model, tokensInput, tokensOutput };
    } catch (error) {
      this.logger.error(`Stream error: ${error.message}`);
      yield { type: 'error', error: 'Error en el servicio de IA. Intentá de nuevo.' };
    }
  }

  async getConversation(conversationId: string, tenantId: string) {
    const { data: conversation, error } = await this.supabase
      .from('conversations')
      .select('*, advisor:advisors(id, name, icon, color, title)')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !conversation) throw new NotFoundException('Conversación no encontrada');

    const { data: messages } = await this.supabase
      .from('conversation_messages')
      .select('id, role, content, tokens_input, tokens_output, ai_model, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    return { ...conversation, messages: messages || [] };
  }

  async listConversations(tenantId: string, userId: string, page = 1, limit = 20, advisorId?: string) {
    const offset = (page - 1) * limit;

    let query = this.supabase
      .from('conversations')
      .select('id, advisor_id, type, status, title, messages_count, created_at, updated_at, advisor:advisors(id, name, icon, color)', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (advisorId) query = query.eq('advisor_id', advisorId);

    const { data, count, error } = await query;
    if (error) throw new BadRequestException('Error al obtener conversaciones');

    return {
      conversations: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  // ─── Document Analysis (Tool Use) ─────────────────────────────────────────

  async analyzeDocument(dto: AnalyzeDocumentDto, userId: string, tenantId: string) {
    const { data: wallet } = await this.supabase
      .from('credit_wallets')
      .select('balance')
      .eq('tenant_id', tenantId)
      .single();

    if (!wallet || wallet.balance < 1) {
      throw new ForbiddenException('Sin créditos. Comprá más créditos para analizar documentos.');
    }

    const truncatedContent = dto.content.substring(0, 12000);
    const country = dto.country || 'argentina';

    const systemPrompt = `Sos un experto en análisis de riesgos contractuales en derecho latinoamericano (${country}).
Analizás contratos identificando cláusulas problemáticas con criterio jurídico preciso.
Siempre usás la herramienta save_risk_analysis para entregar el resultado estructurado.`;

    const userMessage = `Analizá este documento legal:\n\n**Título:** ${dto.title}\n\n**Contenido:**\n${truncatedContent}`;

    // Use Claude with tool use — guarantees structured JSON output
    const analysisResult = await this.callAnthropicWithTools(systemPrompt, userMessage);

    const overallRisk = VALID_RISK_LEVELS.includes(analysisResult.overall_risk)
      ? analysisResult.overall_risk : 'medium';
    const riskScore = Math.min(100, Math.max(0, parseInt(analysisResult.risk_score) || 50));

    const { data: creditResult } = await this.supabase.rpc('consume_credits', {
      p_tenant_id: tenantId,
      p_user_id: userId,
      p_amount: 1,
      p_description: `Análisis: ${dto.title}`,
    });

    if (!creditResult?.[0]?.success) {
      throw new ForbiddenException('Error al consumir créditos');
    }

    const { data: assessment, error: assessmentError } = await this.supabase
      .from('risk_assessments')
      .insert({
        tenant_id: tenantId,
        user_id: userId,
        overall_risk: overallRisk,
        risk_score: riskScore,
        summary: analysisResult.summary?.substring(0, 5000) || '',
        document_title: dto.title,
        document_content: truncatedContent.substring(0, 5000),
        credits_used: 1,
      })
      .select()
      .single();

    if (assessmentError) throw new BadRequestException('Error al guardar análisis');

    const findings = (analysisResult.findings || []).slice(0, 20);
    if (findings.length > 0) {
      const findingsToInsert = findings.map((f: any, idx: number) => ({
        assessment_id: assessment.id,
        tenant_id: tenantId,
        clause_title: f.clause_title?.substring(0, 500) || 'Cláusula',
        clause_text: f.clause_text?.substring(0, 500) || '',
        risk_level: VALID_RISK_LEVELS.includes(f.risk_level) ? f.risk_level : 'low',
        category: VALID_CATEGORIES.includes(f.category) ? f.category : 'ok',
        explanation: f.explanation?.substring(0, 2000) || '',
        recommendation: f.recommendation?.substring(0, 2000) || '',
        sort_order: idx,
      }));
      await this.supabase.from('risk_findings').insert(findingsToInsert).then(() => {}, () => {});
    }

    return {
      assessmentId: assessment.id,
      overallRisk,
      riskScore,
      summary: analysisResult.summary,
      findingsCount: findings.length,
      creditsUsed: 1,
      creditsRemaining: creditResult[0].balance_after,
    };
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

  private async prepareMessageContext(
    conversationId: string,
    dto: SendMessageDto,
    tenantId: string,
  ) {
    const { data: conversation, error: convError } = await this.supabase
      .from('conversations')
      .select('*, advisor:advisors(id, name, system_prompt, color)')
      .eq('id', conversationId)
      .eq('tenant_id', tenantId)
      .single();

    if (convError || !conversation) throw new NotFoundException('Conversación no encontrada');
    if (conversation.status !== 'active') throw new BadRequestException('Esta conversación está cerrada');

    const { data: history } = await this.supabase
      .from('conversation_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(this.maxHistory);

    let systemPrompt = conversation.advisor.system_prompt;

    if (conversation.advisor_id === 'legal') {
      const { data: tenant } = await this.supabase
        .from('tenants')
        .select('country')
        .eq('id', tenantId)
        .single();

      const knowledge = await this.ragService.searchKnowledge(dto.content, tenant?.country);
      if (knowledge) {
        systemPrompt += `\n\n## BASE DE CONOCIMIENTO RELEVANTE:\n${knowledge}`;
      }
    }

    const messages: AnthropicMessage[] = [
      ...(history || []).map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user', content: dto.content },
    ];

    return { conversation, systemPrompt, messages };
  }

  private async saveUserMessage(conversationId: string, tenantId: string, content: string) {
    await this.supabase.from('conversation_messages').insert({
      conversation_id: conversationId,
      tenant_id: tenantId,
      role: 'user',
      content,
    });
  }

  private async saveAssistantMessage(
    conversationId: string,
    tenantId: string,
    aiResponse: { content: string; tokensInput: number; tokensOutput: number; model: string },
  ) {
    const { data } = await this.supabase
      .from('conversation_messages')
      .insert({
        conversation_id: conversationId,
        tenant_id: tenantId,
        role: 'assistant',
        content: aiResponse.content,
        tokens_input: aiResponse.tokensInput,
        tokens_output: aiResponse.tokensOutput,
        ai_model: aiResponse.model,
      })
      .select()
      .single();
    return data;
  }

  private async updateConversationStats(
    conversationId: string,
    conversation: any,
    aiResponse: { tokensInput: number; tokensOutput: number },
  ) {
    await this.supabase
      .from('conversations')
      .update({
        tokens_total: (conversation.tokens_total || 0) + aiResponse.tokensInput + aiResponse.tokensOutput,
        messages_count: (conversation.messages_count || 0) + 2,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId);
  }

  private async checkMonthlyLimit(tenantId: string, maxQueries?: number) {
    if (!maxQueries || maxQueries === 99999) return;

    const { count } = await this.supabase
      .from('conversation_messages')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('role', 'user')
      .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString());

    if ((count || 0) >= maxQueries) {
      throw new ForbiddenException('Alcanzaste el límite de consultas del mes. Actualizá tu plan.');
    }
  }

  /** Resolve Claude model based on advisor — legal gets stronger model */
  private resolveModel(advisorId: string): string {
    const envOverride = this.config.get<string>(`CLAUDE_MODEL_${advisorId?.toUpperCase()}`);
    if (envOverride) return envOverride;
    return ADVISOR_MODELS[advisorId] ?? this.config.get<string>('AI_MODEL_ANTHROPIC') ?? 'claude-sonnet-4-6';
  }

  /** Build system block with optional prompt caching */
  private buildSystemBlock(systemPrompt: string) {
    if (this.promptCacheEnabled) {
      return [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }];
    }
    return systemPrompt;
  }

  /** Ensure messages alternate user/assistant (Anthropic requirement) */
  private dedupeMessages(messages: AnthropicMessage[]): AnthropicMessage[] {
    const result: AnthropicMessage[] = [];
    for (const msg of messages) {
      if (result.length === 0 || result[result.length - 1].role !== msg.role) {
        result.push({ ...msg });
      } else {
        result[result.length - 1].content += '\n' + msg.content;
      }
    }
    // Must start with user
    if (result.length > 0 && result[0].role !== 'user') {
      result.shift();
    }
    return result;
  }

  // ─── AI Providers ─────────────────────────────────────────────────────────

  private async callAI(
    systemPrompt: string,
    messages: AnthropicMessage[],
    model?: string,
  ): Promise<{ content: string; tokensInput: number; tokensOutput: number; model: string }> {
    const maxRetries = 2;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (this.primaryProvider === 'anthropic') {
          return await this.callAnthropic(systemPrompt, messages, model);
        }
        return await this.callOpenAI(systemPrompt, messages);
      } catch (error) {
        this.logger.warn(`AI attempt ${attempt} failed: ${error.message}`);
        if (attempt === maxRetries) {
          try {
            // Fallback to the other provider
            if (this.primaryProvider === 'anthropic') {
              return await this.callOpenAI(systemPrompt, messages);
            }
            return await this.callAnthropic(systemPrompt, messages, model);
          } catch {
            throw new BadRequestException('Error al conectar con el servicio de IA. Intentá más tarde.');
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
      }
    }

    throw new BadRequestException('Error inesperado en el servicio de IA');
  }

  private async callAnthropic(
    systemPrompt: string,
    messages: AnthropicMessage[],
    model?: string,
  ) {
    const resolvedModel = model ?? this.config.get<string>('AI_MODEL_ANTHROPIC') ?? 'claude-sonnet-4-6';
    const dedupedMessages = this.dedupeMessages(messages);
    const systemBlock = this.buildSystemBlock(systemPrompt);

    const response = await this.anthropic.messages.create({
      model: resolvedModel,
      system: systemBlock as any,
      messages: dedupedMessages,
      max_tokens: 4096,
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';

    return {
      content,
      tokensInput: response.usage.input_tokens,
      tokensOutput: response.usage.output_tokens,
      model: resolvedModel,
    };
  }

  /** Use Claude tool_choice to force structured JSON output — no regex needed */
  private async callAnthropicWithTools(systemPrompt: string, userMessage: string) {
    const model = this.config.get<string>('CLAUDE_MODEL_LEGAL') ?? 'claude-sonnet-4-6';

    const analysisSchema = {
      name: 'save_risk_analysis',
      description: 'Guarda el resultado estructurado del análisis de riesgo contractual',
      input_schema: {
        type: 'object' as const,
        properties: {
          overall_risk: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'critical'],
            description: 'Nivel de riesgo general del documento',
          },
          risk_score: {
            type: 'number',
            description: 'Puntuación de riesgo del 0 (sin riesgo) al 100 (riesgo máximo)',
          },
          summary: {
            type: 'string',
            description: 'Resumen ejecutivo del análisis (máx 500 palabras)',
          },
          findings: {
            type: 'array',
            description: 'Hallazgos por cláusula',
            items: {
              type: 'object',
              properties: {
                clause_title: { type: 'string', description: 'Nombre de la cláusula' },
                clause_text: { type: 'string', description: 'Texto relevante (máx 200 chars)' },
                risk_level: { type: 'string', enum: ['low', 'medium', 'high', 'critical'] },
                category: { type: 'string', enum: ['abusiva', 'ambigua', 'faltante', 'ilegal', 'desbalanceada', 'ok'] },
                explanation: { type: 'string', description: 'Explicación del problema encontrado' },
                recommendation: { type: 'string', description: 'Qué hacer al respecto' },
              },
              required: ['clause_title', 'risk_level', 'category', 'explanation', 'recommendation'],
            },
          },
        },
        required: ['overall_risk', 'risk_score', 'summary', 'findings'],
      },
    };

    const systemBlock = this.buildSystemBlock(systemPrompt);

    const response = await this.anthropic.messages.create({
      model,
      system: systemBlock as any,
      messages: [{ role: 'user', content: userMessage }],
      tools: [analysisSchema],
      tool_choice: { type: 'tool', name: 'save_risk_analysis' },
      max_tokens: 4096,
    });

    const toolUseBlock = response.content.find((b) => b.type === 'tool_use');
    if (!toolUseBlock || toolUseBlock.type !== 'tool_use') {
      throw new BadRequestException('Error al procesar el análisis. Intentá de nuevo.');
    }

    return toolUseBlock.input as any;
  }

  private async callOpenAI(
    systemPrompt: string,
    messages: AnthropicMessage[],
  ) {
    const model = this.config.get<string>('AI_MODEL_OPENAI') ?? 'gpt-4o';

    const response = await this.openai.chat.completions.create({
      model,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
      temperature: 0.7,
      max_tokens: 4096,
    });

    return {
      content: response.choices[0].message.content || '',
      tokensInput: response.usage?.prompt_tokens || 0,
      tokensOutput: response.usage?.completion_tokens || 0,
      model,
    };
  }

  private isPlanSufficient(userPlan: string, requiredPlan: string): boolean {
    const planOrder = { start: 1, pro: 2, enterprise: 3 };
    return (planOrder[userPlan] || 1) >= (planOrder[requiredPlan] || 1);
  }
}
