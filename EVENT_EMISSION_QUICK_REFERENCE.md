# AdminService Event Emissions - Quick Reference Guide

## Executive Summary

| Metric | Value | Status |
|--------|-------|--------|
| **Total Events Defined** | 24 | ✅ Complete |
| **Active Emissions** | 9 | ⚠️ Partial |
| **Missing Emissions** | 21 | ❌ Critical |
| **Event Listeners** | 0 | ❌ Critical |
| **Overall Implementation** | 30% | ⚠️ Incomplete |

---

## What's Actually Emitting Events (9 operations)

### Users (4 events working)
```typescript
createUser()      → emitUserCreated()       ✅
updateUser()      → emitUserUpdated()       ✅
deleteUser()      → emitUserDeleted()       ✅
toggleUserStatus()→ emitEvent(...status...) ✅
resetUserPassword()→ [MISSING]              ❌
```

### Exams (3 events working)
```typescript
createExam()      → emitExamCreated()       ✅
updateExam()      → emitExamUpdated()       ✅
deleteExam()      → emitExamDeleted()       ✅
```

### Prices (2 events working)
```typescript
createPrice()     → emitPriceCreated()      ✅
updatePrice()     → emitPriceUpdated()      ✅
deletePrice()     → [NOT IMPLEMENTED]       ❌
```

---

## What's NOT Emitting Events (21 operations)

### Complete Entities with Zero Events
```
Roles        → 0/3 CRUD ops have events
Services     → 0/3 CRUD ops have events
Locations    → 0/3 CRUD ops have events
Categories   → 0/3 CRUD ops have events
Packages     → 0/3 CRUD ops have events
Inventory    → 0/3 CRUD ops have events
Suppliers    → 0/3 CRUD ops have events
```

### Special Cases
```
Password Reset   → No event method exists
Price Deletion   → No method in AdminService
```

---

## Event Architecture Overview

### The Pattern

```
admin.<entity>.<action>

Examples:
- admin.user.created
- admin.exam.updated
- admin.price.deleted
- admin.user.status_changed
- admin.*  (wildcard - catches all)
```

### Payload Structure

```typescript
{
  entityType: string,           // 'user', 'exam', 'price', etc
  entityId: number,             // Primary key of entity
  action: 'created'|'updated'|'deleted',
  userId: number,               // Admin who performed action [HARDCODED TO 0!]
  data?: any,                   // Entity-specific metadata
  timestamp: Date               // When event occurred
}
```

### Technology
- **Framework**: NestJS
- **Library**: @nestjs/event-emitter (EventEmitter2)
- **Configuration**: 
  - Wildcard enabled (dot notation supported)
  - Max 10 listeners per event
  - Located in AdminModule

---

## Critical Issues

### Issue #1: Hardcoded Admin ID [HIGH SEVERITY]

**Location**: admin.service.ts lines 134, 188, 574, 612, 660, 694

**Problem**:
```typescript
// WRONG ❌
this.eventsService.emitUserCreated(
  user.codigo_usuario,
  0,  // Admin ID always 0
  data
);
```

**Impact**: 
- Cannot track which admin performed actions
- Audit trail useless
- Violates GDPR/compliance requirements

**Fix Required**:
```typescript
// CORRECT ✅
this.eventsService.emitUserCreated(
  user.codigo_usuario,
  this.getCurrentAdminId(),  // Get from request context
  data
);
```

---

### Issue #2: Defined but Unused Methods [HIGH SEVERITY]

**15 convenience methods exist but are NEVER CALLED**

```typescript
// admin-events.service.ts has these methods:
emitRoleCreated()      // Never called
emitRoleUpdated()      // Never called
emitRoleDeleted()      // Never called
emitServiceCreated()   // Never called
emitServiceUpdated()   // Never called
emitServiceDeleted()   // Never called
emitLocationCreated()  // Never called
emitLocationUpdated()  // Never called
emitLocationDeleted()  // Never called
// ... etc (9 more methods)

// But admin.service.ts CRUD operations don't call them!
```

**Example of Missing Call**:
```typescript
// admin.service.ts:298
async createRole(data: Prisma.RolCreateInput) {
  return this.prisma.rol.create({ data });
  // ❌ Missing: this.eventsService.emitRoleCreated(role.id, adminId);
}
```

