// 기본 재화는 나뭇잎 하나만 사용한다 (decision-log.md D-002).
// UI 참고 이미지의 골드/보석은 구현하지 않는다.
export default function CurrencyDisplay({ amount, onAdd }) {
  return (
    <div data-reward-target="currency" className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-card">
      <span aria-hidden="true">🍃</span>
      <span className="font-semibold text-ink-900 tabular-nums">{amount.toLocaleString()}</span>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label="나뭇잎 충전하러 상점 가기"
          className="ml-1 grid h-5 w-5 place-items-center rounded-full bg-leaf-100 text-leaf-700 hover:bg-leaf-100/80"
        >
          +
        </button>
      )}
    </div>
  )
}
