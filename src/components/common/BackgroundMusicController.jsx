import { useEffect, useRef } from 'react'
import { readMusicVolume, MUSIC_VOLUME_CHANGE_EVENT } from '../../utils/sound'

const BACKGROUND_MUSIC_SRC = '/sounds/backgroundmusic.mp3'
const BASE_VOLUME = 0.35

// 목장뿐 아니라 탐험/도감/소셜/가방/미션/상점/퀴즈 등 앱 전체에서 계속 재생되는 배경음악.
// App.jsx 최상단에 한 번만 마운트되어 페이지 이동과 무관하게 오디오 인스턴스를 유지한다.
let backgroundMusicAudio = null
// 상점처럼 화면 전용 배경음악이 이 공용 배경음악을 대신 재생 중일 때 true — 이 동안은 아래
// "자동재생 막히면 클릭/키입력 시 재시도" 리스너가 이 배경음악을 다시 틀면 안 된다(그러면
// 상점 화면에서 뭘 누를 때마다 목장 배경음악이 다시 겹쳐 들리게 된다).
let isSuppressed = false
// 개발 모드 StrictMode가 useSceneBackgroundMusic을 마운트→정리→재마운트로 두 번 돌릴 때,
// 정리 단계에서 곧바로 resumeBackgroundMusic()을 부르면 그 찰나에 공용 배경음악이 잠깐
// 재개됐다가 다시 멈추는 게 들린다. 재개를 타이머로 미뤄두고, 바로 이어지는 재마운트의
// pauseBackgroundMusic()이 그 타이머를 취소하게 해서 진짜 화면 이탈일 때만 재개되게 한다.
let pendingResumeTimer = null

function getBackgroundMusicAudio() {
  if (!backgroundMusicAudio) {
    backgroundMusicAudio = new Audio(BACKGROUND_MUSIC_SRC)
    backgroundMusicAudio.loop = true
    backgroundMusicAudio.preload = 'auto'
  }
  return backgroundMusicAudio
}

function applyVolume(audio) {
  audio.volume = BASE_VOLUME * (readMusicVolume() / 100)
}

function tryPlay(audio) {
  audio.play()?.catch(() => {})
}

// 상점처럼 화면 전용 배경음악을 따로 트는 곳에서, 그동안 이 공용 배경음악은 잠깐 멈춰야 한다
// (동시에 두 음악이 겹치지 않도록). ShopBgm 같은 컴포넌트가 마운트/언마운트될 때 호출한다.
export function pauseBackgroundMusic() {
  if (pendingResumeTimer) {
    window.clearTimeout(pendingResumeTimer)
    pendingResumeTimer = null
  }
  isSuppressed = true
  backgroundMusicAudio?.pause()
}

export function resumeBackgroundMusic() {
  isSuppressed = false
  if (!backgroundMusicAudio) return
  applyVolume(backgroundMusicAudio)
  tryPlay(backgroundMusicAudio)
}

// 화면 전용 배경음악이 언마운트될 때 쓰는 지연 재개 — 진짜 화면 이탈이면 곧 재개되고,
// StrictMode의 즉시 재마운트라면 pauseBackgroundMusic()이 먼저 호출되어 취소된다.
function scheduleResumeBackgroundMusic() {
  pendingResumeTimer = window.setTimeout(() => {
    pendingResumeTimer = null
    resumeBackgroundMusic()
  }, 0)
}

// 상점·서식지 화면처럼 그 화면에 있는 동안만 전용 배경음악을 트는 곳에서 공통으로 쓰는 훅.
// 기본값(suppressGlobalMusic: true)은 마운트되는 동안 공용 배경음악(BackgroundMusicController)을
// 멈추고, 언마운트되면(그 화면을 떠나면) 다시 재개한다 — 상점처럼 화면 전용 음악이 공용 배경음악을
// "대체"하는 경우. 서식지(대객체) 내부처럼 전용 효과음을 공용 배경음악 위에 "겹쳐서" 같이 들려주고
// 싶으면 suppressGlobalMusic: false를 넘긴다 — 이땐 공용 배경음악을 건드리지 않는다.
// src가 바뀌면(예: 풀밭 서식지의 꽃밭<->나무 전환) 재생 중인 전용 트랙만 새 src로 바꿔 끊김 없이 이어간다.
export function useSceneBackgroundMusic(src, { volume = 0.35, suppressGlobalMusic = true } = {}) {
  const audioRef = useRef(null)

  useEffect(() => {
    if (!suppressGlobalMusic) return undefined
    pauseBackgroundMusic()
    return () => {
      audioRef.current?.pause()
      scheduleResumeBackgroundMusic()
    }
  }, [suppressGlobalMusic])

  useEffect(() => {
    audioRef.current?.pause()
    if (!src) {
      audioRef.current = null
      return undefined
    }

    const audio = new Audio(src)
    audio.loop = true
    audio.volume = volume * (readMusicVolume() / 100)
    audio.play()?.catch(() => {})
    audioRef.current = audio

    const resumeOnInteraction = () => audio.play()?.catch(() => {})
    const syncVolume = () => {
      audio.volume = volume * (readMusicVolume() / 100)
    }

    window.addEventListener('pointerdown', resumeOnInteraction)
    window.addEventListener('keydown', resumeOnInteraction)
    window.addEventListener(MUSIC_VOLUME_CHANGE_EVENT, syncVolume)

    return () => {
      audio.pause()
      window.removeEventListener('pointerdown', resumeOnInteraction)
      window.removeEventListener('keydown', resumeOnInteraction)
      window.removeEventListener(MUSIC_VOLUME_CHANGE_EVENT, syncVolume)
    }
  }, [src, volume])
}

export default function BackgroundMusicController() {
  useEffect(() => {
    const audio = getBackgroundMusicAudio()
    applyVolume(audio)
    tryPlay(audio)

    // 브라우저 자동재생 정책으로 첫 재생이 막히면, 사용자가 화면을 처음 터치/클릭/키입력할 때 다시 시도한다.
    // 단, 상점처럼 전용 배경음악이 대신 재생 중일 때(isSuppressed)는 건드리지 않는다.
    const resumePlayback = () => {
      if (isSuppressed) return
      tryPlay(audio)
    }
    const syncVolume = () => applyVolume(audio)

    window.addEventListener('pointerdown', resumePlayback)
    window.addEventListener('keydown', resumePlayback)
    window.addEventListener(MUSIC_VOLUME_CHANGE_EVENT, syncVolume)

    return () => {
      window.removeEventListener('pointerdown', resumePlayback)
      window.removeEventListener('keydown', resumePlayback)
      window.removeEventListener(MUSIC_VOLUME_CHANGE_EVENT, syncVolume)
    }
  }, [])

  return null
}
