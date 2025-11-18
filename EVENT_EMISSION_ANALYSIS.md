# AdminService Event Emission Analysis Report

## Summary
The AdminService has a **well-designed event architecture that is only PARTIALLY IMPLEMENTED**. Event emissions are defined for 24 different event types but are only actively emitted in 9 operations. Most CRUD operations lack event emissions, and there are no event listeners or subscribers in the entire system.

---

## 1. Event Emitters Currently Implemented

### AdminEventsService Architecture
**File**: `/home/user/SistemaLabG/SistemaWebLaboratorio/Software/backend/src/modules/admin/admin-events.service.ts`

**Defined Event Types (24 total)**:
```typescript
enum AdminEventType {
  // Users (4 events)
  USER_CREATED = 'admin.user.created'
  USER_UPDATED = 'admin.user.updated'
  USER_DELETED = 'admin.user.deleted'
  USER_STATUS_CHANGED = 'admin.user.status_changed'
  
  // Roles (3 events - DEFINED BUT NOT USED)
  ROLE_CREATED = 'admin.role.created'
  ROLE_UPDATED = 'admin.role.updated'
  ROLE_DELETED = 'admin.role.deleted'
  
  // Services (3 events - DEFINED BUT NOT USED)
  SERVICE_CREATED = 'admin.service.created'
  SERVICE_UPDATED = 'admin.service.updated'
  SERVICE_DELETED = 'admin.service.deleted'
  
  // Locations/Sedes (3 events - DEFINED BUT NOT USED)
  LOCATION_CREATED = 'admin.location.created'
  LOCATION_UPDATED = 'admin.location.updated'
  LOCATION_DELETED = 'admin.location.deleted'
  
  // Exams (3 events - ACTIVELY USED)
  EXAM_CREATED = 'admin.exam.created'
  EXAM_UPDATED = 'admin.exam.updated'
  EXAM_DELETED = 'admin.exam.deleted'
  
  // Prices (2 events - PARTIALLY USED)
  PRICE_CREATED = 'admin.price.created'
  PRICE_UPDATED = 'admin.price.updated'
  
  // Categories (3 events - DEFINED BUT NOT USED)
  CATEGORY_CREATED = 'admin.category.created'
  CATEGORY_UPDATED = 'admin.category.updated'
  CATEGORY_DELETED = 'admin.category.deleted'
  
  // Packages (3 events - DEFINED BUT NOT USED)
  PACKAGE_CREATED = 'admin.package.created'
  PACKAGE_UPDATED = 'admin.package.updated'
  PACKAGE_DELETED = 'admin.package.deleted'
  
  // Inventory (3 events - DEFINED BUT NOT USED)
  INVENTORY_ITEM_CREATED = 'admin.inventory.created'
  INVENTORY_ITEM_UPDATED = 'admin.inventory.updated'
  INVENTORY_ITEM_DELETED = 'admin.inventory.deleted'
  
  // Suppliers (3 events - DEFINED BUT NOT USED)
  SUPPLIER_CREATED = 'admin.supplier.created'
  SUPPLIER_UPDATED = 'admin.supplier.updated'
  SUPPLIER_DELETED = 'admin.supplier.deleted'
}
```

### Event Emitter Implementation
**Technology**: NestJS EventEmitter2
**Configuration** (in admin.module.ts):
- Wildcard support enabled (allows `admin.*` to catch all admin events)
- Delimiter: `.` (supports hierarchical event names)
- Max listeners per event: 10

**Central Emit Method**:
```typescript
emitEvent(eventType: AdminEventType, payload: AdminEventPayload)
```

**Payload Structure**:
```typescript
interface AdminEventPayload {
  entityType: string;           // 'user', 'exam', 'price', etc.
  entityId: number;             // ID of affected entity
  action: 'created' | 'updated' | 'deleted';
  userId: number;               // Admin user who performed action
  data?: any;                   // Additional context data
  timestamp: Date;              // Event timestamp
}
```

---

## 2. Which CRUD Operations Have Events

### Actively Emitting Events (9 operations)

#### Users (4/6 CRUD operations)
- **CREATE**: ✅ Emitting `USER_CREATED`
  ```typescript
  // Line 132-136 in admin.service.ts
  this.eventsService.emitUserCreated(
    user.codigo_usuario,
    0, // TODO: Get from auth context
    { rol: user.rol.nombre, email: user.email, nombres: user.nombres }
  );
  ```

- **UPDATE**: ✅ Emitting `USER_UPDATED`
  ```typescript
  // Line 186-190
  this.eventsService.emitUserUpdated(
    codigo_usuario,
    0,
    { changedFields: Object.keys(data) }
  );
  ```

- **DELETE**: ✅ Emitting `USER_DELETED` (soft delete via activo flag)
  ```typescript
  // Line 213
  this.eventsService.emitUserDeleted(codigo_usuario, 0);
  ```

- **STATUS_CHANGE**: ✅ Emitting custom event via `emitEvent()`
  ```typescript
  // Line 234-244
  this.eventsService.emitEvent(
    'admin.user.status_changed' as any,
    { ... }
  );
  ```

