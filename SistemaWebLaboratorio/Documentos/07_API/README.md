# Documentación API

Esta carpeta contiene la documentación de las APIs del sistema.

## Archivos

- **openapi-dialogflow.yaml** - Especificación OpenAPI para el webhook de Dialogflow (chatbot)

## Swagger UI

La documentación interactiva de la API REST está disponible en:
- `http://localhost:3001/api/docs` (cuando el backend está corriendo)

## Endpoints Principales

| Módulo | Ruta Base | Descripción |
|--------|-----------|-------------|
| Auth | `/api/v1/auth` | Autenticación y registro |
| Users | `/api/v1/users` | Gestión de usuarios |
| Appointments | `/api/v1/appointments` | Citas y slots |
| Catalog | `/api/v1/catalog` | Catálogo de exámenes |
| Quotations | `/api/v1/quotations` | Cotizaciones |
| Payments | `/api/v1/payments` | Pagos |
| Results | `/api/v1/resultados` | Resultados de laboratorio |
| Inventory | `/api/v1/inventory` | Inventario |
| Chat | `/api/v1/chat` | Chat en vivo |
| Dialogflow | `/api/v1/dialogflow-webhook` | Webhook del chatbot |
