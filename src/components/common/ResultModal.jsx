import { createPortal } from 'react-dom'

export default function ResultModal({ open, emoji = '🎉', imageSrc, title, description, confirmLabel = '확인', onConfirm, suppressButtonSfx = false }) {
  if (!open) return null
  // body에 직접 portal로 붙여야 한다 — FocusedLayout의 backdrop-blur 조상 안에서 렌더링되면
  // fixed의 기준이 뷰포트가 아니라 그 조상의 콘텐츠 박스 전체가 되어, 스크롤을 내려야
  // 모달이 보이는 문제가 생긴다.
  return createPortal(
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/40 px-4" role="dialog" aria-modal="true">
      <div className="relative z-10 w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-soft">
        {imageSrc ? (
          <img src={imageSrc} alt="" className="mx-auto h-32 w-32 object-contain" />
        ) : (
          <div className="text-4xl" aria-hidden="true">{emoji}</div>
        )}
        <p className="mt-3 text-lg font-bold text-ink-900">{title}</p>
        {description && <p className="mt-2 text-sm text-ink-700/80">{description}</p>}
        <button
          type="button"
          onClick={onConfirm}
          {...(suppressButtonSfx ? { 'data-click-sfx': 'none' } : {})}
          className="mt-6 w-full rounded-full bg-leaf-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-leaf-600"
        >
          {confirmLabel}
        </button>
      </div>
    </div>,
    document.body,
  )
}
