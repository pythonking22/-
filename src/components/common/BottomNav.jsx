import { NavLink } from 'react-router-dom'
import { useTutorial } from '../../context/TutorialContext'

// system-flow.md §1 Main Navigation: 목장 → 탐험 / 도감 / 퀘스트 / 친구 / 상점 / AI 말벗
const NAV_ITEMS = [
  { to: '/exploration', label: '탐험', emoji: '🧭' },
  { to: '/field-guide', label: '도감', emoji: '📖' },
  { to: '/quests', label: '미션', emoji: '🗒️' },
  { to: '/friends', label: '친구', emoji: '👥' },
  { to: '/shop', label: '상점', emoji: '🏪' },
  { to: '/ai-companion', label: 'AI 말벗', emoji: '🤖' },
]

export default function BottomNav() {
  const { step } = useTutorial()
  return (
    <nav className="sticky bottom-0 z-40 shrink-0 border-t border-ivory-200 bg-ivory-50/95 backdrop-blur">
      <ul className="mx-auto flex max-w-3xl justify-between px-2 py-2">
        {NAV_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                `relative flex flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-medium ${
                  isActive ? 'bg-leaf-100 text-leaf-700' : 'text-ink-700/70 hover:bg-ivory-100'
                }`
              }
            >
              {((step?.id === 'exploration' && item.to === '/exploration') || (step?.id === 'quests' && item.to === '/quests')) && (
                <span className="pointer-events-none absolute -top-14 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-1 whitespace-nowrap">
                  <span className="text-4xl drop-shadow-md animate-bounce" aria-hidden="true">👇</span>
                  <span className="rounded-full bg-ink-900/85 px-2.5 py-1 text-[10px] font-bold text-white shadow-card">여기를 눌러보세요</span>
                </span>
              )}
              <span className="text-lg" aria-hidden="true">{item.emoji}</span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
