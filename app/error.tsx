'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center px-4">
      <div className="card max-w-sm w-full text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Что-то пошло не так</h2>
        <p className="text-text-secondary text-sm">{error.message || 'Неизвестная ошибка'}</p>
        {error.digest && (
          <p className="text-text-secondary text-xs font-mono">#{error.digest}</p>
        )}
        <button
          onClick={reset}
          className="bg-accent-green text-white rounded-lg px-6 py-3 font-semibold w-full"
        >
          Попробовать снова
        </button>
        <a href="/" className="text-text-secondary text-sm underline block">
          На главную
        </a>
      </div>
    </div>
  )
}
