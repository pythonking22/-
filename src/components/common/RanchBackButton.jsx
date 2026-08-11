import { useNavigate } from 'react-router-dom'

// AGENTS.md §11: 집중형 화면에서 전체 사이드바를 임의로 복원하지 않는다.
// screen-requirements.md: 도감/퀘스트 등은 '목장으로 돌아가기' 중심의 집중형 내비게이션을 사용한다.
// to/label을 넘기면 다른 목적지로도 쓸 수 있다 — 예: 친구 도감(FriendFieldGuide.jsx)에서는
// 내 목장이 아니라 방금 보던 친구 목장으로 돌아가야 한다.
export default function RanchBackButton({ to = '/ranch', label = '목장으로 돌아가기' }) {
  const navigate = useNavigate()
  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-card hover:bg-ivory-100"
    >
      <span aria-hidden="true">←</span>
      {label}
    </button>
  )
}
