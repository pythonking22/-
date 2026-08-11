import { useEffect, useRef, useState } from 'react'
import {
  getRepresentativeCharacterImage,
  getRepresentativeCharacterStageLabel,
  getRepresentativeCharacterEggCrackImages,
} from '../../data/representativeCharacter'
import { useCurrency } from '../../context/CurrencyContext'
import { useQuests } from '../../context/QuestsContext'
import { playSfx } from '../../utils/sound'
import { SFX } from '../../utils/sfx'

const CRACK_STEP_MS = 650 // 균열 사진 한 장을 보여주는 시간
const EMERGE_HOLD_MS = 1100 // 애벌레가 다 나온 채로 잠깐 멈춰서 보여주는 시간
const EVOLUTION_STEP_MS = 700 // 진화 전/후 사진을 각각 보여주는 시간
const LARVA_CRAWL_MS = 900 // 애벌레가 꿈틀거리며 자리를 잡는 시간
const COCOON_WRAP_MS = 900 // 실을 감아 고치를 짓는 시간
const COCOON_REVEAL_HOLD_MS = 700 // 번데기가 다 만들어진 채로 잠깐 멈춰서 보여주는 시간

// 흰 카드 팝업 전에 어둡게 흐려진 배경 위에 사진만 크게 띄우는 공통 레이아웃.
function RevealBackdrop({ children }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/55 p-4 backdrop-blur-md" role="presentation">
      <div className="relative" style={{ width: 'min(72vw, 380px)', height: 'min(72vw, 380px)' }}>
        {children}
      </div>
    </div>
  )
}

// 알 -> 애벌레 전환 전용 연출: 균열 3장을 순서대로 보여준 뒤, 가장 많이 깨진 마지막 알에서
// 애벌레가 솟아오르는 애니메이션까지 재생하고 onDone을 호출한다.
function EggCrackReveal({ images, larvaImage, onDone }) {
  const [step, setStep] = useState(0) // 0 ~ images.length-1: 균열 사진, images.length: 애벌레 등장
  const isEmergeStep = step >= images.length
  const hasPlayedSoundRef = useRef(false)

  useEffect(() => {
    // 개발 모드 StrictMode가 이 이펙트를 두 번(마운트→정리→재마운트) 돌려도
    // 효과음이 겹쳐 들리지 않도록 ref로 한 번만 재생되게 막는다.
    if (hasPlayedSoundRef.current) return
    hasPlayedSoundRef.current = true
    playSfx(SFX.eggToLarva)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isEmergeStep) {
        onDone()
      } else {
        setStep((current) => current + 1)
      }
    }, isEmergeStep ? EMERGE_HOLD_MS : CRACK_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [step, isEmergeStep, onDone])

  const lastCrackImage = images[images.length - 1]

  return (
    <RevealBackdrop>
      {isEmergeStep ? (
        <>
          <img src={lastCrackImage} alt="" className="absolute inset-0 h-full w-full object-contain" />
          {larvaImage && <img key="larva" src={larvaImage} alt="애벌레 등장" className="egg-hatch-larva absolute inset-0 h-full w-full object-contain" />}
        </>
      ) : (
        <img key={step} src={images[step]} alt="알이 깨지는 중" className="stage-reveal-pop h-full w-full object-contain" />
      )}
    </RevealBackdrop>
  )
}

// 애벌레 -> 번데기 전환 전용 연출: 애벌레가 꿈틀거리며 자리를 잡은 뒤(crawl), 실을 감아
// 고치를 짓듯 원형 실이 빙글빙글 감기고(wrap), 그 안에서 번데기로 바뀐다(reveal).
function LarvaCocoonReveal({ larvaImage, pupaImage, onDone }) {
  const [phase, setPhase] = useState('crawl') // 'crawl' -> 'wrap' -> 'reveal'
  const hasPlayedSoundRef = useRef(false)

  useEffect(() => {
    if (hasPlayedSoundRef.current) return
    hasPlayedSoundRef.current = true
    playSfx(SFX.larvaToPupa)
  }, [])

  useEffect(() => {
    const duration = { crawl: LARVA_CRAWL_MS, wrap: COCOON_WRAP_MS, reveal: COCOON_REVEAL_HOLD_MS }[phase]
    const timer = window.setTimeout(() => {
      if (phase === 'crawl') setPhase('wrap')
      else if (phase === 'wrap') setPhase('reveal')
      else onDone()
    }, duration)
    return () => window.clearTimeout(timer)
  }, [phase, onDone])

  return (
    <RevealBackdrop>
      {phase !== 'reveal' && (
        <img
          src={larvaImage}
          alt="애벌레가 고치를 짓는 중"
          className={`h-full w-full object-contain ${phase === 'crawl' ? 'larva-crawl' : 'cocoon-settle'}`}
        />
      )}
      {phase === 'wrap' && (
        <div className="cocoon-ring-wrap" aria-hidden="true">
          <div className="cocoon-ring" />
        </div>
      )}
      {phase === 'reveal' && <img src={pupaImage} alt="번데기 완성" className="cocoon-pupa-reveal h-full w-full object-contain" />}
    </RevealBackdrop>
  )
}

