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
  ValidationPipe,
  UsePipes,
  NotFoundException,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { getAllRoleLevels, getPermissionsForLevel } from './constants/role-permissions';
import {
  CreateUserDto,
  UpdateUserDto,
  ResetPasswordDto,
  CreateRoleDto,
  UpdateRoleDto,
  CreateServiceDto,
  UpdateServiceDto,
  CreateLocationDto,
  UpdateLocationDto,
  CreateExamDto,
  UpdateExamDto,
  CreatePriceDto,
  UpdatePriceDto,
  CreateCategoryDto,
  UpdateCategoryDto,
  CreatePackageDto,
  UpdatePackageDto,
  CreateInventoryItemDto,
  UpdateInventoryItemDto,
  CreateSupplierDto,
  UpdateSupplierDto,
} from './dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN') // Solo administradores pueden acceder
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // ==================== USUARIOS ====================

  @Get('users')
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.adminService.getAllUsers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      filters,
    );
  }

  @Get('users/:id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getUserById(id);
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateUserDto,
  ) {
    return this.adminService.createUser(data, adminId);
  }

  @Put('users/:id')
  async updateUser(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDto,
  ) {
    return this.adminService.updateUser(id, data, adminId);
  }

  @Delete('users/:id')
  async deleteUser(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteUser(id, adminId);
  }

  @Put('users/:id/toggle-status')
  async toggleUserStatus(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.toggleUserStatus(id, adminId);
  }

  @Post('users/:id/reset-password')
  async resetUserPassword(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: ResetPasswordDto,
  ) {
    return this.adminService.resetUserPassword(id, data.newPassword, adminId);
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
  ) {
    return this.adminService.updateRole(id, data, adminId);
  }

  @Delete('roles/:id')
  async deleteRole(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteRole(id, adminId);
  }

  // ==================== SERVICIOS ====================

  @Get('services')
  async getAllServices() {
    return this.adminService.getAllServices();
  }

  @Get('services/:id')
  async getServiceById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getServiceById(id);
  }

  @Post('services')
  @HttpCode(HttpStatus.CREATED)
  async createService(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateServiceDto,
  ) {
    return this.adminService.createService(data, adminId);
  }

  @Put('services/:id')
  async updateService(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateServiceDto,
  ) {
    return this.adminService.updateService(id, data, adminId);
  }

  @Delete('services/:id')
  async deleteService(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteService(id, adminId);
  }

  // ==================== SEDES ====================

  @Get('locations')
  async getAllLocations() {
    return this.adminService.getAllLocations();
  }

  @Get('locations/:id')
  async getLocationById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getLocationById(id);
  }

  @Post('locations')
  @HttpCode(HttpStatus.CREATED)
  async createLocation(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateLocationDto,
  ) {
    return this.adminService.createLocation(data, adminId);
  }

  @Put('locations/:id')
  async updateLocation(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateLocationDto,
  ) {
    return this.adminService.updateLocation(id, data, adminId);
  }

  @Delete('locations/:id')
  async deleteLocation(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteLocation(id, adminId);
  }

  // ==================== EXAMENES ====================

  @Get('exams')
  async getAllExams(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.adminService.getAllExams(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      filters,
    );
  }

  @Get('exams/:id')
  async getExamById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getExamById(id);
  }

  @Post('exams')
  @HttpCode(HttpStatus.CREATED)
  async createExam(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateExamDto,
  ) {
    return this.adminService.createExam(data, adminId);
  }

  @Put('exams/:id')
  async updateExam(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateExamDto,
  ) {
    return this.adminService.updateExam(id, data, adminId);
  }

  @Delete('exams/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExam(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteExam(id, adminId);
  }

  // ==================== PRECIOS ====================

  @Post('prices')
  @HttpCode(HttpStatus.CREATED)
  async createPrice(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreatePriceDto,
  ) {
    return this.adminService.createPrice(data, adminId);
  }

  @Put('prices/:id')
  async updatePrice(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePriceDto,
  ) {
    return this.adminService.updatePrice(id, data, adminId);
  }

  // ==================== CATEGORIAS ====================

  @Get('exam-categories')
  async getAllExamCategories() {
    return this.adminService.getAllExamCategories();
  }

  @Post('exam-categories')
  @HttpCode(HttpStatus.CREATED)
  async createExamCategory(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateCategoryDto,
  ) {
    return this.adminService.createExamCategory(data, adminId);
  }

  @Put('exam-categories/:id')
  async updateExamCategory(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateCategoryDto,
  ) {
    return this.adminService.updateExamCategory(id, data, adminId);
  }

  @Delete('exam-categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExamCategory(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteExamCategory(id, adminId);
  }

  // ==================== PAQUETES ====================

  @Get('packages')
  async getAllPackages() {
    return this.adminService.getAllPackages();
  }

  @Get('packages/:id')
  async getPackageById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getPackageById(id);
  }

  @Post('packages')
  @HttpCode(HttpStatus.CREATED)
  async createPackage(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreatePackageDto,
  ) {
    return this.adminService.createPackage(data, adminId);
  }

  @Put('packages/:id')
  async updatePackage(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdatePackageDto,
  ) {
    return this.adminService.updatePackage(id, data, adminId);
  }

  @Delete('packages/:id')
  async deletePackage(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deletePackage(id, adminId);
  }

  // ==================== INVENTARIO ====================

  @Get('inventory/items')
  async getAllInventoryItems(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.adminService.getAllInventoryItems(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      filters,
    );
  }

  @Get('inventory/items/:id')
  async getInventoryItemById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getInventoryItemById(id);
  }

  @Post('inventory/items')
  @HttpCode(HttpStatus.CREATED)
  async createInventoryItem(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateInventoryItemDto,
  ) {
    return this.adminService.createInventoryItem(data, adminId);
  }

  @Put('inventory/items/:id')
  async updateInventoryItem(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateInventoryItemDto,
  ) {
    return this.adminService.updateInventoryItem(id, data, adminId);
  }

  @Delete('inventory/items/:id')
  async deleteInventoryItem(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteInventoryItem(id, adminId);
  }

  // ==================== PROVEEDORES ====================

  @Get('suppliers')
  async getAllSuppliers() {
    return this.adminService.getAllSuppliers();
  }

  @Get('suppliers/:id')
  async getSupplierById(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.getSupplierById(id);
  }

  @Post('suppliers')
  @HttpCode(HttpStatus.CREATED)
  async createSupplier(
    @CurrentUser('codigo_usuario') adminId: number,
    @Body() data: CreateSupplierDto,
  ) {
    return this.adminService.createSupplier(data, adminId);
  }

  @Put('suppliers/:id')
  async updateSupplier(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateSupplierDto,
  ) {
    return this.adminService.updateSupplier(id, data, adminId);
  }

  @Delete('suppliers/:id')
  async deleteSupplier(
    @CurrentUser('codigo_usuario') adminId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.adminService.deleteSupplier(id, adminId);
  }

  // ==================== AUDITORIA ====================

  @Get('audit/activity-logs')
  async getActivityLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.adminService.getActivityLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      filters,
    );
  }

  @Get('audit/error-logs')
  async getErrorLogs(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query() filters?: any,
  ) {
    return this.adminService.getErrorLogs(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
      filters,
    );
  }

  // ==================== ESTADÍSTICAS ====================

  @Get('dashboard/stats')
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }
}
