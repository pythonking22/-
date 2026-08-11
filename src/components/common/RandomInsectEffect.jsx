import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getInsectSpecies, DEMO_ACCOUNT_USERNAME } from '../../data/insectSpecies'
import { useRegisteredPhotos } from '../../context/RegisteredPhotosContext'
import { useAuth } from '../../router/AuthContext'
import { useTutorial } from '../../context/TutorialContext'
import { useCurrency } from '../../context/CurrencyContext'
import { reportMissionEvent } from '../../utils/missionEvents'
import ResultModal from './ResultModal'

const EFFECT_SRC = '/effects/랜덤곤충 흰이펙트-2.png'
// 대객체(서식지) 아이콘과 겹치지 않도록 목장 배경 안에서 돌아다닐 범위를 넉넉히 안쪽으로 잡는다.
const BOUNDS = { minX: 8, maxX: 88, minY: 14, maxY: 78 }
const MOVE_INTERVAL_MS = 5500
const SPAWN_INTERVAL_MS = 60 * 60 * 1000 // 클릭 후 다음 출몰까지 대기 시간: 1시간
const REVEAL_FADE_MS = 700 // 큰 사진이 나타나고/사라지는 페이드 시간
const REVEAL_HOLD_MS = 2000 // 큰 사진을 완전히 보여준 채로 유지하는 시간

// 곤충 이름 마지막 글자 받침 유무에 따라 "이/가" 조사를 고른다 (예: 장수풍뎅이가, 호박벌이).
function withIGa(name) {
  if (!name) return ''
  const lastChar = name.charCodeAt(name.length - 1)
  const hasBatchim = (lastChar - 0xac00) % 28 !== 0
  return `${name}${hasBatchim ? '이' : '가'}`
}

function randomPoint() {
  return {
    x: BOUNDS.minX + Math.random() * (BOUNDS.maxX - BOUNDS.minX),
    y: BOUNDS.minY + Math.random() * (BOUNDS.maxY - BOUNDS.minY),
  }
}

