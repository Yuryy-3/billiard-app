import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button', () => {
  it('renders primary variant with orange background', () => {
    render(<Button variant="primary">Записаться</Button>)
    const btn = screen.getByRole('button', { name: 'Записаться' })
    expect(btn).toHaveClass('bg-accent-orange')
  })

  it('renders ghost variant without filled background', () => {
    render(<Button variant="ghost">Отмена</Button>)
    const btn = screen.getByRole('button', { name: 'Отмена' })
    expect(btn).not.toHaveClass('bg-accent-orange')
  })

  it('shows disabled state', () => {
    render(<Button variant="primary" disabled>Ждём...</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })
})
