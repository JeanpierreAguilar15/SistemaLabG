import { APIRequestContext, expect, test } from '@playwright/test'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const ADMIN_CREDENTIALS = {
  identifier: 'admin@lab.com',
  password: 'admin123',
}

const PATIENT_CREDENTIALS = {
  identifier: 'maria.gonzalez@example.com',
  password: 'Paciente123!',
}

type JsonBody = Record<string, unknown>

async function parseBody(response: Awaited<ReturnType<APIRequestContext['get']>>) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text) as JsonBody
  } catch {
    return { raw: text }
  }
}

async function login(request: APIRequestContext, credentials: typeof ADMIN_CREDENTIALS) {
  const response = await request.post(`${API_URL}/auth/login`, { data: credentials })
  const body = await parseBody(response)
  expect(response.ok(), JSON.stringify(body)).toBeTruthy()
  expect(body?.access_token).toBeTruthy()

  return {
    token: body?.access_token as string,
    user: body?.user as JsonBody,
  }
}

function authHeaders(token: string) {
  return { Authorization: `Bearer ${token}` }
}

function unwrap(body: unknown): JsonBody {
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: JsonBody }).data
  }

  return body as JsonBody
}

function responseCandidates(body: unknown) {
  const data = unwrap(body)
  return [data, data?.orden, data?.lote, data?.item].filter(Boolean) as JsonBody[]
}

function pickNumber(body: unknown, ...keys: string[]) {
  for (const candidate of responseCandidates(body)) {
    for (const key of keys) {
      const value = candidate?.[key]
      if (typeof value === 'number') return value
    }
  }

  throw new Error(`No se encontro identificador numerico en respuesta: ${JSON.stringify(body)}`)
}

function pickString(body: unknown, ...keys: string[]) {
  for (const candidate of responseCandidates(body)) {
    for (const key of keys) {
      const value = candidate?.[key]
      if (typeof value === 'string') return value
    }
  }

  throw new Error(`No se encontro texto esperado en respuesta: ${JSON.stringify(body)}`)
}

async function getJson(request: APIRequestContext, path: string, token: string) {
  const response = await request.get(`${API_URL}${path}`, { headers: authHeaders(token) })
  const body = await parseBody(response)
  expect(response.status(), `${path}: ${JSON.stringify(body)}`).toBeLessThan(500)
  return { response, body }
}

async function postJson(request: APIRequestContext, path: string, token: string, data?: JsonBody) {
  const response = await request.post(`${API_URL}${path}`, {
    headers: authHeaders(token),
    data,
  })
  const body = await parseBody(response)
  expect(response.ok(), `${path}: ${JSON.stringify(body)}`).toBeTruthy()
  return body
}

async function putJson(request: APIRequestContext, path: string, token: string, data?: JsonBody) {
  const response = await request.put(`${API_URL}${path}`, {
    headers: authHeaders(token),
    data,
  })
  const body = await parseBody(response)
  expect(response.ok(), `${path}: ${JSON.stringify(body)}`).toBeTruthy()
  return body
}

function futureDate(days = 365) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString()
}

