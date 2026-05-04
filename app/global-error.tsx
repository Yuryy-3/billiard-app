'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="ru">
      <body style={{ background: '#0d1f1a', color: '#fff', fontFamily: 'sans-serif' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Критическая ошибка
          </h2>
          <p style={{ color: '#8A9E97', marginBottom: '1.5rem' }}>
            {error.message || 'Приложение не может загрузиться'}
          </p>
          <button
            onClick={reset}
            style={{ background: '#2E7D5B', color: '#fff', borderRadius: '0.5rem', padding: '0.75rem 1.5rem', fontWeight: '600', border: 'none', cursor: 'pointer' }}
          >
            Перезагрузить
          </button>
        </div>
      </body>
    </html>
  )
}
