import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders primary variant with green background', () => {
    render(<Button variant="primary">Записаться</Button>)
    const btn = screen.getByRole('button', { name: 'Записаться' })
    expect(btn).toHaveClass('bg-green-600')
  })

  it('renders secondary variant without primary background', () => {
    render(<Button variant="secondary">Отмена</Button>)
    const btn = screen.getByRole('button', { name: 'Отмена' })
    expect(btn).toHaveClass('bg-slate-700')
  })

  it('shows disabled state', () => {
    render(<Button variant="primary" disabled>Ждём...</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
