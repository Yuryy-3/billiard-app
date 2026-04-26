const REGULATIONS = [
  {
    id: 'olympic',
    title: 'Олимпийская система с шот-клоком',
    recommended: true,
    description: 'Single elimination. Каждый матч — до 2 (или 3) побед. Жёсткий тайм-контроль обеспечивает высокую динамику.',
    rules: [
      'Проигравший выбывает, победитель идёт дальше',
      'Лимит матча: 45 / 60 / 90 минут (выбирает организатор)',
      'Шот-клок: 40 секунд на удар, одно продление на +20 секунд за игру',
      'При истечении времени побеждает игрок с бо́льшим счётом',
      'При равном счёте по времени — буллит: один удар, кто забьёт',
    ],
    timing: [
      { label: '16 участников, 4+ стола', time: '~4 часа' },
      { label: '32 участника, 8+ столов', time: '~5 часов' },
    ],
  },
  {
    id: 'groups',
    title: 'Группы + плей-офф',
    recommended: false,
    description: 'Сначала круговая по группам, затем олимпийка из лучших. Каждый гарантированно сыграет 3+ матча.',
    rules: [
      '4 группы по 4 человека, круговая внутри группы',
      'Топ-2 из каждой группы выходят в плей-офф (8 участников)',
      'Очки: победа = 2, ничья = 1, поражение = 0',
      'Тайм-контроль такой же, как в олимпийской системе',
      'При равенстве очков в группе — личная встреча',
    ],
    timing: [
      { label: '16 участников, 4+ стола', time: '~5-6 часов' },
    ],
  },
  {
    id: 'swiss',
    title: 'Швейцарская система',
    recommended: false,
    description: 'Фиксированное число туров без выбывания. Идеально для вечерних клубных турниров.',
    rules: [
      '4 тура, без выбывания — каждый играет до конца',
      'Жеребьёвка в каждом туре по текущим очкам (близкие по уровню)',
      'Победа = 1 очко, поражение = 0',
      'Итоговый рейтинг → финал между топ-2',
      'Запрещены повторные встречи одних и тех же игроков',
    ],
    timing: [
      { label: '16 участников, 4 стола', time: '~2-3 часа' },
    ],
  },
]

export default function RegulationsPage() {
  return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold">Регламенты турниров</h1>
        <a href="/" className="text-gray-400 text-sm hover:text-white">← Главная</a>
      </div>
      <p className="text-gray-400 text-sm mb-8">
        Готовые форматы с чётким тайм-контролем для любительских турниров по русскому бильярду
      </p>

      <div className="flex flex-col gap-6">
        {REGULATIONS.map(reg => (
          <div key={reg.id} className="bg-slate-800 rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <h2 className="font-bold text-lg leading-tight flex-1">{reg.title}</h2>
              {reg.recommended && (
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full ml-3 shrink-0">
                  Рекомендуем
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">{reg.description}</p>

            <h3 className="font-semibold text-sm mb-2">Правила:</h3>
            <ul className="text-sm text-gray-300 space-y-1 mb-4">
              {reg.rules.map((rule, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-green-400 shrink-0 mt-0.5">•</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>

            <h3 className="font-semibold text-sm mb-2">Тайминг:</h3>
            <div className="flex flex-col gap-1">
              {reg.timing.map((t, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-400">{t.label}</span>
                  <span className="font-semibold text-green-400">{t.time}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