- **PASSWORD_RESET**: ❌ NO EVENT (Line 250-266)
- **GET operations**: ❌ NO EVENTS (by design)

#### Exams (3/6 CRUD operations)
- **CREATE**: ✅ Emitting `EXAM_CREATED`
  ```typescript
  // Line 572-576
  this.eventsService.emitExamCreated(
    exam.codigo_examen,
    0,
    { nome: exam.nome, codigo_interno: exam.codigo_interno, activo: exam.activo }
  );
  ```

- **UPDATE**: ✅ Emitting `EXAM_UPDATED`
  ```typescript
  // Line 610-614
  this.eventsService.emitExamUpdated(
    codigo_examen,
    0,
    { changedFields: Object.keys(data) }
  );
  ```

- **DELETE**: ✅ Emitting `EXAM_DELETED` (soft delete via activo flag)
  ```typescript
  // Line 635
  this.eventsService.emitExamDeleted(codigo_examen, 0);
  ```

- **GET operations**: ❌ NO EVENTS

#### Prices (2/3 CRUD operations)
- **CREATE**: ✅ Emitting `PRICE_CREATED`
  ```typescript
  // Line 659-664
  this.eventsService.emitPriceCreated(
    price.codigo_precio,
    data.codigo_examen,
    0,
    { precio: price.precio, fecha_inicio: price.fecha_inicio }
  );
  ```

- **UPDATE**: ✅ Emitting `PRICE_UPDATED`
  ```typescript
  // Line 693-698
  this.eventsService.emitPriceUpdated(
    codigo_precio,
    price.codigo_examen,
    0,
    { changedFields: Object.keys(updateData) }
  );
  ```

- **DELETE**: ❌ NO DELETE METHOD EXISTS

#### Other Entities (0 operations)
- **Roles**: Convenience methods defined but NO CALLS in service CRUD
- **Services**: Convenience methods defined but NO CALLS in service CRUD
- **Locations**: Convenience methods defined but NO CALLS in service CRUD
- **Categories**: Convenience methods defined but NO CALLS in service CRUD
- **Packages**: Convenience methods defined but NO CALLS in service CRUD
- **Inventory**: Convenience methods defined but NO CALLS in service CRUD
- **Suppliers**: Convenience methods defined but NO CALLS in service CRUD

---

## 3. Which Operations Are Missing Events

### High-Priority Missing Events (Critical for audit/notifications)

| Entity | Operation | Location | Status |
|--------|-----------|----------|--------|
| Users | Password Reset | admin.service.ts:250-266 | ❌ NO EVENT |
| Roles | Create | admin.service.ts:298-301 | ❌ METHOD EXISTS, NOT CALLED |
| Roles | Update | admin.service.ts:304-317 | ❌ METHOD EXISTS, NOT CALLED |
| Roles | Delete | admin.service.ts:319-340 | ❌ METHOD EXISTS, NOT CALLED |
| Services | Create | admin.service.ts:374-378 | ❌ METHOD EXISTS, NOT CALLED |
| Services | Update | admin.service.ts:380-393 | ❌ METHOD EXISTS, NOT CALLED |
| Services | Delete | admin.service.ts:395-409 | ❌ METHOD EXISTS, NOT CALLED |
| Locations | Create | admin.service.ts:443-447 | ❌ METHOD EXISTS, NOT CALLED |
| Locations | Update | admin.service.ts:449-462 | ❌ METHOD EXISTS, NOT CALLED |
| Locations | Delete | admin.service.ts:464-478 | ❌ METHOD EXISTS, NOT CALLED |
| Categories | Create | admin.service.ts:716-720 | ❌ METHOD EXISTS, NOT CALLED |
| Categories | Update | admin.service.ts:722-735 | ❌ METHOD EXISTS, NOT CALLED |
| Categories | Delete | admin.service.ts:737-758 | ❌ METHOD EXISTS, NOT CALLED |
| Packages | Create | admin.service.ts:801-823 | ❌ METHOD EXISTS, NOT CALLED |
| Packages | Update | admin.service.ts:825-862 | ❌ METHOD EXISTS, NOT CALLED |
| Packages | Delete | admin.service.ts:864-878 | ❌ METHOD EXISTS, NOT CALLED |
| Inventory | Create | admin.service.ts:1006-1022 | ❌ METHOD EXISTS, NOT CALLED |
| Inventory | Update | admin.service.ts:1024-1040 | ❌ METHOD EXISTS, NOT CALLED |
| Inventory | Delete | admin.service.ts:1042-1056 | ❌ METHOD EXISTS, NOT CALLED |
| Suppliers | Create | admin.service.ts:1089-1107 | ❌ METHOD EXISTS, NOT CALLED |
| Suppliers | Update | admin.service.ts:1109-1138 | ❌ METHOD EXISTS, NOT CALLED |
| Suppliers | Delete | admin.service.ts:1140-1154 | ❌ METHOD EXISTS, NOT CALLED |
| Prices | Delete | NOT IMPLEMENTED | ❌ NO METHOD |

