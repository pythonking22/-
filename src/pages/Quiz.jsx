import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusedLayout from '../components/common/FocusedLayout'
import ResultModal from '../components/common/ResultModal'
import { getInsectSpecies, DEMO_ACCOUNT_USERNAME } from '../data/insectSpecies'
import { useAuth } from '../router/AuthContext'
import { useRegisteredPhotos, getLocalDateKey } from '../context/RegisteredPhotosContext'
import { useCurrency } from '../context/CurrencyContext'
import { reportMissionEvent } from '../utils/missionEvents'
import { isQuizCompletedToday, markQuizCompletedToday } from '../utils/quizAvailability'
import { playSfx } from '../utils/sound'
import { SFX } from '../utils/sfx'
import { useSceneBackgroundMusic } from '../components/common/BackgroundMusicController'

// quiz.md: 객관식, 새로 등록한 도감 카드 관련 문제 우선, 같은 문제 과반복 방지, 보상은
// 나뭇잎+성장 포인트. 오늘 하루 1회만 풀 수 있다(quizAvailability.js).
const QUESTION_COUNT = 3
const QUIZ_GROWTH_REWARD = 10
const QUIZ_LEAF_REWARD = 200
const QUIZ_MUSIC_SRC = encodeURI('/sounds/Quiz Table Groove (1).mp3')

function RewardBurst({ onComplete }) {
  const [targets, setTargets] = useState(null)

  useEffect(() => {
    const growthTarget = document.querySelector('[data-reward-target="growth-points"]')
    const currencyTarget = document.querySelector('[data-reward-target="currency"]')
    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const getOffset = (element) => {
      if (!element) return { x: 0, y: 0 }
      const rect = element.getBoundingClientRect()
      return { x: rect.left + rect.width / 2 - centerX, y: rect.top + rect.height / 2 - centerY }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 직후 실제 DOM 위치를 읽어야만 계산 가능
    setTargets({ growth: getOffset(growthTarget), currency: getOffset(currencyTarget) })
    const timer = window.setTimeout(onComplete, 1250)
    return () => window.clearTimeout(timer)
  }, [onComplete])

  if (!targets) return null

  const particles = Array.from({ length: 18 }, (_, index) => {
    const destination = index % 2 === 0 ? targets.growth : targets.currency
    const spreadX = ((index * 37) % 45) - 22
    const spreadY = ((index * 23) % 35) - 17
    return {
      id: index,
      x: destination.x + spreadX,
      y: destination.y + spreadY,
      delay: (index % 6) * 45,
    }
  })

  return (
    <div className="pointer-events-none fixed inset-0 z-[70] overflow-hidden" aria-hidden="true">
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="quiz-reward-spark"
          style={{ '--tx': `${particle.x}px`, '--ty': `${particle.y}px`, '--delay': `${particle.delay}ms` }}
        >
          {particle.id % 3 === 0 ? '✦' : '✧'}
        </span>
      ))}
    </div>
  )
}