test.describe('Business flow e2e', () => {
  test('admin completes supply-to-result flow and patient sees the validated result', async ({ request }) => {
    const runId = Date.now().toString()
    const shortRunId = runId.slice(-8)
    const admin = await login(request, ADMIN_CREDENTIALS)
    const patient = await login(request, PATIENT_CREDENTIALS)
    const patientId = pickNumber(patient.user, 'codigo_usuario')

    const supplier = await postJson(request, '/admin/suppliers', admin.token, {
      ruc: `17${shortRunId}001`,
      razon_social: `Proveedor E2E ${shortRunId}`,
      nombre_comercial: `Prov E2E ${shortRunId}`,
      telefono: '0999999999',
      email: `proveedor-e2e-${shortRunId}@example.com`,
      direccion: 'Quito',
      activo: true,
    })
    const supplierId = pickNumber(supplier, 'codigo_proveedor')

    const inventoryCategory = await postJson(request, '/admin/inventory/categories', admin.token, {
      nombre: `Reactivos E2E ${shortRunId}`,
      descripcion: 'Categoria creada por prueba e2e',
    })
    const inventoryCategoryId = pickNumber(inventoryCategory, 'codigo_categoria')

    const item = await postJson(request, '/admin/inventory/items', admin.token, {
      codigo_categoria: inventoryCategoryId,
      codigo_interno: `REAC-E2E-${shortRunId}`,
      nombre: `Reactivo E2E ${shortRunId}`,
      descripcion: 'Reactivo creado por flujo e2e',
      unidad_medida: 'Caja',
      stock_actual: 0,
      stock_minimo: 2,
      stock_maximo: 50,
      costo_unitario: 3.5,
      precio_venta: 7,
      activo: true,
      es_reactivo: true,
      vida_util_dias_abierto: 30,
      capacidad_pruebas: 20,
    })
    const itemId = pickNumber(item, 'codigo_item')

    const purchaseOrder = await postJson(request, '/admin/purchase-orders', admin.token, {
      codigo_proveedor: supplierId,
      observaciones: 'Orden creada por flujo e2e',
      items: [
        {
          codigo_item: itemId,
          cantidad: 5,
          precio_unitario: 3.5,
          observaciones: 'Compra inicial e2e',
        },
      ],
    })
    const purchaseOrderId = pickNumber(purchaseOrder, 'codigo_orden_compra')

    const emittedOrder = await postJson(request, `/admin/purchase-orders/${purchaseOrderId}/emit`, admin.token)
    expect(pickString(emittedOrder, 'estado')).toBe('EMITIDA')

    const receivedOrder = await postJson(request, `/admin/purchase-orders/${purchaseOrderId}/receive`, admin.token, {
      notas_recepcion: 'Recepcion completa e2e',
      items_recibidos: [
        {
          codigo_item: itemId,
          cantidad_recibida: 5,
          numero_lote: `LOTE-E2E-${shortRunId}`,
          fecha_vencimiento: futureDate(),
          observaciones: 'Lote recibido por e2e',
        },
      ],
    })
    expect(['RECIBIDA', 'RECIBIDA_PARCIAL']).toContain(pickString(receivedOrder, 'estado'))

    const { body: itemAfterReceive } = await getJson(request, `/admin/inventory/items/${itemId}`, admin.token)
    expect(pickNumber(itemAfterReceive, 'stock_actual')).toBe(5)

    await postJson(request, '/admin/inventory/movements', admin.token, {
      codigo_item: itemId,
      tipo_movimiento: 'SALIDA',
      cantidad: 1,
      motivo: 'Consumo manual e2e',
    })

    const { body: itemAfterManualMovement } = await getJson(request, `/admin/inventory/items/${itemId}`, admin.token)
    expect(pickNumber(itemAfterManualMovement, 'stock_actual')).toBe(4)

    const { body: kardex } = await getJson(request, `/admin/inventory/kardex/${itemId}`, admin.token)
    const kardexRows = Array.isArray(kardex) ? kardex : (unwrap(kardex)?.movimientos as unknown[])
    expect(kardexRows?.length).toBeGreaterThan(0)

    const { body: lotes } = await getJson(
      request,
      `/admin/inventory/lotes?codigo_item=${itemId}&limit=20`,
      admin.token,
    )
    const lotesRows = (Array.isArray(lotes) ? lotes : unwrap(lotes)?.data || unwrap(lotes)?.items) as JsonBody[]
    const lotesFromReceive = unwrap(receivedOrder)?.lotes_creados as JsonBody[] | undefined
    const receivedLote =
      lotesFromReceive?.find((lote) => lote.numero_lote === `LOTE-E2E-${shortRunId}`) ||
      lotesRows.find((lote) => lote.numero_lote === `LOTE-E2E-${shortRunId}`)
    expect(receivedLote, JSON.stringify(lotes)).toBeTruthy()

    const openedLote = await postJson(request, '/admin/inventory/reactivos/abrir-lote', admin.token, {
      codigo_lote: pickNumber(receivedLote, 'codigo_lote'),
    })
    expect(pickString(openedLote, 'estado_lote')).toBe('ABIERTO')

    await postJson(request, '/admin/inventory/reactivos/registrar-pruebas', admin.token, {
      codigo_lote: pickNumber(receivedLote, 'codigo_lote'),
      cantidad_pruebas: 1,
      observacion: 'Prueba e2e',
    })

    const examCategory = await postJson(request, '/admin/exam-categories', admin.token, {
      nombre: `Categoria examen E2E ${shortRunId}`,
      descripcion: 'Categoria de examen creada por prueba e2e',
    })
    const examCategoryId = pickNumber(examCategory, 'codigo_categoria')

    const exam = await postJson(request, '/admin/exams', admin.token, {
      codigo_categoria: examCategoryId,
      codigo_interno: `EX-E2E-${shortRunId}`,
      nombre: `Examen E2E ${shortRunId}`,
      descripcion: 'Examen creado por flujo e2e',
      requiere_ayuno: false,
      tiempo_entrega_horas: 24,
      tipo_muestra: 'Sangre venosa',
      unidad_medida: 'mg/dL',
      valor_referencia_min: 1,
      valor_referencia_max: 5,
      activo: true,
    })
    const examId = pickNumber(exam, 'codigo_examen')

    const examSupply = await postJson(request, `/admin/examenes/${examId}/insumos`, admin.token, {
      codigo_item: itemId,
      cantidad_requerida: 1,
    })
    expect(pickNumber(examSupply, 'codigo_item')).toBe(itemId)

    const { response: stockVerificationResponse } = await getJson(
      request,
      `/admin/examenes/${examId}/verificar-stock`,
      admin.token,
    )
    expect(stockVerificationResponse.ok()).toBeTruthy()

    const sample = await postJson(request, '/resultados/muestras', admin.token, {
      codigo_paciente: patientId,
      id_muestra: `MUE-E2E-${shortRunId}`,
      tipo_muestra: 'Sangre venosa',
      fecha_toma: new Date().toISOString(),
      observaciones: 'Muestra creada por flujo e2e',
    })
    const sampleId = pickNumber(sample, 'codigo_muestra')

    const result = await postJson(request, '/resultados', admin.token, {
      codigo_muestra: sampleId,
      codigo_examen: examId,
      valor_numerico: 3.2,
      unidad_medida: 'mg/dL',
      valor_referencia_min: 1,
      valor_referencia_max: 5,
      observaciones_tecnicas: 'Resultado normal e2e',
      nivel: 'NORMAL',
    })
    const resultId = pickNumber(result, 'codigo_resultado')

    const validatedResult = await putJson(request, `/resultados/${resultId}/validar`, admin.token)
    expect(pickString(validatedResult, 'estado')).toBe('LISTO')

    const { body: itemAfterValidation } = await getJson(request, `/admin/inventory/items/${itemId}`, admin.token)
    expect(pickNumber(itemAfterValidation, 'stock_actual')).toBeLessThanOrEqual(4)

    const { response: patientDashboardResponse } = await getJson(request, '/resultados/my/dashboard', patient.token)
    expect(patientDashboardResponse.ok()).toBeTruthy()

    const { body: groupedResults } = await getJson(request, '/resultados/my/agrupados', patient.token)
    expect(JSON.stringify(groupedResults)).toContain(`MUE-E2E-${shortRunId}`)

    const forbiddenAdminResponse = await request.get(`${API_URL}/admin/inventory/items`, {
      headers: authHeaders(patient.token),
    })
    expect([401, 403]).toContain(forbiddenAdminResponse.status())

    const anonymousPatientResponse = await request.get(`${API_URL}/resultados/my/dashboard`)
    expect(anonymousPatientResponse.status()).toBe(401)

    for (const path of ['/admin/citas', '/admin/pagos', '/payments', '/cotizaciones']) {
      const response = await request.get(`${API_URL}${path}`, { headers: authHeaders(admin.token) })
      expect([401, 403, 404]).toContain(response.status())
    }

    for (const path of [
      '/admin/inventory/alertas/estadisticas',
      '/admin/inventory/alertas/sin-movimientos?dias=30',
      '/admin/inventory/whatsapp/config',
      '/admin/audit/activity-logs?limit=5',
    ]) {
      const { response } = await getJson(request, path, admin.token)
      expect(response.status(), path).not.toBe(400)
      expect(response.status(), path).not.toBe(404)
    }
  })
})
