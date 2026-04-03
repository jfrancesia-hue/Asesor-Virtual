import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CurrentUser, JwtPayload } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { IsEmail, IsString, IsOptional, IsEnum, IsBoolean } from 'class-validator';

class InviteUserDto {
  @IsEmail() email: string;
  @IsString() fullName: string;
  @IsOptional() @IsEnum(['admin', 'member', 'viewer']) role?: string;
}

class UpdateUserDto {
  @IsOptional() @IsEnum(['admin', 'member', 'viewer']) role?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
}

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('owner', 'admin')
  list(@CurrentUser() user: JwtPayload) {
    return this.usersService.listUsers(user.tenantId);
  }

  @Post('invite')
  @Roles('owner', 'admin')
  invite(@CurrentUser() user: JwtPayload, @Body() dto: InviteUserDto) {
    return this.usersService.inviteUser(user.tenantId, user.sub, dto.email, dto.role || 'member', dto.fullName);
  }

  @Patch(':id')
  @Roles('owner', 'admin')
  update(@Param('id') id: string, @CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, user.tenantId, dto);
  }

  @Delete(':id')
  @Roles('owner', 'admin')
  deactivate(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.usersService.deactivateUser(id, user.tenantId, user.sub);
  }
}