// 그 외 단계 전환(번데기 -> 성충 등) 연출: 변신 전/후 사진 두 장을 순서대로 보여줘
// 진화하는 듯한 느낌을 준 뒤 onDone을 호출한다.
function StageEvolutionReveal({ images, onDone }) {
  const [step, setStep] = useState(0)
  const isLastStep = step >= images.length - 1
  const hasPlayedSoundRef = useRef(false)

  useEffect(() => {
    if (hasPlayedSoundRef.current) return
    hasPlayedSoundRef.current = true
    playSfx(SFX.pupaToAdult)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isLastStep) onDone()
      else setStep((current) => current + 1)
    }, EVOLUTION_STEP_MS)
    return () => window.clearTimeout(timer)
  }, [step, isLastStep, onDone])

  return (
    <RevealBackdrop>
      <img key={step} src={images[step]} alt="진화하는 중" className="stage-reveal-pop h-full w-full object-contain" />
    </RevealBackdrop>
  )
}

function GrowthStageModalContent({ stageUp, representativeCharacter, onDismiss }) {
  const isHatching = stageUp.from === 'egg' && stageUp.to === 'larva'
  const isCocooning = stageUp.from === 'larva' && stageUp.to === 'pupa'
  const isSimpleEvolution = !isHatching && !isCocooning

  const crackImages = isHatching && representativeCharacter ? getRepresentativeCharacterEggCrackImages(representativeCharacter) : []
  const larvaImage = (isHatching || isCocooning) && representativeCharacter ? getRepresentativeCharacterImage(representativeCharacter, 'larva') : null
  const pupaImage = isCocooning && representativeCharacter ? getRepresentativeCharacterImage(representativeCharacter, 'pupa') : null

  const fromImage = isSimpleEvolution && representativeCharacter ? getRepresentativeCharacterImage(representativeCharacter, stageUp.from) : null
  const toImage = isSimpleEvolution && representativeCharacter ? getRepresentativeCharacterImage(representativeCharacter, stageUp.to) : null
  const evolutionImages = fromImage && toImage ? [fromImage, toImage] : []

  const hasReveal = isHatching ? crackImages.length > 0 : isCocooning ? Boolean(larvaImage && pupaImage) : evolutionImages.length > 0
  const [revealDone, setRevealDone] = useState(!hasReveal)

  if (!revealDone) {
    if (isHatching) return <EggCrackReveal images={crackImages} larvaImage={larvaImage} onDone={() => setRevealDone(true)} />
    if (isCocooning) return <LarvaCocoonReveal larvaImage={larvaImage} pupaImage={pupaImage} onDone={() => setRevealDone(true)} />
    return <StageEvolutionReveal images={evolutionImages} onDone={() => setRevealDone(true)} />
  }

  const stageLabel = getRepresentativeCharacterStageLabel(stageUp.to)
  const image = representativeCharacter ? getRepresentativeCharacterImage(representativeCharacter, stageUp.to) : null
  const isAdult = stageUp.to === 'adult'

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink-900/45 p-4" role="presentation">
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="growth-stage-title">
        <div className="mb-3 text-4xl" aria-hidden="true">✨</div>
        {image && <img src={image} alt={`${stageLabel} 대표 캐릭터`} className="mx-auto mb-3 h-32 w-32 object-contain" />}
        <p className="text-sm font-semibold text-leaf-700">대표 캐릭터 성장</p>
        <h2 id="growth-stage-title" className="mt-1 text-2xl font-bold text-ink-900">{stageLabel} 단계로 성장했어요!</h2>
        {isAdult ? (
          <>
            <p className="mt-2 text-sm leading-6 text-ink-700/70">다 자란 대표 캐릭터는 가방에 남고, 새로운 알을 만나게 돼요.</p>
            <p className="mt-2 rounded-xl bg-leaf-50 px-3 py-2 text-sm font-bold text-leaf-700" aria-hidden="true">🥚 확인을 누르면 가방에 새 알이 도착해요!</p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink-700/70">새로운 모습으로 부화하는 과정을 지켜봐 주세요.</p>
        )}
        <button
          type="button"
          onClick={onDismiss}
          {...(isAdult ? { 'data-click-sfx': 'none' } : {})}
          className="mt-5 w-full rounded-full bg-leaf-500 px-4 py-3 text-sm font-bold text-white hover:bg-leaf-600"
        >
          {isAdult ? '새 알 받기' : '확인'}
        </button>
      </div>
    </div>
  )
}

export default function GrowthStageModal() {
  const { stageUp, dismissStageUp } = useCurrency()
  const { representativeCharacter } = useQuests()
  if (!stageUp) return null

  return (
    <GrowthStageModalContent
      key={`${stageUp.from}-${stageUp.to}-${stageUp.points}`}
      stageUp={stageUp}
      representativeCharacter={representativeCharacter}
      onDismiss={dismissStageUp}
    />
  )
}
