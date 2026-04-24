import { render, screen, act } from '@testing-library/react'
import { CountdownTimer } from '@/components/ui/CountdownTimer'

describe('CountdownTimer', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('displays initial seconds as MM:SS', () => {
    render(<CountdownTimer totalSeconds={2537} />)
    expect(screen.getByText('42:17')).toBeInTheDocument()
  })

  it('counts down each second', () => {
    render(<CountdownTimer totalSeconds={10} />)
    expect(screen.getByText('00:10')).toBeInTheDocument()
    act(() => { jest.advanceTimersByTime(1000) })
    expect(screen.getByText('00:09')).toBeInTheDocument()
  })

  it('applies danger style when under 60 seconds', () => {
    render(<CountdownTimer totalSeconds={59} />)
    expect(screen.getByText('00:59')).toHaveClass('text-accent-red')
  })
})
