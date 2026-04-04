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

  // Exámenes
  EXAM_CREATED = 'admin.exam.created',
  EXAM_UPDATED = 'admin.exam.updated',
  EXAM_DELETED = 'admin.exam.deleted',

  // Categorías
  CATEGORY_CREATED = 'admin.category.created',
  CATEGORY_UPDATED = 'admin.category.updated',
  CATEGORY_DELETED = 'admin.category.deleted',

  // Inventario
  INVENTORY_ITEM_CREATED = 'admin.inventory.created',
  INVENTORY_ITEM_UPDATED = 'admin.inventory.updated',
  INVENTORY_ITEM_DELETED = 'admin.inventory.deleted',

  // Movimientos de Stock
  STOCK_MOVEMENT_CREATED = 'admin.stock.movement.created',

  // Proveedores
  SUPPLIER_CREATED = 'admin.supplier.created',
  SUPPLIER_UPDATED = 'admin.supplier.updated',
  SUPPLIER_DELETED = 'admin.supplier.deleted',

  // Órdenes de Compra
  PURCHASE_ORDER_CREATED = 'admin.purchase_order.created',
  PURCHASE_ORDER_UPDATED = 'admin.purchase_order.updated',
  PURCHASE_ORDER_DELETED = 'admin.purchase_order.deleted',
  PURCHASE_ORDER_EMITTED = 'admin.purchase_order.emitted',
  PURCHASE_ORDER_RECEIVED = 'admin.purchase_order.received',
  PURCHASE_ORDER_CANCELLED = 'admin.purchase_order.cancelled',

  // Resultados
  RESULTADO_VALIDATED = 'admin.resultado.validated',
  RESULTADO_PDF_UPLOADED = 'admin.resultado.pdf_uploaded',
  RESULTADO_INSUMOS_DEDUCTED = 'admin.resultado.insumos_deducted',
  RESULTADO_INSUMOS_FAILED = 'admin.resultado.insumos_failed',
}

export interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

