import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

export enum AdminEventType {
  // Usuarios
  USER_CREATED = 'admin.user.created',
  USER_UPDATED = 'admin.user.updated',
  USER_DELETED = 'admin.user.deleted',
  USER_STATUS_CHANGED = 'admin.user.status_changed',

  // Roles
  ROLE_CREATED = 'admin.role.created',
  ROLE_UPDATED = 'admin.role.updated',
  ROLE_DELETED = 'admin.role.deleted',

  // Servicios
  SERVICE_CREATED = 'admin.service.created',
  SERVICE_UPDATED = 'admin.service.updated',
  SERVICE_DELETED = 'admin.service.deleted',

  // Sedes
  LOCATION_CREATED = 'admin.location.created',
  LOCATION_UPDATED = 'admin.location.updated',
  LOCATION_DELETED = 'admin.location.deleted',

  // Exámenes
  EXAM_CREATED = 'admin.exam.created',
  EXAM_UPDATED = 'admin.exam.updated',
  EXAM_DELETED = 'admin.exam.deleted',

  // Precios
  PRICE_CREATED = 'admin.price.created',
  PRICE_UPDATED = 'admin.price.updated',

  // Categorías
  CATEGORY_CREATED = 'admin.category.created',
  CATEGORY_UPDATED = 'admin.category.updated',
  CATEGORY_DELETED = 'admin.category.deleted',

  // Paquetes
  PACKAGE_CREATED = 'admin.package.created',
  PACKAGE_UPDATED = 'admin.package.updated',
  PACKAGE_DELETED = 'admin.package.deleted',

  // Inventario
  INVENTORY_ITEM_CREATED = 'admin.inventory.created',
  INVENTORY_ITEM_UPDATED = 'admin.inventory.updated',
  INVENTORY_ITEM_DELETED = 'admin.inventory.deleted',

  // Proveedores
  SUPPLIER_CREATED = 'admin.supplier.created',
  SUPPLIER_UPDATED = 'admin.supplier.updated',
  SUPPLIER_DELETED = 'admin.supplier.deleted',
}

export interface AdminEventPayload {
  entityType: string;
  entityId: number;
  action: 'created' | 'updated' | 'deleted';
  userId: number; // Usuario admin que realizó la acción
  data?: any; // Datos adicionales del evento
  timestamp: Date;
}

@Injectable()
export class AdminEventsService {
  constructor(private eventEmitter: EventEmitter2) {}

  /**
   * Emite un evento administrativo
   */
  emitEvent(eventType: AdminEventType, payload: AdminEventPayload) {
    this.eventEmitter.emit(eventType, payload);

    // También emitir un evento genérico para listeners que quieran escuchar todos los eventos admin
    this.eventEmitter.emit('admin.*', {
      eventType,
      ...payload,
    });
  }

  /**
   * Métodos de conveniencia para emitir eventos específicos
   */

  // Usuarios
  emitUserCreated(userId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.USER_CREATED, {
      entityType: 'user',
      entityId: userId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitUserUpdated(userId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.USER_UPDATED, {
      entityType: 'user',
      entityId: userId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitUserDeleted(userId: number, adminId: number) {
    this.emitEvent(AdminEventType.USER_DELETED, {
      entityType: 'user',
      entityId: userId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
    });
  }

  // Exámenes
  emitExamCreated(examId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.EXAM_CREATED, {
      entityType: 'exam',
      entityId: examId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitExamUpdated(examId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.EXAM_UPDATED, {
      entityType: 'exam',
      entityId: examId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitExamDeleted(examId: number, adminId: number) {
    this.emitEvent(AdminEventType.EXAM_DELETED, {
      entityType: 'exam',
      entityId: examId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
    });
  }

  // Precios
  emitPriceCreated(priceId: number, examId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.PRICE_CREATED, {
      entityType: 'price',
      entityId: priceId,
      action: 'created',
      userId: adminId,
      data: { ...data, examId },
      timestamp: new Date(),
    });
  }

  emitPriceUpdated(priceId: number, examId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.PRICE_UPDATED, {
      entityType: 'price',
      entityId: priceId,
      action: 'updated',
      userId: adminId,
      data: { ...data, examId },
      timestamp: new Date(),
    });
  }

  // Servicios
  emitServiceCreated(serviceId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.SERVICE_CREATED, {
      entityType: 'service',
      entityId: serviceId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitServiceUpdated(serviceId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.SERVICE_UPDATED, {
      entityType: 'service',
      entityId: serviceId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitServiceDeleted(serviceId: number, adminId: number) {
    this.emitEvent(AdminEventType.SERVICE_DELETED, {
      entityType: 'service',
      entityId: serviceId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
    });
  }

  // Sedes
  emitLocationCreated(locationId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.LOCATION_CREATED, {
      entityType: 'location',
      entityId: locationId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitLocationUpdated(locationId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.LOCATION_UPDATED, {
      entityType: 'location',
      entityId: locationId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitLocationDeleted(locationId: number, adminId: number) {
    this.emitEvent(AdminEventType.LOCATION_DELETED, {
      entityType: 'location',
      entityId: locationId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
    });
  }

  // Paquetes
  emitPackageCreated(packageId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.PACKAGE_CREATED, {
      entityType: 'package',
      entityId: packageId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitPackageUpdated(packageId: number, adminId: number, data?: any) {
    this.emitEvent(AdminEventType.PACKAGE_UPDATED, {
      entityType: 'package',
      entityId: packageId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
    });
  }

  emitPackageDeleted(packageId: number, adminId: number) {
    this.emitEvent(AdminEventType.PACKAGE_DELETED, {
      entityType: 'package',
      entityId: packageId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
    });
  }
}
