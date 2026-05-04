/**
 * @jest-environment node
 */
import { POST } from '@/app/api/auth/check-method/route'

const mockRpc = jest.fn()

jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    rpc: mockRpc,
  }),
}))

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/auth/check-method', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/check-method', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://supabase.test'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key'
  })

  it('возвращает 400 если email отсутствует', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toBe('email required')
  })

  it('возвращает method=password если у пользователя есть пароль', async () => {
    mockRpc.mockResolvedValue({ data: true, error: null })
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.method).toBe('password')
  })

  it('возвращает method=otp если у пользователя нет пароля', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.method).toBe('otp')
  })

  it('возвращает method=otp для нового пользователя (data=null)', async () => {
    mockRpc.mockResolvedValue({ data: null, error: null })
    const res = await POST(makeRequest({ email: 'new@example.com' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.method).toBe('otp')
  })

  it('возвращает 500 при ошибке RPC', async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: 'DB connection failed' } })
    const res = await POST(makeRequest({ email: 'user@example.com' }))
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(data.error).toBe('DB connection failed')
  })

  it('вызывает RPC с правильным email', async () => {
    mockRpc.mockResolvedValue({ data: false, error: null })
    await POST(makeRequest({ email: 'specific@example.com' }))
    expect(mockRpc).toHaveBeenCalledWith('user_has_password', {
      user_email: 'specific@example.com',
    })
  })
})
