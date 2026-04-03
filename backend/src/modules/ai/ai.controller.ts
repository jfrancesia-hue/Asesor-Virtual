import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  Res,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { AiService } from './ai.service';
import { CreateConversationDto, SendMessageDto, AnalyzeDocumentDto } from './ai.dto';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('advisors')
  listAdvisors(@CurrentUser() user: JwtPayload) {
    return this.aiService.listAdvisors(user.tenantId);
  }

  @Get('advisors/:id')
  getAdvisor(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.aiService.getAdvisor(id, user.tenantId);
  }

  @Post('conversation')
  createConversation(@Body() dto: CreateConversationDto, @CurrentUser() user: JwtPayload) {
    return this.aiService.createConversation(dto, user.sub, user.tenantId);
  }

  @Post('conversation/:id/message')
  sendMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.aiService.sendMessage(id, dto, user.sub, user.tenantId);
  }

  @ApiOperation({ summary: 'Envía mensaje con respuesta en streaming (SSE)' })
  @Post('conversation/:id/stream')
  async streamMessage(
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
    @Req() req: Request,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();

    // Handle client disconnect
    let clientDisconnected = false;
    req.on('close', () => { clientDisconnected = true; });

    const send = (data: object) => {
      if (!clientDisconnected) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    };

    try {
      const generator = this.aiService.streamMessage(id, dto, user.sub, user.tenantId);

      for await (const chunk of generator) {
        if (clientDisconnected) break;
        send(chunk);
      }
    } catch (error) {
      send({ type: 'error', error: error.message || 'Error en el servicio de IA' });
    } finally {
      res.end();
    }
  }

  @Get('conversation/:id')
  getConversation(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.aiService.getConversation(id, user.tenantId);
  }

  @Get('conversations')
  listConversations(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('advisor_id') advisorId?: string,
  ) {
    return this.aiService.listConversations(user.tenantId, user.sub, page, limit, advisorId);
  }

  @Post('analyze')
  analyzeDocument(@Body() dto: AnalyzeDocumentDto, @CurrentUser() user: JwtPayload) {
    return this.aiService.analyzeDocument(dto, user.sub, user.tenantId);
  }
}
