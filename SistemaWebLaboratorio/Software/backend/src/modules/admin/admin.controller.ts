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
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrador') // Solo administradores pueden acceder
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
  async createUser(@Body() data: any) {
    return this.adminService.createUser(data);
  }

  @Put('users/:id')
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updateUser(id, data);
  }

  @Delete('users/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }

  @Put('users/:id/toggle-status')
  async toggleUserStatus(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.toggleUserStatus(id);
  }

  @Post('users/:id/reset-password')
  async resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('newPassword') newPassword: string,
  ) {
    return this.adminService.resetUserPassword(id, newPassword);
  }

  // ==================== ROLES ====================

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
  async createRole(@Body() data: any) {
    return this.adminService.createRole(data);
  }

  @Put('roles/:id')
  async updateRole(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updateRole(id, data);
  }

  @Delete('roles/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteRole(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteRole(id);
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
  async createService(@Body() data: any) {
    return this.adminService.createService(data);
  }

  @Put('services/:id')
  async updateService(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updateService(id, data);
  }

  @Delete('services/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteService(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteService(id);
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
  async createLocation(@Body() data: any) {
    return this.adminService.createLocation(data);
  }

  @Put('locations/:id')
  async updateLocation(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updateLocation(id, data);
  }

  @Delete('locations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteLocation(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteLocation(id);
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
  async createExam(@Body() data: any) {
    return this.adminService.createExam(data);
  }

  @Put('exams/:id')
  async updateExam(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updateExam(id, data);
  }

  @Delete('exams/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExam(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteExam(id);
  }

  // ==================== PRECIOS ====================

  @Post('prices')
  @HttpCode(HttpStatus.CREATED)
  async createPrice(@Body() data: any) {
    return this.adminService.createPrice(data);
  }

  @Put('prices/:id')
  async updatePrice(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updatePrice(id, data);
  }

  // ==================== CATEGORIAS ====================

  @Get('exam-categories')
  async getAllExamCategories() {
    return this.adminService.getAllExamCategories();
  }

  @Post('exam-categories')
  @HttpCode(HttpStatus.CREATED)
  async createExamCategory(@Body() data: any) {
    return this.adminService.createExamCategory(data);
  }

  @Put('exam-categories/:id')
  async updateExamCategory(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updateExamCategory(id, data);
  }

  @Delete('exam-categories/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExamCategory(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteExamCategory(id);
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
  async createPackage(@Body() data: any) {
    return this.adminService.createPackage(data);
  }

  @Put('packages/:id')
  async updatePackage(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updatePackage(id, data);
  }

  @Delete('packages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePackage(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deletePackage(id);
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
  async createInventoryItem(@Body() data: any) {
    return this.adminService.createInventoryItem(data);
  }

  @Put('inventory/items/:id')
  async updateInventoryItem(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updateInventoryItem(id, data);
  }

  @Delete('inventory/items/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInventoryItem(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteInventoryItem(id);
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
  async createSupplier(@Body() data: any) {
    return this.adminService.createSupplier(data);
  }

  @Put('suppliers/:id')
  async updateSupplier(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ) {
    return this.adminService.updateSupplier(id, data);
  }

  @Delete('suppliers/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSupplier(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteSupplier(id);
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
