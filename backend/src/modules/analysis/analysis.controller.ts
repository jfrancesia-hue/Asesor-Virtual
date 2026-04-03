import { Controller, Get, Param, Query, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AnalysisService } from './analysis.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('analysis')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.analysisService.listAssessments(user.tenantId, page, limit);
  }

  @Get('overview')
  overview(@CurrentUser() user: JwtPayload) {
    return this.analysisService.getOverview(user.tenantId);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.analysisService.getAssessment(id, user.tenantId);
  }
}
