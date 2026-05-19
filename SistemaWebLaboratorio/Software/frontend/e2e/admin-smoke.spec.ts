import { expect, test } from '@playwright/test'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const ADMIN_CREDENTIALS = {
  identifier: 'admin@lab.com',
  password: 'admin123',
}

const adminPages = [
  { path: '/admin', heading: /Panel de Administracion|Dashboard/i },
  { path: '/admin/usuarios', heading: /Usuarios/i },
  { path: '/admin/roles', heading: /Roles/i },
  { path: '/admin/examenes', heading: /Ex[aá]menes/i },
  { path: '/admin/resultados', heading: /Resultados/i },
  { path: '/admin/inventario', heading: /Inventario/i },
  { path: '/admin/movimientos', heading: /Movimientos/i },
  { path: '/admin/alertas', heading: /Alertas/i },
  { path: '/admin/proveedores', heading: /Proveedores/i },
  { path: '/admin/ordenes-compra', heading: /[OÓ]rdenes/i },
  { path: '/admin/auditoria', heading: /Auditor[ií]a/i },
  { path: '/admin/configuracion', heading: /Configuraci[oó]n/i },
]

async function loginByUi(page) {
  await page.goto('/auth/login')
  await page.locator('#identifier').fill(ADMIN_CREDENTIALS.identifier)
  await page.locator('#password').fill(ADMIN_CREDENTIALS.password)
  await page.getByRole('button', { name: /Iniciar/i }).click()
  await expect(page).toHaveURL(/\/admin/, { timeout: 15000 })
  await page.waitForFunction(() => Boolean(window.localStorage.getItem('auth-storage')), null, { timeout: 10000 })
}

async function loginByApi(request) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: ADMIN_CREDENTIALS,
  })
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.access_token).toBeTruthy()
  return body.access_token as string
}

test.describe('Admin smoke tests', () => {
  test('admin can log in and navigate every active admin module without API/server failures', async ({ page }) => {
    const failedResponses: string[] = []
    const consoleErrors: string[] = []

    page.on('response', (response) => {
      const url = response.url()
      const status = response.status()
      if (url.includes('/api/') && status >= 500) {
        failedResponses.push(`${status} ${url}`)
      }
    })

    page.on('console', (message) => {
      if (message.type() === 'error') {
        consoleErrors.push(message.text())
      }
    })

    await loginByUi(page)

    await expect(page.getByRole('link', { name: 'Usuarios', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Alertas', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Movimientos', exact: true })).toBeVisible()
    await expect(page.getByRole('link', { name: /Ir al Portal/i })).toHaveCount(0)

    for (const adminPage of adminPages) {
      await page.goto(adminPage.path)
      await expect(page).toHaveURL(new RegExp(`${adminPage.path.replace('/', '\\/')}$`))
      await expect(page.getByRole('heading', { name: adminPage.heading }).first()).toBeVisible({ timeout: 15000 })
      await expect(page.locator('body')).not.toContainText('undefined/admin')
      await expect(page.locator('body')).not.toContainText('Error al cargar', { timeout: 1000 })
    }

    expect(failedResponses).toEqual([])
    expect(consoleErrors.filter((error) => !error.includes('favicon'))).toEqual([])
  })

  test('critical admin API routes respond and route precedence is correct', async ({ request }) => {
    const token = await loginByApi(request)
    const headers = { Authorization: `Bearer ${token}` }

    const endpoints = [
      `${API_URL}/admin/dashboard/stats`,
      `${API_URL}/admin/users/blocked`,
      `${API_URL}/admin/inventory/items/sugerir-codigo?nombre=Glucosa`,
      `${API_URL}/admin/inventory/alertas/estadisticas`,
      `${API_URL}/admin/inventory/whatsapp/config`,
      `${API_URL}/admin/inventory/movements?limit=5`,
      `${API_URL}/admin/purchase-orders?limit=5`,
    ]

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint, { headers })
      expect(response.status(), endpoint).toBeLessThan(500)
      expect(response.status(), endpoint).not.toBe(400)
      expect(response.status(), endpoint).not.toBe(404)
    }
  })

  test('removed appointment and payment UI routes are not exposed', async ({ page, request }) => {
    await loginByUi(page)

    for (const path of ['/admin/citas', '/admin/pagos', '/portal/citas', '/portal/cotizaciones']) {
      await page.goto(path)
      await expect(page.locator('body')).not.toContainText(/agenda|pago online|payphone/i)
    }

    for (const path of ['/api/admin/citas', '/api/admin/pagos', '/api/payments', '/api/cotizaciones']) {
      const response = await request.get(`http://localhost:3001${path}`)
      expect([404, 401, 403]).toContain(response.status())
    }
  })
})