---

### Issue #3: Zero Event Listeners [CRITICAL SEVERITY]

**Search Result**: No `@OnEvent` decorators found anywhere

**Impact**:
- All events emitted to void (wasted)
- No audit logging
- No user notifications
- No catalog updates
- No real-time data sync

**Example of Missing Listener** (should be in AuditoriaModule):
```typescript
// This should exist but doesn't ❌
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class AuditoriaService {
  @OnEvent('admin.*')
  handleAdminEvent(event: AdminEventPayload) {
    // Create audit log entry
    // Should be called for every admin action
  }
}
```

---

## What Needs to Be Done

### Tier 1: Complete Event Emissions (2-3 hours)
```
Priority: CRITICAL

Tasks:
1. Add emitRoleCreated/Updated/Deleted() calls to role operations
2. Add emitServiceCreated/Updated/Deleted() calls to service operations
3. Add emitLocationCreated/Updated/Deleted() calls to location operations
4. Add emitCategoryCreated/Updated/Deleted() calls to category operations
5. Add emitPackageCreated/Updated/Deleted() calls to package operations
6. Add emitInventoryCreated/Updated/Deleted() calls to inventory operations
7. Add emitSupplierCreated/Updated/Deleted() calls to supplier operations
8. Add emitUserPasswordReset() event to password reset operation
9. Add emitPriceDeleted() method and call it (if delete is needed)

File to modify: admin.service.ts (21 locations)
```

### Tier 2: Fix Admin ID Tracking (1 hour)
```
Priority: CRITICAL

Tasks:
1. Extract adminId from request context (@CurrentUser() decorator)
2. Pass adminId to all service methods
3. Remove hardcoded 0 from all emit() calls
4. Create or modify @CurrentUser() decorator if needed

Files to modify:
- admin.controller.ts (extract userId from context)
- admin.service.ts (accept adminId parameter, pass to events)
- admin-events.service.ts (already correct)
```

### Tier 3: Implement Event Listeners (4-6 hours)
```
Priority: HIGH

Create new services in each module with @OnEvent decorators:

1. AuditoriaModule:
   - Listen to admin.*
   - Create audit log entries
   
2. ComunicacionesModule:
   - Listen to admin.*
   - Send email/SMS notifications
   
3. CatalogoModule:
   - Listen to admin.exam.*, admin.price.*
   - Update public catalog
   
4. AgendaModule:
   - Listen to admin.service.*, admin.location.*
   - Sync appointment availability
   
5. ResultadosModule:
   - Listen to admin.exam.*
   - Update test availability
```

### Tier 4: Advanced Features (Future)
```
Priority: MEDIUM

1. Event persistence (database event store)
2. Event replay capability
3. Event versioning
4. Dead letter queue for failed handlers
5. Event ordering guarantees
6. Metrics and monitoring
7. Async event processing with queues
```

---

## File Locations & Line Numbers

### Main Event Files
```
/src/modules/admin/admin-events.service.ts   (273 lines)
  └─ Event type definitions (lines 4-54)
  └─ AdminEventPayload interface (lines 56-63)
  └─ emitEvent() method (lines 72-80)
  └─ Convenience methods (lines 87-273)

/src/modules/admin/admin.service.ts          (1326 lines)
  └─ User events: lines 132-244
  └─ Exam events: lines 572-638
  └─ Price events: lines 659-700
  └─ Missing: Roles, Services, Locations, Categories, Packages, Inventory, Suppliers

/src/modules/admin/admin.module.ts           (22 lines)
  └─ EventEmitterModule configuration (lines 11-16)
  └─ AdminEventsService export (line 20)

/src/modules/admin/admin.controller.ts       (422 lines)
  └─ 30 CRUD endpoints calling admin.service
  └─ No userId extraction from context
```

### Related Files
```
/src/modules/users/users.service.ts
  └─ Read-only service, no events
  
/src/modules/auditoria/
  └─ Empty stub - should listen to admin.* events
  
/src/modules/comunicaciones/
  └─ Empty stub - should listen to admin.* events
  
/src/modules/catalogo/
  └─ Empty stub - should listen to admin.exam.* events
  
/src/modules/agenda/
  └─ Empty stub - should listen to admin.service.* events
```