// 목장 배경(RanchMapScene) 위를 떠돌아다니는 반짝이 이펙트. 일단은(서버 재시작·새로고침 등
// 앱이 새로 켜질 때마다) 대기 없이 무조건 곧바로 출몰한다. 눌리면 아직 도감에 등록되지 않은
// 동(기본) 등급 곤충 중 하나를 무작위로 등록하고 사라지며, 그 뒤부터는 (다시 켜지 않는 한)
// 1시간 동안 재출몰하지 않는다.
export default function RandomInsectEffect() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { step, advance, setTutorialTarget } = useTutorial()
  const { stageUp } = useCurrency()
  const isDemoAccount = user?.username === DEMO_ACCOUNT_USERNAME
  const { photos, sketches, bronzeUnlocks, registerBronze } = useRegisteredPhotos()
  const [point, setPoint] = useState(randomPoint)
  // 앱이 새로 켜질 때(첫 마운트)마다 등록할 곤충이 남아 있으면 대기 없이 곧바로 출몰시킨다.
  const [isVisible, setIsVisible] = useState(
    () => getInsectSpecies(isDemoAccount).some((s) => !s.registered && !photos[s.id] && !sketches[s.id] && !bronzeUnlocks[s.id]),
  )
  const [caughtSpecies, setCaughtSpecies] = useState(null)
  const [caughtDuringTutorial, setCaughtDuringTutorial] = useState(false)
  // 등록은 클릭 즉시 끝나지만, 등록으로 받은 성장 포인트가 대표 캐릭터를 성장시키는 순간에는
  // GrowthStageModal이 먼저 화면 전체를 차지해야 한다. 그동안은 이 곤충 등장 연출을 미뤄뒀다가,
  // 성장 모달이 닫히고 나서(stageUp이 사라지면) 시작한다 — 두 전면 이벤트가 겹쳐 보이지 않게.
  const [pendingCatch, setPendingCatch] = useState(null)
  const [revealSpecies, setRevealSpecies] = useState(null)
  const [isRevealVisible, setIsRevealVisible] = useState(false)
  const respawnTimerRef = useRef(null)
  const revealTimersRef = useRef([])

  const unregisteredPool = useMemo(
    () => getInsectSpecies(isDemoAccount).filter((s) => !s.registered && !photos[s.id] && !sketches[s.id] && !bronzeUnlocks[s.id]),
    [isDemoAccount, photos, sketches, bronzeUnlocks],
  )
  const isTutorialStep = step?.id === 'random-insect'

  useEffect(() => {
    return () => {
      window.clearTimeout(respawnTimerRef.current)
      revealTimersRef.current.forEach((id) => window.clearTimeout(id))
    }
  }, [])

  // 튜토리얼이 '첫 곤충을 만나봐요' 단계에 들어서면, 재출몰 대기 시간과 무관하게 곧바로 다시 보여준다.
  useEffect(() => {
    if (isTutorialStep && unregisteredPool.length > 0) setIsVisible(true)
  }, [isTutorialStep, unregisteredPool.length])

  useEffect(() => {
    if (!isVisible) return
    const timer = window.setInterval(() => setPoint(randomPoint()), MOVE_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [isVisible])

  function handleClick() {
    if (unregisteredPool.length === 0) return
    const target = unregisteredPool[Math.floor(Math.random() * unregisteredPool.length)]
    const isTutorialCatch = isTutorialStep
    registerBronze(target.id)
    reportMissionEvent({ type: 'ranch_insect_found', entityId: target.id })
    setCaughtDuringTutorial(isTutorialCatch)
    if (isTutorialCatch) {
      setTutorialTarget(target.habitatId, target.id)
      advance()
    }
    setIsVisible(false)
    window.clearTimeout(respawnTimerRef.current)
    respawnTimerRef.current = window.setTimeout(() => setIsVisible(true), SPAWN_INTERVAL_MS)

    // 곤충 등장 연출은 바로 시작하지 않고 pendingCatch로만 넘긴다 — 실제 시작은 아래
    // useEffect가 stageUp(성장 모달)이 없을 때만 골라서 한다.
    setPendingCatch(target)
  }

  // 동 등급 사진을 목장 위에 크게 띄워 페이드인 → 2초 유지 → 페이드아웃한 뒤,
  // 다 사라지고 나서야 도감 등록 성공 팝업을 띄운다. 성장 모달이 떠 있는 동안은 기다린다.
  useEffect(() => {
    if (!pendingCatch || stageUp) return
    const target = pendingCatch

    revealTimersRef.current.forEach((id) => window.clearTimeout(id))
    revealTimersRef.current = []
    setRevealSpecies(target)
    setIsRevealVisible(false)
    const fadeInTimer = window.setTimeout(() => setIsRevealVisible(true), 20)
    const fadeOutTimer = window.setTimeout(() => setIsRevealVisible(false), 20 + REVEAL_HOLD_MS)
    const finishTimer = window.setTimeout(() => {
      setRevealSpecies(null)
      setCaughtSpecies(target)
      setPendingCatch(null)
    }, 20 + REVEAL_HOLD_MS + REVEAL_FADE_MS)
    revealTimersRef.current = [fadeInTimer, fadeOutTimer, finishTimer]
  }, [pendingCatch, stageUp])

  return (
    <>
      {isVisible && unregisteredPool.length > 0 && (
        <button
          type="button"
          onClick={handleClick}
          aria-label="반짝이는 곤충 흔적 — 눌러서 도감에 등록하기"
          className={`ranch-random-insect-effect ${isTutorialStep ? 'z-[110]' : ''}`}
          style={{ left: `${point.x}%`, top: `${point.y}%` }}
        >
          <img src={EFFECT_SRC} alt="" aria-hidden="true" />
          {isTutorialStep && (
            <span className="tutorial-target-guide pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
              <span className="tutorial-target-ring tutorial-target-ring--small" aria-hidden="true" />
              <span className="tutorial-target-arrow" aria-hidden="true">👇</span>
              <span className="tutorial-target-label">여기를 눌러보세요</span>
            </span>
          )}
        </button>
      )}

      {revealSpecies && (
        <div className={`ranch-catch-reveal ${isRevealVisible ? 'is-visible' : ''}`} aria-hidden="true">
          <img
            src={revealSpecies.defaultUrl ?? revealSpecies.image}
            alt=""
            className="ranch-catch-reveal__image"
          />
        </div>
      )}

      <ResultModal
        open={Boolean(caughtSpecies)}
        title={caughtSpecies ? `${withIGa(caughtSpecies.name)} 나타났어요! 도감에 등록했습니다!` : ''}
        confirmLabel={caughtDuringTutorial ? '확인' : '도감에서 확인하기'}
        onConfirm={() => {
          setCaughtSpecies(null)
          if (caughtDuringTutorial) {
            setCaughtDuringTutorial(false)
            return
          }
          navigate('/field-guide')
        }}
      />
    </>
  )
}
