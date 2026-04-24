import { render, screen } from '@testing-library/react'
import { StatusBadge } from '@/components/ui/StatusBadge'

describe('StatusBadge', () => {
  it('renders ОТКРЫТ with green style', () => {
    render(<StatusBadge status="open" />)
    expect(screen.getByText('ОТКРЫТ')).toHaveClass('bg-accent-green')
  })

  it('renders ИДЁТ with orange style', () => {
    render(<StatusBadge status="ongoing" />)
    expect(screen.getByText('ИДЁТ')).toHaveClass('bg-accent-orange')
  })

  it('renders ЗАВЕРШЁН with secondary style', () => {
    render(<StatusBadge status="finished" />)
    expect(screen.getByText('ЗАВЕРШЁН')).toHaveClass('text-text-secondary')
  })
})
