import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import FocusedLayout from '../components/common/FocusedLayout'
import { useAuth } from '../router/AuthContext'
import { mockUser } from '../data/mockData'
import { useQuests } from '../context/QuestsContext'
import { useCurrency } from '../context/CurrencyContext'
import { getRepresentativeCharacterImage, getRepresentativeCharacterStageLabel, GROWTH_MAX } from '../data/representativeCharacter'
import GrowthGauge from '../components/common/GrowthGauge'
import { readMusicVolume, readSfxVolume, writeMusicVolume, writeSfxVolume } from '../utils/sound'
import { fetchUserState, saveUserState } from '../api/userState'

const BIO_KEY = 'bio'
const EQUIPPED_BADGES_KEY = 'equippedBadges'
const EQUIPPED_TITLES_KEY = 'equippedTitles'
const DEFAULT_BIO = '자연을 사랑하고, 작은 생명도 소중히 여기는 자연 탐험가예요!'
const MAX_EQUIPPED = 5
const BIO_MAX_LEN = 60

// profile.md: 닉네임/레벨/경험치, 도감·업적 달성도, 총 접속 일수, 대표 배지·칭호 선택, 자기소개 길이제한+금칙어.
// /profile/edit로 들어오면 "프로필 수정"/"시스템 설정" 탭을 갖는 편집 모드가 된다 (AppHeader·목장 상단 설정 버튼 진입점).
export default function Profile() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const isEditMode = location.pathname.endsWith('/edit')
  const [activeEditTab, setActiveEditTab] = useState('profile')
  const { quests, fieldGuideCount, representativeCharacter } = useQuests()
  const { growthPoints, growthStage } = useCurrency()

  const [bio, setBio] = useState(DEFAULT_BIO)
  const [musicVolume, setMusicVolume] = useState(readMusicVolume)
  const [sfxVolume, setSfxVolume] = useState(readSfxVolume)
  const [equippedBadgeIds, setEquippedBadgeIds] = useState([])
  const [equippedTitleIds, setEquippedTitleIds] = useState([])
  const [isProfileStateLoaded, setIsProfileStateLoaded] = useState(false)

  // bio/대표 배지·칭호는 계정별 진행도라 로그인한 uid 기준으로 서버(user_state)에서 불러온다.
  useEffect(() => {
    if (!user?.uid) return
    let cancelled = false
    fetchUserState(user.uid).then((state) => {
      if (cancelled) return
      setBio(typeof state[BIO_KEY] === 'string' ? state[BIO_KEY] : DEFAULT_BIO)
      setEquippedBadgeIds(Array.isArray(state[EQUIPPED_BADGES_KEY]) ? state[EQUIPPED_BADGES_KEY] : [])
      setEquippedTitleIds(Array.isArray(state[EQUIPPED_TITLES_KEY]) ? state[EQUIPPED_TITLES_KEY] : [])
      setIsProfileStateLoaded(true)
    })
    return () => {
      cancelled = true
    }
  }, [user?.uid])

  useEffect(() => {
    if (!isProfileStateLoaded || !user?.uid) return
    saveUserState(user.uid, BIO_KEY, bio)
  }, [bio, isProfileStateLoaded, user?.uid])

  useEffect(() => {
    writeMusicVolume(musicVolume)
  }, [musicVolume])

  useEffect(() => {
    writeSfxVolume(sfxVolume)
  }, [sfxVolume])

  const earnedBadges = useMemo(() => quests.achievement.filter((quest) => quest.claimed), [quests.achievement])
  const earnedTitles = useMemo(() => quests.title.filter((quest) => quest.claimed), [quests.title])
  const earnedBadgeIds = useMemo(() => new Set(earnedBadges.map((quest) => quest.id)), [earnedBadges])
  const earnedTitleIds = useMemo(() => new Set(earnedTitles.map((quest) => quest.id)), [earnedTitles])

  const sanitizedEquippedBadgeIds = useMemo(
    () => equippedBadgeIds.filter((id) => earnedBadgeIds.has(id)).slice(0, MAX_EQUIPPED),
    [equippedBadgeIds, earnedBadgeIds],
  )
  const sanitizedEquippedTitleIds = useMemo(
    () => equippedTitleIds.filter((id) => earnedTitleIds.has(id)).slice(0, MAX_EQUIPPED),
    [equippedTitleIds, earnedTitleIds],
  )

  useEffect(() => {
    if (!isProfileStateLoaded || !user?.uid) return
    saveUserState(user.uid, EQUIPPED_BADGES_KEY, sanitizedEquippedBadgeIds)
  }, [sanitizedEquippedBadgeIds, isProfileStateLoaded, user?.uid])

  useEffect(() => {
    if (!isProfileStateLoaded || !user?.uid) return
    saveUserState(user.uid, EQUIPPED_TITLES_KEY, sanitizedEquippedTitleIds)
  }, [sanitizedEquippedTitleIds, isProfileStateLoaded, user?.uid])

  function toggleEquippedBadge(id) {
    if (!earnedBadgeIds.has(id)) return
    setEquippedBadgeIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_EQUIPPED) return current
      return [...current, id]
    })
  }

  function toggleEquippedTitle(id) {
    if (!earnedTitleIds.has(id)) return
    setEquippedTitleIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id)
      if (current.length >= MAX_EQUIPPED) return current
      return [...current, id]
    })
  }

  const completedAchievementCount = useMemo(
    () => quests.achievement.filter((quest) => quest.done).length,
    [quests.achievement],
  )
  const achievementPercent = useMemo(() => {
    if (!quests.achievement.length) return 0
    return Math.round((completedAchievementCount / quests.achievement.length) * 100)
  }, [completedAchievementCount, quests.achievement.length])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  const editActions = isEditMode ? (
    <div className="inline-flex rounded-full bg-ivory-100 p-1">
      <button
        type="button"
        onClick={() => setActiveEditTab('profile')}
        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
          activeEditTab === 'profile' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-700/60'
        }`}
      >
        프로필 수정
      </button>
      <button
        type="button"
        onClick={() => setActiveEditTab('system')}
        className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
          activeEditTab === 'system' ? 'bg-white text-ink-900 shadow-card' : 'text-ink-700/60'
        }`}
      >
        시스템 설정
      </button>
    </div>
  ) : null

  const visibleEditTab = isEditMode ? activeEditTab : 'profile'

  return (
    <FocusedLayout title={isEditMode ? '프로필 수정' : '프로필'} icon="🙂" actions={editActions}>
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div className="flex flex-col items-center gap-3 rounded-2xl bg-white p-6 text-center shadow-card">
          <div className="grid h-24 w-24 place-items-center rounded-full bg-leaf-100 text-4xl" aria-hidden="true">
            {representativeCharacter ? (
              <img src={getRepresentativeCharacterImage(representativeCharacter, growthStage)} alt="" className="h-full w-full object-contain p-2" />
            ) : (
              '🦋'
            )}
          </div>
          <p className="font-bold text-ink-900">{user?.nickname}</p>
          <p className="text-xs font-semibold text-ink-700/60">탐험가</p>
          <p className="text-xs font-semibold text-leaf-600">대표 캐릭터 · {getRepresentativeCharacterStageLabel(growthStage)}</p>
          <GrowthGauge current={growthPoints} max={GROWTH_MAX} compact />
        </div>

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-white p-4 text-center shadow-card">
              <p className="text-xs text-ink-700/70">도감 달성도</p>
              <p className="mt-1 text-xl font-bold text-leaf-600">
                {Math.round((fieldGuideCount / mockUser.fieldGuideTotal) * 100)}%
              </p>
              <p className="text-xs text-ink-700/50 tabular-nums">
                {fieldGuideCount}/{mockUser.fieldGuideTotal}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 text-center shadow-card">
              <p className="text-xs text-ink-700/70">업적 달성도</p>
              <p className="mt-1 text-xl font-bold text-leaf-600">{achievementPercent}%</p>
              <p className="text-xs text-ink-700/50 tabular-nums">
                {completedAchievementCount}/{quests.achievement.length}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 text-center shadow-card">
              <p className="text-xs text-ink-700/70">총 접속 일수</p>
              <p className="mt-1 text-xl font-bold text-leaf-600">{user?.totalLoginDays ?? 0}일</p>
            </div>
          </div>

          {visibleEditTab === 'profile' ? (
            <>
              <div className="rounded-xl bg-white p-4 shadow-card">
                <label className="block">
                  <span className="mb-2 block font-semibold text-ink-900">자기소개</span>
                  <textarea
                    value={bio}
                    maxLength={BIO_MAX_LEN}
                    onChange={(event) => setBio(event.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-ivory-200 p-3 text-sm outline-none focus:border-leaf-500"
                  />
                  <span className="mt-1 block text-right text-xs text-ink-700/50 tabular-nums">
                    {bio.length}/{BIO_MAX_LEN}
                  </span>
                </label>
                {/* TODO(backend): 실제 금칙어 필터 서버 검증 필요 (profile.md) */}
              </div>

              <div className="rounded-xl bg-white p-4 shadow-card">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink-900">대표 배지</p>
                  <span className="text-xs font-semibold text-ink-700/60">
                    {sanitizedEquippedBadgeIds.length}/{MAX_EQUIPPED}
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {Array.from({ length: MAX_EQUIPPED }, (_, index) => {
                    const badgeId = sanitizedEquippedBadgeIds[index] ?? null
                    const badge = badgeId ? earnedBadges.find((quest) => quest.id === badgeId) : null
                    return (
                      <button
                        key={badgeId ?? `empty-badge-${index}`}
                        type="button"
                        disabled={!isEditMode || !badgeId}
                        onClick={() => badgeId && isEditMode && toggleEquippedBadge(badgeId)}
                        className={`grid h-14 w-14 place-items-center rounded-full border p-1 ${
                          badgeId ? 'border-leaf-200 bg-leaf-50' : 'border-dashed border-ivory-200 bg-ivory-50 text-ink-700/35'
                        }`}
                        aria-label={badge ? `${badge.badgeName} 배지` : '빈 배지 칸'}
                      >
                        {badge ? (
                          <img src={badge.badgeImage} alt="" aria-hidden="true" className="h-full w-full object-contain" />
                        ) : (
                          '◌'
                        )}
                      </button>
                    )
                  })}
                </div>
                {isEditMode && <p className="mt-3 text-xs text-ink-700/60">아래 보유 배지에서 선택해 대표 칸에 등록할 수 있습니다.</p>}
              </div>

              <div className="rounded-xl bg-white p-4 shadow-card">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink-900">보유 배지</p>
                  <span className="text-xs font-semibold text-ink-700/60">보유 {earnedBadges.length}개</span>
                </div>
                {earnedBadges.length === 0 ? (
                  <p className="text-sm text-ink-700/60">획득한 배지가 아직 없어요. 미션의 업적 미션을 완료해보세요!</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto pr-1">
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-5">
                      {earnedBadges.map((badge) => {
                        const equipped = sanitizedEquippedBadgeIds.includes(badge.id)
                        return (
                          <button
                            key={badge.id}
                            type="button"
                            onClick={() => toggleEquippedBadge(badge.id)}
                            className={`flex flex-col items-center gap-2 rounded-2xl border p-3 text-center transition ${
                              equipped ? 'border-leaf-500 bg-leaf-50 shadow-card' : 'border-ivory-200 bg-white hover:border-leaf-300'
                            }`}
                            aria-pressed={equipped}
                            aria-label={`${badge.badgeName} 배지`}
                          >
                            <img src={badge.badgeImage} alt="" aria-hidden="true" className="h-14 w-14 object-contain" />
                            <span className="text-xs font-bold text-ink-900">{badge.title}</span>
                            <span className="text-[11px] text-ink-700/60">{equipped ? '등록됨' : '탭하여 등록'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl bg-white p-4 shadow-card">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink-900">대표 칭호</p>
                  <span className="text-xs font-semibold text-ink-700/60">
                    {sanitizedEquippedTitleIds.length}/{MAX_EQUIPPED}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
                  {Array.from({ length: MAX_EQUIPPED }, (_, index) => {
                    const titleId = sanitizedEquippedTitleIds[index] ?? null
                    const titleQuest = titleId ? earnedTitles.find((quest) => quest.id === titleId) : null
                    return (
                      <button
                        key={titleId ?? `empty-title-${index}`}
                        type="button"
                        disabled={!isEditMode || !titleId}
                        onClick={() => titleId && isEditMode && toggleEquippedTitle(titleId)}
                        className={`min-h-16 rounded-2xl border px-3 py-2 text-center text-[11px] font-bold leading-tight ${
                          titleId ? 'border-leaf-200 bg-leaf-50 text-ink-900' : 'border-dashed border-ivory-200 bg-ivory-50 text-ink-700/35'
                        }`}
                        aria-label={titleQuest ? `${titleQuest.title} 칭호` : '빈 칭호 칸'}
                      >
                        {titleQuest ? titleQuest.title : '◌'}
                      </button>
                    )
                  })}
                </div>
                {isEditMode && <p className="mt-3 text-xs text-ink-700/60">아래 보유 칭호에서 선택해 대표 칸에 등록할 수 있습니다.</p>}
              </div>

              <div className="rounded-xl bg-white p-4 shadow-card">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="font-semibold text-ink-900">보유 칭호</p>
                  <span className="text-xs font-semibold text-ink-700/60">보유 {earnedTitles.length}개</span>
                </div>
                {earnedTitles.length === 0 ? (
                  <p className="text-sm text-ink-700/60">획득한 칭호가 아직 없어요. 미션의 칭호 미션을 완료해보세요!</p>
                ) : (
                  <div className="max-h-60 overflow-y-auto pr-1">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {earnedTitles.map((titleQuest) => {
                        const equipped = sanitizedEquippedTitleIds.includes(titleQuest.id)
                        return (
                          <button
                            key={titleQuest.id}
                            type="button"
                            onClick={() => toggleEquippedTitle(titleQuest.id)}
                            className={`flex min-h-20 flex-col justify-center rounded-2xl border px-3 py-3 text-left transition ${
                              equipped ? 'border-leaf-500 bg-leaf-50 shadow-card' : 'border-ivory-200 bg-white hover:border-leaf-300'
                            }`}
                            aria-pressed={equipped}
                            aria-label={`${titleQuest.title} 칭호`}
                          >
                            <span className="text-sm font-bold text-ink-900">{titleQuest.title}</span>
                            <span className="mt-1 text-[11px] text-ink-700/60">{equipped ? '등록됨' : '탭하여 등록'}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-xl bg-white p-4 shadow-card">
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-ink-900">배경음악(BGM)</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={musicVolume}
                    onChange={(event) => setMusicVolume(Number(event.target.value))}
                    className="w-full accent-leaf-500"
                    aria-label="배경음악 음량 조절"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-ink-700/60">
                    <span>음소거</span>
                    <span className="tabular-nums font-semibold text-ink-900">{musicVolume}%</span>
                    <span>최대</span>
                  </div>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-ink-900">효과음</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={sfxVolume}
                    onChange={(event) => setSfxVolume(Number(event.target.value))}
                    className="w-full accent-leaf-500"
                    aria-label="효과음 음량 조절"
                  />
                  <div className="mt-1 flex items-center justify-between text-xs text-ink-700/60">
                    <span>음소거</span>
                    <span className="tabular-nums font-semibold text-ink-900">{sfxVolume}%</span>
                    <span>최대</span>
                  </div>
                </label>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full rounded-xl bg-ink-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink-800"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </FocusedLayout>
  )
}
