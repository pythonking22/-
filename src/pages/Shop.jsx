import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusedLayout from '../components/common/FocusedLayout'
import ConfirmationModal from '../components/common/ConfirmationModal'
import ResultModal from '../components/common/ResultModal'
import { mockShopItems } from '../data/mockData'
import { useCurrency } from '../context/CurrencyContext'
import { useBag } from '../context/BagContext'
import GachaModal from '../components/features/GachaModal'
import { useSceneBackgroundMusic } from '../components/common/BackgroundMusicController'
import { playSfx } from '../utils/sound'
import { SFX } from '../utils/sfx'

const SHOP_MUSIC_SRC = encodeURI('/sounds/BGM CashShop.mp3')

// shop.md: 재화/뽑기/아이템 탭 (D-008). 뽑기는 게임 내 재화(나뭇잎)만 쓰는 확률형으로
// 보호자·법적 검토 완료 후 구현함(2026-08-05). 재화 탭은 실제 현금 결제 UI 미리보기만 두고,
// 구매 버튼은 보호자·법적 검토가 끝나기 전까지 아무 동작도 하지 않는다.
const TABS = [
  { id: 'currency', label: '재화' },
  { id: 'gacha', label: '뽑기' },
  { id: 'item', label: '아이템' },
]

// 인테리어 아이템의 theme 필드(basic/winter/sea) 기준 분류. IMAGE/인테리어 하위 테마 폴더와 대응된다.
const THEMES = [
  { id: 'all', label: '전체' },
  { id: 'basic', label: '기본' },
  { id: 'winter', label: '겨울' },
  { id: 'sea', label: '바다' },
]

export default function Shop() {
  useSceneBackgroundMusic(SHOP_MUSIC_SRC)
  const navigate = useNavigate()
  const { leaves, addLeaves } = useCurrency()
  const { addItem, expandBag } = useBag()
  const [tab, setTab] = useState(TABS[0].id)
  const [theme, setTheme] = useState('all')
  const [pendingItem, setPendingItem] = useState(null)
  const [purchased, setPurchased] = useState(null)

  const items = tab === 'item' ? mockShopItems.item.filter((item) => theme === 'all' || item.theme === theme) : []

  function confirmPurchase() {
    addLeaves(-pendingItem.priceLeaf)
    if (pendingItem.id === 's2') {
      expandBag()
    } else if (pendingItem.category === 'interior') {
      addItem({ id: pendingItem.id, name: pendingItem.name, category: 'interior', image: pendingItem.image })
    }
    setPurchased(pendingItem)
    setPendingItem(null)
  }

  return (
    <FocusedLayout title="상점" icon="🏪">
      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <div>
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                  tab === t.id ? 'bg-leaf-500 text-white' : 'bg-white text-ink-900 shadow-card'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'item' && (
            <div className="mb-4 flex flex-wrap gap-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${
                    theme === t.id ? 'bg-leaf-500 text-white' : 'bg-white text-ink-900 shadow-card'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}

          {tab === 'gacha' ? (
            <GachaModal />
          ) : tab === 'currency' ? (
            <div className="flex gap-4 overflow-x-auto pb-2">
              {mockShopItems.currency.map((item) => (
                <div key={item.id} className="flex w-72 shrink-0 flex-col gap-2 rounded-xl bg-white p-3 shadow-card">
                  <img src={item.image} alt={item.name} className="w-full rounded-lg object-contain" />
                  <button type="button" onClick={() => playSfx(SFX.currencyPurchase)} data-click-sfx="none" className="w-full">
                    <img src={item.buttonImage} alt={`${item.priceWon.toLocaleString()}원 구매하기`} className="w-full object-contain" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {items.map((item) => (
                <div key={item.id} className="flex flex-col gap-2 rounded-xl bg-white p-4 shadow-card">
                  <div className="grid h-16 w-16 place-items-center self-center rounded-full bg-leaf-50 text-2xl" aria-hidden="true">
                    {item.image ? (
                      <img src={item.image} alt="" className="h-full w-full object-contain p-1.5" />
                    ) : (
                      '🎁'
                    )}
                  </div>
                  <p className="text-center text-sm font-semibold text-ink-900">{item.name}</p>
                  <p className="text-center text-xs text-ink-700/70">{item.desc}</p>
                  <button
                    type="button"
                    onClick={() => setPendingItem(item)}
                    disabled={leaves < item.priceLeaf}
                    className="mt-1 rounded-full bg-leaf-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-leaf-600 disabled:bg-ivory-200 disabled:text-ink-700/50"
                  >
                    🍃 {item.priceLeaf}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="self-start">
          <button
            type="button"
            onClick={() => navigate('/bag')}
            className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-ink-900 shadow-card hover:bg-ivory-100"
          >
            가방 열기
          </button>
        </aside>
      </div>

      <ConfirmationModal
        open={Boolean(pendingItem)}
        title={`${pendingItem?.name}을(를) 구매할까요?`}
        description={pendingItem ? `🍃 나뭇잎 ${pendingItem.priceLeaf}개가 사용돼요.` : ''}
        confirmLabel="구매하기"
        onConfirm={confirmPurchase}
        onCancel={() => setPendingItem(null)}
      />

      <ResultModal
        open={Boolean(purchased)}
        title="구매 완료!"
        description={
          purchased?.id === 's2'
            ? '가방 공간이 10칸 늘었고 바로 적용됐어요.'
            : purchased
              ? `${purchased.name}이(가) 가방에 담겼어요.`
              : ''
        }
        onConfirm={() => setPurchased(null)}
      />
    </FocusedLayout>
  )
}
