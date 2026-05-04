import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SmartAuthForm } from '@/components/auth/SmartAuthForm'

const mockPush = jest.fn()
const mockRefresh = jest.fn()
const mockSignInWithOtp = jest.fn()
const mockVerifyOtp = jest.fn()
const mockSignInWithPassword = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, refresh: mockRefresh }),
}))

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
      signInWithPassword: mockSignInWithPassword,
    },
  }),
}))

beforeEach(() => {
  jest.clearAllMocks()
  global.fetch = jest.fn()
})

describe('SmartAuthForm', () => {
  it('показывает поле email на первом шаге', () => {
    render(<SmartAuthForm />)
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
  })

  it('кнопка "Далее" недоступна при неверном email', () => {
    render(<SmartAuthForm />)
    expect(screen.getByRole('button', { name: 'Далее →' })).toBeDisabled()
  })

  it('кнопка "Далее" доступна при корректном email', () => {
    render(<SmartAuthForm />)
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    })
    expect(screen.getByRole('button', { name: 'Далее →' })).toBeEnabled()
  })

  it('переходит к шагу пароля если method=password', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ method: 'password' }),
    })
    render(<SmartAuthForm />)
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Далее →' }))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Пароль')).toBeInTheDocument()
    })
  })

  it('переходит к шагу OTP если method=otp', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ method: 'otp' }),
    })
    mockSignInWithOtp.mockResolvedValue({ error: null })
    render(<SmartAuthForm />)
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'new@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Далее →' }))
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Код из письма')).toBeInTheDocument()
    })
  })

  it('показывает ошибку если fetch вернул ошибку', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: 'Ошибка сервера' }),
    })
    render(<SmartAuthForm />)
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Далее →' }))
    await waitFor(() => {
      expect(screen.getByText('Ошибка сервера')).toBeInTheDocument()
    })
  })

  it('кнопка "← Изменить email" возвращает на первый шаг', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ method: 'password' }),
    })
    render(<SmartAuthForm />)
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Далее →' }))
    await waitFor(() => screen.getByPlaceholderText('Пароль'))
    fireEvent.click(screen.getByRole('button', { name: '← Изменить email' }))
    expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
  })

  it('вызывает signInWithPassword и редиректит на главную', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ method: 'password' }),
    })
    mockSignInWithPassword.mockResolvedValue({ error: null })
    render(<SmartAuthForm />)
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Далее →' }))
    await waitFor(() => screen.getByPlaceholderText('Пароль'))
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'secret123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))
    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'secret123',
      })
      expect(mockPush).toHaveBeenCalledWith('/')
    })
  })

  it('показывает ошибку signInWithPassword', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ method: 'password' }),
    })
    mockSignInWithPassword.mockResolvedValue({
      error: { message: 'Invalid login credentials' },
    })
    render(<SmartAuthForm />)
    fireEvent.change(screen.getByPlaceholderText('your@email.com'), {
      target: { value: 'test@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Далее →' }))
    await waitFor(() => screen.getByPlaceholderText('Пароль'))
    fireEvent.change(screen.getByPlaceholderText('Пароль'), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))
    await waitFor(() => {
      expect(screen.getByText('Invalid login credentials')).toBeInTheDocument()
    })
  })
})