---

## Code Examples

### Example 1: How Events Are Currently Emitted

```typescript
// admin.service.ts Line 131-139
async createUser(data: any) {
  // ... validation ...
  
  const user = await this.prisma.usuario.create({
    data: { ...userData, password_hash, salt },
    include: { rol: true },
  });

  // Event emission ✅
  this.eventsService.emitUserCreated(
    user.codigo_usuario,
    0,  // ❌ Should be current admin ID
    { rol: user.rol.nombre, email: user.email, nombres: user.nombres }
  );

  return sanitizedUser;
}
```

### Example 2: How Role Creation Should Work

```typescript
// Current (BROKEN) - admin.service.ts Line 298
async createRole(data: Prisma.RolCreateInput) {
  return this.prisma.rol.create({ data });  // ❌ NO EVENT!
}

// Should be (FIXED):
async createRole(data: Prisma.RolCreateInput, adminId: number) {
  const role = await this.prisma.rol.create({ data });
  
  // Add this:
  this.eventsService.emitRoleCreated(
    role.codigo_rol,
    adminId,
    { nombre: role.nombre, nivel_acceso: role.nivel_acceso }
  );
  
  return role;
}
```

### Example 3: How Listeners Should Work

```typescript
// NEW FILE: src/modules/auditoria/auditoria.service.ts
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AdminEventPayload } from '../admin/admin-events.service';

@Injectable()
export class AuditoriaService {
  @OnEvent('admin.*')
  async handleAdminEvent(event: AdminEventPayload) {
    console.log(`Admin event: ${event.eventType}`, event);
    
    // Create audit log
    await this.prisma.logActividad.create({
      data: {
        codigo_usuario: event.userId,
        accion: `${event.action}_${event.entityType}`,
        entidad: event.entityType,
        id_entidad: event.entityId,
        fecha_accion: event.timestamp,
        detalles: JSON.stringify(event.data),
      },
    });
  }
}
```

### Example 4: How to Pass Admin ID from Controller

```typescript
// admin.controller.ts (Current - BROKEN)
@Post('users')
async createUser(@Body() data: CreateUserDto) {
  return this.adminService.createUser(data);
  // ❌ Admin ID not passed
}

// Should be (FIXED):
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Post('users')
async createUser(
  @Body() data: CreateUserDto,
  @CurrentUser() user: any  // Extract from JWT
) {
  return this.adminService.createUser(data, user.codigo_usuario);
}
```

---

## Testing the Current Implementation

### Check What Events Are Being Emitted

```bash
# Search for actual emit calls
grep -n "this.eventsService.emit" \
  src/modules/admin/admin.service.ts

# Output shows only 9 calls for:
# - 4 user operations
# - 3 exam operations  
# - 2 price operations
```

### Check What Events Are Being Listened To

```bash
# Search for event listeners
grep -r "@OnEvent" src/modules --include="*.ts"

# Output: (empty - no listeners found!)
```

### Check Event Infrastructure

```bash
# Verify EventEmitterModule is imported
grep -n "EventEmitterModule" \
  src/modules/admin/admin.module.ts

# Output: Lines 2, 11-16 - EventEmitterModule configured
```

---

## Next Steps

1. **Review** these documents: EVENT_EMISSION_ANALYSIS.md and EVENT_EMISSION_VISUAL_SUMMARY.md
2. **Prioritize** Tier 1 and 2 (complete emissions + fix admin ID)
3. **Create** event listener services in Tier 3 modules
4. **Test** by emitting events and verifying listeners receive them
5. **Monitor** admin operations for proper event propagation
6. **Document** new event patterns in your team wiki

---

## Questions to Consider

1. **Which modules should listen to which events?**
   - Auditoria: All (admin.*)
   - Comunicaciones: All (admin.*)
   - Catalogo: exam, price
   - Agenda: service, location
   - Results: exam

2. **Should events be persisted?**
   - Yes, for audit compliance
   - Consider event sourcing pattern

3. **Should there be async processing?**
   - For large operations, consider Bull/RabbitMQ
   - For now, in-memory EventEmitter2 is fine

4. **How should failures be handled?**
   - Listeners fail silently or with warnings?
   - Should failed events be retried?
   - Dead letter queue?

