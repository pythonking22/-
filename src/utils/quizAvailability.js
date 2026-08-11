// 하루 한 번만 풀 수 있는 오늘의 퀴즈 게이트. 계정별 서버 상태가 아니라 브라우저 로컬에만
// 저장한다 — sound.js의 음량 설정처럼 기기별 설정에 가까운 값이라 계정 동기화는 필요 없다.
const QUIZ_COMPLETED_KEY = 'little-biologist-quiz-completed-date'

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isQuizCompletedToday() {
  try {
    return localStorage.getItem(QUIZ_COMPLETED_KEY) === getLocalDateKey()
  } catch {
    return false
  }
}

export function markQuizCompletedToday() {
  try {
    localStorage.setItem(QUIZ_COMPLETED_KEY, getLocalDateKey())
  } catch {
    // 저장할 수 없는 환경에서도 현재 화면의 퀴즈 흐름은 계속 진행한다.
  }
}