function shuffle(items, seed) {
  const result = [...items]
  let value = seed
  for (let i = result.length - 1; i > 0; i -= 1) {
    value = (value * 9301 + 49297) % 233280
    const j = Math.floor((value / 233280) * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

function makeQuestions(speciesPool, distractorPool, dateKey) {
  if (!speciesPool.length) return []
  const selected = Array.from({ length: QUESTION_COUNT }, (_, index) => speciesPool[index % speciesPool.length])

  return selected.map((species, index) => {
    const seed = [...dateKey, species.id, index].reduce((sum, value) => sum + String(value).charCodeAt(0), 0)
    const otherFeatures = distractorPool
      .filter((item) => item.id !== species.id && item.feature)
      .map((item) => item.feature)
    const choices = shuffle([species.feature, ...shuffle(otherFeatures, seed).slice(0, 3)], seed + 17)
    return {
      id: `${dateKey}-${species.id}-${index}`,
      question: `${species.name}에 대한 설명으로 옳은 것은?`,
      choices,
      answerIndex: choices.indexOf(species.feature),
      explanation: species.feature,
    }
  })
}

export default function Quiz() {
  useSceneBackgroundMusic(QUIZ_MUSIC_SRC)
  const navigate = useNavigate()
  const { user } = useAuth()
  const isDemoAccount = user?.username === DEMO_ACCOUNT_USERNAME
  const speciesList = getInsectSpecies(isDemoAccount)
  const { photos, sketches, bronzeUnlocks, registrations } = useRegisteredPhotos()
  const { addLeaves, addGrowthPoints } = useCurrency()
  const dateKey = getLocalDateKey()
  const quizAlreadyCompleted = isQuizCompletedToday()
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [correctCount, setCorrectCount] = useState(0)
  const [streak, setStreak] = useState(0)
  const [finished, setFinished] = useState(false)
  const [showRewardBurst, setShowRewardBurst] = useState(false)
  const [isRewardFlowStarted, setIsRewardFlowStarted] = useState(false)

  const questions = useMemo(() => {
    const registeredSpecies = speciesList.filter((species) => (
      species.registered || photos[species.id] || sketches[species.id] || bronzeUnlocks[species.id]
    ))
    const todaySpecies = registeredSpecies.filter((species) => registrations[species.id] === dateKey)
    // 오늘 신규 등록 카드가 있으면 그 카드들로만 문제를 구성하고(quiz.md: 신규 카드 우선),
    // 없으면 지금까지 등록한 카드 전체에서 낸다. 오답 선택지는 등록 여부와 상관없이 전체
    // 종 목록에서 뽑아야 항상 4지선다를 채울 수 있다(등록 종이 3개뿐이면 정답 외 후보가 부족해짐).
    return makeQuestions(todaySpecies.length ? todaySpecies : registeredSpecies, speciesList, dateKey)
  }, [speciesList, photos, sketches, bronzeUnlocks, registrations, dateKey])

  const question = questions[index]
  const isAnswered = selected !== null
  const isCorrect = question && selected === question.answerIndex

  function choose(choiceIndex) {
    if (isAnswered || !question) return
    setSelected(choiceIndex)
    if (choiceIndex === question.answerIndex) {
      playSfx(SFX.quizCorrect)
      reportMissionEvent({ type: 'quiz_correct' })
      setCorrectCount((count) => count + 1)
      setStreak((count) => count + 1)
    } else {
      playSfx(SFX.quizWrong)
      setStreak(0)
    }
  }

  function next() {
    if (index + 1 >= questions.length) {
      setFinished(true)
      return
    }
    setIndex((value) => value + 1)
    setSelected(null)
  }

  function confirmResult() {
    playSfx(SFX.dailyQuizComplete)
    markQuizCompletedToday()
    addGrowthPoints(correctCount * QUIZ_GROWTH_REWARD)
    addLeaves(correctCount * QUIZ_LEAF_REWARD)
    setFinished(false)
    setIsRewardFlowStarted(true)
    setShowRewardBurst(true)
  }

  if (quizAlreadyCompleted && !isRewardFlowStarted) {
    return (
      <FocusedLayout title="오늘의 퀴즈" icon="❓">
        <ResultModal
          open
          emoji="📝"
          title="오늘의 퀴즈를 모두 풀었어요"
          description="오늘 가능한 퀴즈 횟수를 다 사용했어요. 내일 다시 도전해 주세요!"
          onConfirm={() => navigate('/ranch')}
        />
      </FocusedLayout>
    )
  }

  if (!question) {
    return (
      <FocusedLayout title="오늘의 퀴즈" icon="❓">
        <div className="rounded-2xl bg-white p-8 text-center shadow-card">
          <p className="font-semibold text-ink-900">아직 등록된 도감 카드가 없어요.</p>
          <p className="mt-2 text-sm text-ink-700/70">탐험에서 곤충을 먼저 도감에 등록해 주세요.</p>
        </div>
      </FocusedLayout>
    )
  }

  return (
    <FocusedLayout title="오늘의 퀴즈" icon="❓">
      <div className="grid gap-6 lg:grid-cols-[1fr_240px]">
        <div className="rounded-2xl bg-white p-6 shadow-card">
          <p className="mb-4 font-semibold text-ink-900">{question.question}</p>
          <div className="flex flex-col gap-2">
            {question.choices.map((choice, choiceIndex) => {
              const correctChoice = choiceIndex === question.answerIndex
              const showState = isAnswered && (choiceIndex === selected || correctChoice)
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => choose(choiceIndex)}
                  disabled={isAnswered}
                  data-click-sfx="none"
                  className={`rounded-xl border px-4 py-3 text-left text-sm ${
                    showState
                      ? correctChoice
                        ? 'border-leaf-500 bg-leaf-50 text-leaf-700'
                        : 'border-red-300 bg-red-50 text-red-600'
                      : 'border-ivory-200 hover:border-leaf-500'
                  }`}
                >
                  {choice}
                </button>
              )
            })}
          </div>

          {isAnswered && (
            <div className="mt-4 rounded-xl bg-ivory-100 p-4 text-sm">
              <p className="font-semibold text-ink-900">{isCorrect ? '정답이에요! 🎉' : '아쉬워요!'}</p>
              <p className="mt-1 text-ink-700/80">{question.explanation}</p>
              {isCorrect && (
                <p className="mt-2 font-semibold text-leaf-700">
                  성장 포인트 +{QUIZ_GROWTH_REWARD} · 나뭇잎 +{QUIZ_LEAF_REWARD}
                </p>
              )}
              <button
                type="button"
                onClick={next}
                className="mt-3 rounded-full bg-leaf-500 px-4 py-2 text-xs font-semibold text-white hover:bg-leaf-600"
              >
                {index + 1 === questions.length ? '결과 보기' : '다음 문제'}
              </button>
            </div>
          )}
        </div>

        <aside className="rounded-xl bg-white p-4 shadow-card">
          <p className="mb-3 font-semibold text-ink-900">진행 현황</p>
          <p className="text-sm text-ink-700/70">
            현재 문제 {index + 1}/{questions.length}
          </p>
          <p className="text-sm text-ink-700/70">정답 수 {correctCount}</p>
          <p className="text-sm text-ink-700/70">연속 정답 {streak}</p>
        </aside>
      </div>

      <ResultModal
        open={finished}
        title="퀴즈 완료!"
        description={`${questions.length}문제 중 ${correctCount}개를 맞혔어요. 성장 포인트 ${correctCount * QUIZ_GROWTH_REWARD}와 나뭇잎 ${correctCount * QUIZ_LEAF_REWARD}을 받을 수 있어요.`}
        confirmLabel="재화 수령하기"
        onConfirm={confirmResult}
        suppressButtonSfx
      />
      {showRewardBurst && <RewardBurst onComplete={() => navigate('/ranch')} />}
    </FocusedLayout>
  )
}
