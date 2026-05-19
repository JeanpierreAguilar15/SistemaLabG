import { expect, test } from '@playwright/test'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

const PATIENT_CREDENTIALS = {
  identifier: 'maria.gonzalez@example.com',
  password: 'Paciente123!',
}

async function loginPatientByUi(page) {
  await page.goto('/auth/login')
  await page.locator('#identifier').fill(PATIENT_CREDENTIALS.identifier)
  await page.locator('#password').fill(PATIENT_CREDENTIALS.password)
  await page.getByRole('button', { name: /Iniciar/i }).click()
  await expect(page).toHaveURL(/\/portal/, { timeout: 15000 })
  await page.waitForFunction(() => Boolean(window.localStorage.getItem('auth-storage')), null, { timeout: 10000 })
}

async function loginPatientByApi(request) {
  const response = await request.post(`${API_URL}/auth/login`, {
    data: PATIENT_CREDENTIALS,
  })
  expect(response.ok()).toBeTruthy()
  const body = await response.json()
  expect(body.access_token).toBeTruthy()
  expect(body.user.rol).toBe('Paciente')
  return body.access_token as string
}

test.describe('Patient portal smoke tests', () => {
  test('patient can log in and navigate portal modules without admin, appointment, or payment UI', async ({ page }) => {
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

    await page.goto('/auth/login')
    await expect(page.getByRole('button', { name: /Abrir asistente/i })).toHaveCount(0)

    await loginPatientByUi(page)

    const portalNav = page.locator('nav').first()
    await expect(portalNav.getByRole('link', { name: /^Dashboard\b/i })).toBeVisible()
    await expect(portalNav.getByRole('link', { name: /^Resultados\b/i })).toBeVisible()
    await expect(portalNav.getByRole('link', { name: /^Mi Perfil\b/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Abrir asistente/i })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(/cita|agenda|pago|payphone|cotizaci[oó]n/i)

    await page.goto('/portal')
    await expect(page.getByRole('main').getByText(/Laboratorio Franz/i).first()).toBeVisible({ timeout: 15000 })

    await page.goto('/portal/resultados')
    await expect(page.getByRole('heading', { name: /Mis Resultados/i })).toBeVisible({ timeout: 15000 })
    await expect(page.locator('body')).not.toContainText(/cita|agenda|pago|payphone|cotizaci[oó]n/i)

    await page.goto('/portal/perfil')
    await expect(page.getByRole('heading', { name: /Mi Perfil/i })).toBeVisible({ timeout: 15000 })
    await expect(page.getByRole('heading', { name: /Información Personal|Informaci[oó]n Personal/i })).toBeVisible()

    await page.goto('/admin')
    await expect(page).toHaveURL(/\/portal/, { timeout: 15000 })
    await expect(page.locator('body')).not.toContainText(/Gestionar Usuarios|Panel de Administracion/i)

    expect(failedResponses).toEqual([])
    expect(consoleErrors.filter((error) => !error.includes('favicon'))).toEqual([])
  })

  test('patient API routes work and admin APIs remain blocked', async ({ request }) => {
    const token = await loginPatientByApi(request)
    const headers = { Authorization: `Bearer ${token}` }

    const patientEndpoints = [
      `${API_URL}/resultados/my/dashboard`,
      `${API_URL}/resultados/my/agrupados`,
      `${API_URL}/auth/perfil`,
      `${API_URL}/auth/consentimientos`,
      `${API_URL}/chatbot/interpret-results/status`,
      `${API_URL}/chatbot/history?sessionId=patient-smoke-chat`,
    ]

    for (const endpoint of patientEndpoints) {
      const response = await request.get(endpoint, { headers })
      expect(response.status(), endpoint).toBeLessThan(500)
      expect(response.status(), endpoint).not.toBe(401)
      expect(response.status(), endpoint).not.toBe(404)
    }

    const adminResponse = await request.get(`${API_URL}/admin/dashboard/stats`, { headers })
    expect([401, 403]).toContain(adminResponse.status())

    const anonymousChatbotResponse = await request.get(`${API_URL}/chatbot/interpret-results/status`)
    expect(anonymousChatbotResponse.status()).toBe(401)
  })
})
