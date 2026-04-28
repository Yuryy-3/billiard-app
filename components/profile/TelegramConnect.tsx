'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Stage = 'idle' | 'waiting' | 'linked'

export function TelegramConnect({ telegramChatId }: { telegramChatId: number | null }) {
  const router = useRouter()
  const [stage, setStage] = useState<Stage>(telegramChatId !== null ? 'linked' : 'idle')
  const [loading, setLoading] = useState(false)

  async function handleConnect() {
    setLoading(true)
    const res = await fetch('/api/telegram/link', { method: 'POST' })
    const { url } = await res.json()
    window.open(url, '_blank')
    setStage('waiting')
    setLoading(false)
  }

  async function handleDisconnect() {
    setLoading(true)
    await fetch('/api/telegram/unlink', { method: 'POST' })
    setStage('idle')
    setLoading(false)
  }

  if (stage === 'linked') {
    return (
      <div className="flex items-center justify-between bg-bg-card rounded-xl p-4">
        <div>
          <div className="text-sm font-medium text-text-primary">Telegram</div>
          <div className="text-xs text-accent-green mt-0.5">Подключён ✓</div>
        </div>
        <button
          onClick={handleDisconnect}
          disabled={loading}
          className="text-xs text-text-secondary hover:text-accent-red transition-colors"
        >
          {loading ? '...' : 'Отключить'}
        </button>
      </div>
    )
  }

  if (stage === 'waiting') {
    return (
      <div className="bg-bg-card rounded-xl p-4">
        <p className="text-sm text-text-primary mb-3">
          Нажмите <b>«Запустить»</b> в боте Telegram, затем вернитесь сюда.
        </p>
        <button
          onClick={() => router.refresh()}
          className="w-full bg-accent-green text-white rounded-xl py-3 px-4 font-semibold text-sm"
        >
          Я нажал — обновить страницу
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      disabled={loading}
      className="w-full bg-accent-orange text-white rounded-xl py-3 px-4 font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? 'Открываем бот...' : '📲 Подключить Telegram'}
    </button>
  )
}
