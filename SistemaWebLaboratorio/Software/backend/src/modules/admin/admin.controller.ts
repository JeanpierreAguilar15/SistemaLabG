import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { APP_ROLES } from '../auth/constants/roles.constants';
import { getAllRoleLevels, getPermissionsForLevel } from './constants/role-permissions';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  CreateRoleDto,
  UpdateRoleDto,
  CreateExamDto,
  UpdateExamDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(APP_ROLES.ADMINISTRADOR)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  // ==================== USUARIOS ====================

  @Get('users')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async getAllUsers(
    @CurrentUser('rol') actorRole: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.usersService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      filters,
      actorRole,
    );
  }

  @Get('users/blocked')
  @ApiOperation({ summary: 'Obtener usuarios con cuentas bloqueadas' })
  async getBlockedUsers() {
    return this.adminService.getBlockedUsers();
  }

  @Get('users/:id')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async getUserById(
    @CurrentUser('rol') actorRole: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.findOne(id, actorRole);
  }

  @Post('users')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @CurrentUser('codigo_usuario') adminId: number,
    @CurrentUser('rol') actorRole: string,
    @Body() data: CreateUserDto,
  ) {
    return this.usersService.create(data, adminId, actorRole);
  }

  @Put('users/:id')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async updateUser(
    @CurrentUser('codigo_usuario') adminId: number,
    @CurrentUser('rol') actorRole: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ) {
    return this.usersService.update(id, data, adminId, actorRole);
  }

  @Delete('users/:id')
  async deleteUser(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.usersService.delete(id, adminId);
  }

  @Put('users/:id/toggle-status')
  async toggleUserStatus(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('force') force?: string,
  ) {
    return this.usersService.toggleStatus(id, adminId, force === 'true');
  }

  @Post('users/:id/reset-password')
  async resetUserPassword(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ResetPasswordDto,
  ) {
    return this.usersService.resetPassword(id, data.newPassword, adminId);
  }

  @Post('users/:id/unlock')
  @ApiOperation({ summary: 'Desbloquear cuenta de usuario' })
  async unlockUserAccount(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('codigo_usuario') adminId: number,
  ) {
    return this.adminService.unlockUserAccount(id, adminId);
  }

  // ==================== ROLES ====================

  @Get('roles/permissions')
  async getRolePermissions() {
    return getAllRoleLevels();
  }

  @Get('roles/permissions/:nivel')
  async getPermissionsByLevel(@Param('nivel', ParseIntPipe) nivel: number) {
    const permissions = getPermissionsForLevel(nivel);
    if (!permissions) {
      throw new NotFoundException(`No se encontraron permisos para el nivel ${nivel}`);
    }
    return permissions;
  }

  @Get('roles')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async getAllRoles() {
    return this.adminService.getAllRoles();
  }

  @Get('roles/:id')
  async getRoleById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getRoleById(id);
  }

  @Post('roles')
  @HttpCode(HttpStatus.CREATED)
  async createRole(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateRoleDto,
  ) {
    return this.adminService.createRole(data, adminId);
  }

  @Put('roles/:id')
  async updateRole(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateRoleDto,
    @Query('force') force?: string,
  ) {
    return this.adminService.updateRole(id, data, adminId, force === 'true');
  }

  @Delete('roles/:id')
  async deleteRole(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteRole(id, adminId);
  }

  // ==================== EXAMENES ====================

  @Get('exams')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async getAllExams(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.adminService.getAllExams(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      filters,
    );
  }

  @Get('exams/:id')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async getExamById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getExamById(id);
  }

  @Post('exams')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  @HttpCode(HttpStatus.CREATED)
  async createExam(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateExamDto,
  ) {
    return this.adminService.createExam(data, adminId);
  }

  @Put('exams/:id')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async updateExam(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateExamDto,
  ) {
    return this.adminService.updateExam(id, data, adminId);
  }

  @Delete('exams/:id')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExam(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteExam(id, adminId);
  }

  // ==================== CATEGORIAS ====================

  @Get('exam-categories')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async getAllExamCategories() {
    return this.adminService.getAllExamCategories();
  }

  @Post('exam-categories')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  @HttpCode(HttpStatus.CREATED)
  async createExamCategory(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateCategoryDto,
  ) {
    return this.adminService.createExamCategory(data, adminId);
  }

  @Put('exam-categories/:id')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async updateExamCategory(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCategoryDto,
  ) {
    return this.adminService.updateExamCategory(id, data, adminId);
  }

  @Delete('exam-categories/:id')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExamCategory(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteExamCategory(id, adminId);
  }

  // ==================== AUDITORIA ====================

  @Get('audit/activity-logs')
  async getActivityLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.adminService.getActivityLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      filters,
    );
  }

  @Get('audit/activity-logs/pdf')
  async getActivityLogsPdf(
    @Query() filters: any,
    @Res({ passthrough: true }) res: Response,
  ) {
    const pdfBuffer = await this.adminService.generateAuditPdf(filters);

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=reporte-auditoria-${new Date().toISOString().split('T')[0]}.pdf`,
    });

    return new StreamableFile(pdfBuffer);
  }

  @Get('audit/error-logs')
  async getErrorLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.adminService.getErrorLogs(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
      filters,
    );
  }

  // ==================== ESTADISTICAS ====================

  @Get('dashboard/stats')
  @Roles(APP_ROLES.ADMINISTRADOR, APP_ROLES.PERSONAL_LABORATORIO)
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  // ==================== CONFIGURACION DEL SISTEMA ====================

  @Get('config')
  @ApiOperation({ summary: 'Obtener todas las configuraciones del sistema' })
  async getSystemConfig(@Query('grupo') grupo?: string) {
    return this.adminService.getSystemConfig(grupo);
  }

  @Get('config/security')
  @ApiOperation({ summary: 'Obtener configuracion de seguridad de login' })
  async getSecurityConfig() {
    return this.adminService.getSecurityConfig();
  }

  @Put('config/:clave')
  @ApiOperation({ summary: 'Actualizar una configuracion del sistema' })
  async updateSystemConfig(
    @Param('clave') clave: string,
    @Body('valor') valor: string,
    @CurrentUser('codigo_usuario') adminId: number,
  ) {
    return this.adminService.updateSystemConfig(clave, valor, adminId);
  }

  @Post('config/security/init')
  @ApiOperation({ summary: 'Inicializar configuraciones de seguridad por defecto' })
  async initSecurityConfigs() {
    return this.adminService.ensureSecurityConfigs();
  }
}
