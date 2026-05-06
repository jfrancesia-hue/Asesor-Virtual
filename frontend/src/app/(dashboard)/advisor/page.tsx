'use client';
import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Send, Save, ChevronDown, ArrowLeft } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores';
import { Button, Spinner } from '@/components/ui';
import { clsx } from 'clsx';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
}

function AdvisorChat() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const advisorId = searchParams.get('advisor') || 'legal';
  const mode = searchParams.get('mode');
  const contractType = searchParams.get('type');
  const initialPrompt = searchParams.get('prompt') ? decodeURIComponent(searchParams.get('prompt')!) : null;

  const [advisor, setAdvisor] = useState<any>(null);
  const [conversation, setConversation] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [savingContract, setSavingContract] = useState<string | null>(null);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [showAdvisorPicker, setShowAdvisorPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadAdvisor();
    api.ai.listAdvisors().then(setAdvisors).catch(() => {});
    // loadAdvisor intentionally recreates the conversation when advisorId changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [advisorId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadAdvisor = async () => {
    try {
      const [advisorData, convData] = await Promise.all([
        api.ai.getAdvisor(advisorId),
        api.ai.createConversation({
          advisor_id: advisorId,
          type: mode === 'create' ? 'contract' : 'chat',
        }),
      ]);
      setAdvisor(advisorData as any);
      setConversation(convData as any);

      // Mensaje de bienvenida
      const welcomeMsg = (convData as any).welcomeMessage || (advisorData as any).welcome_message;
      setMessages([{ id: 'welcome', role: 'assistant', content: welcomeMsg }]);

      // Auto-send: contrato o prompt pre-cargado
      if (mode === 'create' && contractType) {
        setTimeout(() => sendInitialMessage(convData as any, advisorData as any, contractType), 300);
      } else if (initialPrompt) {
        setTimeout(() => sendMessage((convData as any).id, initialPrompt), 300);
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar asesor');
    }
  };

  const sendInitialMessage = async (conv: any, adv: any, type: string) => {
    const typeLabels: Record<string, string> = {
      alquiler: 'contrato de alquiler residencial',
      servicios: 'contrato de prestación de servicios',
      nda: 'acuerdo de confidencialidad (NDA)',
      freelance: 'contrato de trabajo freelance',
      laboral: 'contrato laboral',
      comercial: 'contrato comercial',
      compraventa: 'boleto de compraventa',
    };
    const msg = `Necesito generar un ${typeLabels[type] || type}. ¿Podés guiarme paso a paso?`;
    setMessages([{ id: 'welcome', role: 'assistant', content: adv.welcome_message }]);
    await sendMessage(conv.id, msg);
  };

  const sendMessage = async (convId?: string, text?: string) => {
    const content = text || input.trim();
    if (!content) return;
    const targetConvId = convId || conversation?.id;
    if (!targetConvId) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    // Streaming assistant message placeholder
    const streamingId = Date.now().toString() + 'a';
    setMessages((prev) => [...prev, { id: streamingId, role: 'assistant', content: '' }]);

    try {
      let accumulated = '';
      const stream = api.ai.streamMessage(targetConvId, content);

      for await (const chunk of stream) {
        if (chunk.type === 'token' && chunk.content) {
          accumulated += chunk.content;
          setMessages((prev) =>
            prev.map((m) => m.id === streamingId ? { ...m, content: accumulated } : m)
          );
        }
        if (chunk.type === 'done') {
          setMessages((prev) =>
            prev.map((m) => m.id === streamingId ? { ...m, id: chunk.messageId || streamingId } : m)
          );
        }
        if (chunk.type === 'error') {
          throw new Error(chunk.error || 'Error en streaming');
        }
      }
    } catch {
      // Fallback al endpoint normal si el streaming falla
      try {
        setMessages((prev) => prev.filter((m) => m.id !== streamingId));
        const response = await api.ai.sendMessage(targetConvId, { content }) as any;
        setMessages((prev) => [...prev, {
          id: response.messageId || Date.now().toString() + 'b',
          role: 'assistant',
          content: response.content,
        }]);
      } catch (fallbackError: any) {
        toast.error(fallbackError.message || 'Error al enviar mensaje');
        setMessages((prev) => prev.filter((m) => m.role !== 'user' || m.content !== content));
        setInput(content);
      }
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const extractContract = (content: string): string | null => {
    const match = content.match(/<contrato>([\s\S]*?)<\/contrato>/);
    return match ? match[1].trim() : null;
  };

  const handleSaveContract = async (messageContent: string, contractType: string = 'servicios') => {
    const contractHtml = extractContract(messageContent);
    if (!contractHtml) return;

    setSavingContract(messageContent.substring(0, 50));
    try {
      const saved = await api.contracts.create({
        title: `Contrato generado — ${new Date().toLocaleDateString('es-AR')}`,
        type: contractType,
        contentHtml: contractHtml,
        contentPlain: contractHtml.replace(/<[^>]+>/g, ''),
        status: 'draft',
      }) as any;
      toast.success('Contrato guardado exitosamente');
      router.push(`/contracts/${saved.id}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar');
    } finally {
      setSavingContract(null);
    }
  };

  const renderMessageContent = (content: string) => {
    const contractHtml = extractContract(content);
    const displayContent = content.replace(/<contrato>[\s\S]*?<\/contrato>/, '').trim();

    return (
      <div>
        {displayContent && (
          <div
            className="ai-content text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(displayContent) }}
          />
        )}
        {contractHtml && (
          <div className="mt-4 border border-[var(--primary)]/30 rounded-xl overflow-hidden bg-[var(--surface)]">
            <div className="bg-[var(--primary-bg)] px-4 py-2.5 flex items-center justify-between gap-3">
              <span className="text-xs font-bold text-[var(--primary-dark)] tracking-wide">📄 CONTRATO GENERADO</span>
              <Button
                size="sm"
                onClick={() => handleSaveContract(content, contractType || 'servicios')}
                loading={savingContract !== null}
                className="gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Guardar
              </Button>
            </div>
            <div
              className="p-4 text-sm max-h-64 overflow-auto"
              dangerouslySetInnerHTML={{ __html: contractHtml }}
            />
            <div className="px-4 py-2 bg-amber-50 border-t border-amber-200 text-[11.5px] text-amber-900 leading-relaxed">
              <strong>⚠️ Documento generado por IA.</strong> Antes de firmar, revisalo con un abogado matriculado.
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMarkdown = (text: string): string => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/(<li>[\s\S]*?<\/li>)/gm, '<ul>$1</ul>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/^(?!<[h|u|b|l|p])/gm, '<p>$&')
      .replace(/\n/g, '<br>');
  };

  const advisorColor = advisor?.color || '#3b82f6';

  return (
    <div className="flex flex-col h-screen bg-[var(--surface-subtle)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[var(--surface)]/95 backdrop-blur-xl border-b border-[var(--border)] flex-shrink-0">
        <button
          onClick={() => router.push(`/advisor/${advisorId}`)}
          aria-label="Volver al asesor"
          className="p-2 text-[var(--text-muted)] hover:text-[var(--text-strong)] hover:bg-[var(--surface-subtle)] rounded-lg transition-colors flex-shrink-0"
        >
          <ArrowLeft className="w-4 h-4" strokeWidth={2.4} />
        </button>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `color-mix(in srgb, ${advisorColor} 14%, var(--surface))` }}
          aria-hidden="true"
        >
          {advisor?.icon || '⚖️'}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-display font-bold text-[var(--text-strong)] text-[14px] truncate tracking-tight">{advisor?.title || 'Asesor'}</h1>
          <p className="text-[11.5px] text-[var(--text-muted)] truncate">{advisor?.name}</p>
        </div>

        {/* Advisor switcher */}
        <div className="relative">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => setShowAdvisorPicker(!showAdvisorPicker)}
            className="gap-1.5"
          >
            Cambiar <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.4} />
          </Button>
          {showAdvisorPicker && (
            <div className="absolute right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-medium z-20 w-60 py-1.5">
              {advisors.map((a) => (
                <button
                  key={a.id}
                  onClick={() => {
                    setShowAdvisorPicker(false);
                    router.push(`/advisor?advisor=${a.id}`);
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm hover:bg-[var(--surface-subtle)] transition-colors disabled:opacity-50"
                  disabled={!a.available}
                >
                  <span aria-hidden="true">{a.icon}</span>
                  <span className={a.available ? 'text-[var(--text-strong)]' : 'text-[var(--text-muted)]'}>{a.name}</span>
                  {!a.available && (
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[var(--cta-dark)] bg-[var(--cta-bg)] px-1.5 py-0.5 rounded">
                      Pro
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={clsx('flex chat-bubble-enter', msg.role === 'user' ? 'justify-end' : 'justify-start')}
          >
            {msg.role === 'assistant' && (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mr-2 mt-0.5 shadow-soft"
                style={{ background: `color-mix(in srgb, ${advisorColor} 14%, var(--surface))` }}
                aria-hidden="true"
              >
                {advisor?.icon || '⚖️'}
              </div>
            )}
            <div
              className={clsx(
                'max-w-[78%] rounded-2xl px-4 py-3 shadow-soft',
                msg.role === 'user'
                  ? 'bg-[var(--primary)] text-white rounded-tr-md'
                  : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-strong)] rounded-tl-md',
              )}
            >
              {msg.role === 'assistant' ? renderMessageContent(msg.content) : (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div className="flex justify-start">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mr-2 shadow-soft"
              style={{ background: `color-mix(in srgb, ${advisorColor} 14%, var(--surface))` }}
              aria-hidden="true"
            >
              {advisor?.icon || '⚖️'}
            </div>
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl rounded-tl-md px-4 py-3 shadow-soft">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 rounded-full animate-bounce"
                    style={{ backgroundColor: advisorColor, animationDelay: `${i * 0.15}s` }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      {advisor?.quick_actions?.length > 0 && messages.length <= 1 && (
        <div className="px-4 md:px-6 pb-2 flex flex-wrap gap-2">
          {advisor.quick_actions.slice(0, 3).map((action: any, i: number) => (
            <button
              key={i}
              onClick={() => sendMessage(conversation?.id, action.prompt)}
              className="text-[12.5px] px-3 py-1.5 bg-[var(--surface)] border border-[var(--border)] rounded-full font-medium text-[var(--text-medium)] hover:text-[var(--text-strong)] hover:border-[var(--border-strong)] transition-all truncate max-w-[220px]"
            >
              {action.label}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="px-4 md:px-6 py-4 bg-[var(--surface)] border-t border-[var(--border)] flex-shrink-0">
        <div className="flex gap-3 items-end max-w-4xl mx-auto">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Escribí tu consulta a ${advisor?.name || 'tu asesor'}...`}
            rows={1}
            className="flex-1 field-textarea max-h-32 overflow-auto"
            style={{ minHeight: '46px' }}
            onInput={(e) => {
              const t = e.target as HTMLTextAreaElement;
              t.style.height = 'auto';
              t.style.height = Math.min(t.scrollHeight, 128) + 'px';
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || sending}
            aria-label="Enviar mensaje"
            className="magnetic-btn flex-shrink-0 h-11 w-11 rounded-xl text-white shadow-[0_8px_24px_rgba(230,126,34,0.35)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            style={{ backgroundColor: 'var(--cta)' }}
          >
            <Send className="w-4 h-4" strokeWidth={2.4} />
          </button>
        </div>
        <p className="text-center text-[12px] text-[var(--text-medium)] mt-2.5 max-w-3xl mx-auto leading-relaxed">
          <span className="font-semibold text-[var(--text-strong)]">Orientación IA — </span>
          {advisorId === 'legal' && '⚖️ no somos abogados ni reemplazamos asesoramiento legal matriculado.'}
          {advisorId === 'health' && '🏥 no somos médicos ni reemplazamos la consulta con un profesional de la salud.'}
          {advisorId === 'finance' && '💰 no somos contadores ni asesores financieros matriculados.'}
          {advisorId === 'psychology' && '💜 no reemplaza la terapia profesional. En emergencias llamá al 135 (AR) · 800-911-2000 (MX) · 106 (CO).'}
          {advisorId === 'home' && '🔧 para trabajos de gas o alta tensión consultá un profesional matriculado.'}
        </p>
      </div>
    </div>
  );
}

export default function AdvisorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>}>
      <AdvisorChat />
    </Suspense>
  );
}