**Summary**: 21 operations have missing or incomplete event emissions out of 30 total CRUD operations.

---

## 4. Event Pattern Being Used

### NestJS EventEmitter2 Pattern
The system uses the standard NestJS Event-Driven Architecture:

1. **Event Definition**: Enum-based event type definitions
2. **Event Emission**: Service-based emit methods
3. **Hierarchical Naming**: Dot-notation (admin.entity.action)
4. **Generic Wildcard**: `admin.*` catches all admin events
5. **Payload Standardization**: Consistent AdminEventPayload interface

### Pattern Characteristics
```
Pattern: admin.<entity>.<action>
Examples:
- admin.user.created
- admin.exam.updated
- admin.price.deleted
- admin.user.status_changed

Wildcard Listener:
- admin.*  (catches all admin events)
- admin.user.*  (would catch all user events if listener existed)
```

### Convenience Methods Pattern
```typescript
// Generic method
emitEvent(eventType: AdminEventType, payload: AdminEventPayload)

// Specialized methods
emitUserCreated(userId, adminId, data?)
emitExamUpdated(examId, adminId, data?)
emitPriceCreated(priceId, examId, adminId, data?)
// ... etc
```

### TODO Issues Found
```typescript
// Line 134, 188, 574, etc.
0, // TODO: Obtener del contexto de autenticación
```
The `userId` (admin ID) is hardcoded as `0` instead of being extracted from the authentication context. This should be fixed to properly track which admin performed each action.

---

## 5. Are Events Being Propagated to Other Modules?

### Current Status: ❌ NO PROPAGATION DETECTED

#### Event Listeners Found
**Search Result**: Zero `@OnEvent` decorators found in entire codebase
```bash
grep -r "@OnEvent" /backend/src --include="*.ts"
# Returns: (no results)
```

#### Module Integration Status

| Module | Status | Notes |
|--------|--------|-------|
| **Catalogo** | Empty | `/modules/catalogo/catalogo.module.ts` - No implementation |
| **Agenda** | Empty | `/modules/agenda/agenda.module.ts` - No implementation |
| **Resultados** | Empty | `/modules/resultados/resultados.module.ts` - No service file |
| **Comunicaciones** | Empty | `/modules/comunicaciones/` - No service file |
| **Inventario** | Empty | `/modules/inventario/` - No service file |
| **Pagos** | Empty | `/modules/pagos/` - No service file |
| **Auditoria** | Empty | `/modules/auditoria/` - No service file |
| **Users** | Minimal | `/modules/users/users.service.ts` - Only read operations, no listeners |

#### Why Events Aren't Propagating

1. **No Listeners Implemented**: There are zero event listeners (`@OnEvent` decorators) anywhere
2. **Module Infrastructure Missing**: Other modules are empty stubs with no services
3. **No Cross-Module Integration**: AdminEventsService is only imported in AdminModule
4. **No Async Handlers**: No async task queues (Bull, RabbitMQ) configured

### Potential Integration Points (Not Yet Implemented)

**Patient-Facing Module Updates That Should Listen**:
- `Catalogo Module`: Should listen to `admin.exam.*` and `admin.price.*` to update public catalog
- `Agenda Module`: Should listen to `admin.service.*`, `admin.location.*` to sync appointment data
- `Comunicaciones Module`: Should listen to all admin events to send notifications
- `Auditoria Module`: Should listen to `admin.*` to create audit trails
- `Resultados Module`: Should listen to `admin.exam.*` for test availability

---

## Implementation Summary

### What's Implemented ✅
- Event type definitions (24 events)
- EventEmitter2 infrastructure
- Convenience emit methods
- Standardized payload structure
- 9 active event emissions (Users, Exams, Prices)
- Wildcard event support

### What's Partially Implemented ⚠️
- Event emissions for some entities (Users, Exams)
- Convenience methods defined but not called (Roles, Services, Locations, Categories, Packages, Inventory, Suppliers)

### What's Missing ❌
- Event listeners/subscribers (0 @OnEvent decorators)
- Cross-module event propagation
- Password reset events
- Price deletion events
- 21 CRUD operations lack events
- No async event handlers
- Authentication context for userId tracking (hardcoded to 0)
- No integration with patient-facing modules

---

## Recommendations

### Priority 1: Complete Event Emissions
1. Add event emissions to remaining CRUD operations (Roles, Services, Locations, etc.)
2. Implement password reset event emission
3. Add price deletion event
4. Fix userId tracking (extract from auth context instead of hardcoded 0)

### Priority 2: Implement Event Listeners
1. Create event listeners in Catalogo module for catalog updates
2. Create event listeners in Auditoria module for audit trail creation
3. Create event listeners in Comunicaciones module for notifications
4. Create event listeners in Agenda module for appointment availability updates

### Priority 3: Cross-Module Integration
1. Implement service event handlers
2. Set up async event processing (consider Bull or RabbitMQ for production)
3. Add event persistence for audit purposes
4. Create event replay mechanism for recovery

### Priority 4: Monitoring
1. Add event logging
2. Create event metrics/observability
3. Implement event validation
4. Add error handling for failed event emissions