export interface AdminEventPayload {
  entityType: string;
  entityId: number;
  action: 'created' | 'updated' | 'deleted';
  userId: number; // Usuario admin que realizó la acción
  data?: any; // Datos adicionales del evento
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
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
  emitUserCreated(userId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.USER_CREATED, {
      entityType: 'user',
      entityId: userId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitUserUpdated(userId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.USER_UPDATED, {
      entityType: 'user',
      entityId: userId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitUserDeleted(userId: number, adminId: number, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.USER_DELETED, {
      entityType: 'user',
      entityId: userId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  // Exámenes
  emitExamCreated(examId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.EXAM_CREATED, {
      entityType: 'exam',
      entityId: examId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitExamUpdated(examId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.EXAM_UPDATED, {
      entityType: 'exam',
      entityId: examId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitExamDeleted(examId: number, adminId: number, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.EXAM_DELETED, {
      entityType: 'exam',
      entityId: examId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  // Roles
  emitRoleCreated(roleId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.ROLE_CREATED, {
      entityType: 'role',
      entityId: roleId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitRoleUpdated(roleId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.ROLE_UPDATED, {
      entityType: 'role',
      entityId: roleId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitRoleDeleted(roleId: number, adminId: number, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.ROLE_DELETED, {
      entityType: 'role',
      entityId: roleId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  // Categorías
  emitCategoryCreated(categoryId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.CATEGORY_CREATED, {
      entityType: 'category',
      entityId: categoryId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitCategoryUpdated(categoryId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.CATEGORY_UPDATED, {
      entityType: 'category',
      entityId: categoryId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitCategoryDeleted(categoryId: number, adminId: number, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.CATEGORY_DELETED, {
      entityType: 'category',
      entityId: categoryId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  // Inventario
  emitInventoryItemCreated(itemId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.INVENTORY_ITEM_CREATED, {
      entityType: 'inventory_item',
      entityId: itemId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitInventoryItemUpdated(itemId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.INVENTORY_ITEM_UPDATED, {
      entityType: 'inventory_item',
      entityId: itemId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitInventoryItemDeleted(itemId: number, adminId: number, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.INVENTORY_ITEM_DELETED, {
      entityType: 'inventory_item',
      entityId: itemId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  // Movimientos de Stock
  emitStockMovementCreated(movimiento: any, adminId: number, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.STOCK_MOVEMENT_CREATED, {
      entityType: 'stock_movement',
      entityId: movimiento.codigo_movimiento,
      action: 'created',
      userId: adminId,
      data: {
        codigo_item: movimiento.codigo_item,
        tipo_movimiento: movimiento.tipo_movimiento,
        cantidad: movimiento.cantidad,
        stock_anterior: movimiento.stock_anterior,
        stock_nuevo: movimiento.stock_nuevo,
        motivo: movimiento.motivo,
      },
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  // Proveedores
  emitSupplierCreated(supplierId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.SUPPLIER_CREATED, {
      entityType: 'supplier',
      entityId: supplierId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitSupplierUpdated(supplierId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.SUPPLIER_UPDATED, {
      entityType: 'supplier',
      entityId: supplierId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitSupplierDeleted(supplierId: number, adminId: number, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.SUPPLIER_DELETED, {
      entityType: 'supplier',
      entityId: supplierId,
      action: 'deleted',
      userId: adminId,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  // Órdenes de Compra
  emitPurchaseOrderCreated(purchaseOrderId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.PURCHASE_ORDER_CREATED, {
      entityType: 'purchase_order',
      entityId: purchaseOrderId,
      action: 'created',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitPurchaseOrderUpdated(purchaseOrderId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.PURCHASE_ORDER_UPDATED, {
      entityType: 'purchase_order',
      entityId: purchaseOrderId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitPurchaseOrderDeleted(purchaseOrderId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.PURCHASE_ORDER_DELETED, {
      entityType: 'purchase_order',
      entityId: purchaseOrderId,
      action: 'deleted',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitPurchaseOrderEmitted(purchaseOrderId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.PURCHASE_ORDER_EMITTED, {
      entityType: 'purchase_order',
      entityId: purchaseOrderId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitPurchaseOrderReceived(purchaseOrderId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.PURCHASE_ORDER_RECEIVED, {
      entityType: 'purchase_order',
      entityId: purchaseOrderId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitPurchaseOrderCancelled(purchaseOrderId: number, adminId: number, data?: any, ctx?: RequestContext) {
    this.emitEvent(AdminEventType.PURCHASE_ORDER_CANCELLED, {
      entityType: 'purchase_order',
      entityId: purchaseOrderId,
      action: 'updated',
      userId: adminId,
      data,
      timestamp: new Date(),
      ipAddress: ctx?.ipAddress,
      userAgent: ctx?.userAgent,
    });
  }

  emitResultadoValidated(resultadoId: number, userId: number, data?: any) {
    this.emitEvent(AdminEventType.RESULTADO_VALIDATED, {
      entityType: 'resultado',
      entityId: resultadoId,
      action: 'updated',
      userId,
      data,
      timestamp: new Date(),
    });
  }

  emitResultadoPdfUploaded(resultadoId: number, userId: number, data?: any) {
    this.emitEvent(AdminEventType.RESULTADO_PDF_UPLOADED, {
      entityType: 'resultado',
      entityId: resultadoId,
      action: 'updated',
      userId,
      data,
      timestamp: new Date(),
    });
  }

  emitResultadoInsumosDeducted(resultadoId: number, userId: number, data?: any) {
    this.emitEvent(AdminEventType.RESULTADO_INSUMOS_DEDUCTED, {
      entityType: 'resultado',
      entityId: resultadoId,
      action: 'updated',
      userId,
      data,
      timestamp: new Date(),
    });
  }

  emitResultadoInsumosFailed(resultadoId: number, userId: number, data?: any) {
    this.emitEvent(AdminEventType.RESULTADO_INSUMOS_FAILED, {
      entityType: 'resultado',
      entityId: resultadoId,
      action: 'updated',
      userId,
      data,
      timestamp: new Date(),
    });
  }
}
