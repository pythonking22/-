import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FocusedLayout from '../components/common/FocusedLayout'
import EmptyState from '../components/common/EmptyState'
import { useAuth } from '../router/AuthContext'
import { reportMissionEvent } from '../utils/missionEvents'

// friends.md: 닉네임이 아닌 친구 ID(uid)로 검색. 실시간 대화/선물 없음, 방명록 사용.
// screen-requirements.md §7: 친구 활동 피드 제거, 대화·선물 버튼 제거.
// "목장 방문"은 이 페이지 안에 미리보기를 그리지 않고 FriendRanch.jsx(/friends/ranch/:uid)로
// 이동한다 — 평소 자기 목장 화면과 같은 전체 화면 구성으로 보여주기 위해서다.
export default function Friends() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState('list')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])

  const [searchId, setSearchId] = useState('')
  const [searchResult, setSearchResult] = useState(undefined)
  const [searchMessage, setSearchMessage] = useState('')

  function copyId() {
    navigator.clipboard?.writeText(user?.uid ?? '')
  }

  async function loadFriends() {
    if (!user?.uid) return
    try {
      const response = await fetch(`/api/friends?uid=${encodeURIComponent(user.uid)}`)
      const { friends: list } = await response.json()
      setFriends(list || [])
    } catch {
      setFriends([])
    }
  }

  async function loadRequests() {
    if (!user?.uid) return
    try {
      const response = await fetch(`/api/friends/requests?uid=${encodeURIComponent(user.uid)}`)
      const { requests: list } = await response.json()
      setRequests(list || [])
    } catch {
      setRequests([])
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 마운트 시 1회 서버 목록을 불러오는 표준 패턴
    loadFriends()
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid])

  async function handleSearch() {
    const query = searchId.trim()
    setSearchMessage('')
    if (!query) {
      setSearchResult(undefined)
      return
    }
    try {
      const response = await fetch(`/api/users/${encodeURIComponent(query)}`)
      if (!response.ok) {
        setSearchResult(null)
        return
      }
      const { user: found } = await response.json()
      setSearchResult(found)
    } catch {
      setSearchResult(null)
    }
  }

  async function sendFriendRequest(targetUid) {
    setSearchMessage('')
    try {
      const response = await fetch('/api/friends/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requesterUid: user?.uid, targetUid }),
      })
      if (response.ok) {
        setSearchMessage('친구 요청을 보냈어요')
        reportMissionEvent({ type: 'friend_add' })
        return
      }
      const { error } = await response.json().catch(() => ({}))
      if (error === 'ALREADY_FRIENDS') setSearchMessage('이미 친구예요')
      else if (error === 'REQUEST_ALREADY_SENT') setSearchMessage('이미 요청을 보냈어요')
      else if (error === 'CANNOT_ADD_SELF') setSearchMessage('나 자신은 추가할 수 없어요')
      else setSearchMessage('요청을 보내지 못했어요')
    } catch {
      setSearchMessage('요청을 보내지 못했어요')
    }
  }

  async function acceptRequest(requestId) {
    await fetch(`/api/friends/requests/${requestId}/accept`, { method: 'POST' })
    loadRequests()
    loadFriends()
  }

  async function rejectRequest(requestId) {
    await fetch(`/api/friends/requests/${requestId}/reject`, { method: 'POST' })
    loadRequests()
  }

  function visitFriend(friend) {
    navigate(`/friends/ranch/${encodeURIComponent(friend.uid)}`)
  }

  const isSearchResultFriend = searchResult && friends.some((f) => f.uid === searchResult.uid)
  const isSearchResultSelf = searchResult && searchResult.uid === user?.uid

  return (
    <FocusedLayout title="친구" icon="👥">
      <div className="mb-4 flex gap-2">
        {[
          { id: 'list', label: '친구 목록' },
          { id: 'requests', label: '친구 요청' },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === t.id ? 'bg-leaf-500 text-white' : 'bg-white text-ink-900 shadow-card'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div>
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="친구 ID(uid)로 검색하세요"
              className="w-full rounded-full border border-ivory-200 bg-white px-4 py-2 text-sm outline-none focus:border-leaf-500"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="shrink-0 rounded-full bg-leaf-500 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-600"
            >
              검색
            </button>
          </div>

          {searchResult !== undefined && (
            <div className="mb-3 rounded-xl bg-white p-4 shadow-card">
              {searchResult ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink-900">{searchResult.nickname}</p>
                    <p className="text-xs text-ink-700/70">{searchResult.uid}</p>
                  </div>
                  {isSearchResultSelf ? (
                    <span className="text-xs text-ink-700/60">나예요</span>
                  ) : isSearchResultFriend ? (
                    <button
                      type="button"
                      onClick={() => visitFriend(searchResult)}
                      className="rounded-full bg-ivory-100 px-4 py-2 text-xs font-semibold text-ink-900 hover:bg-ivory-200"
                    >
                      목장 방문
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => sendFriendRequest(searchResult.uid)}
                      className="rounded-full bg-leaf-500 px-4 py-2 text-xs font-semibold text-white hover:bg-leaf-600"
                    >
                      친구 요청
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-center text-sm text-ink-700/70">해당 ID의 친구를 찾을 수 없어요</p>
              )}
              {searchMessage && <p className="mt-2 text-center text-xs text-ink-700/70">{searchMessage}</p>}
            </div>
          )}

          {tab === 'list' ? (
            <ul className="flex flex-col gap-2">
              {friends.map((f) => (
                <li key={f.uid} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-card">
                  <div>
                    <p className="font-semibold text-ink-900">{f.nickname}</p>
                    <p className="text-xs text-ink-700/70">{f.uid}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => visitFriend(f)}
                    className="rounded-full bg-ivory-100 px-4 py-2 text-xs font-semibold text-ink-900 hover:bg-ivory-200"
                  >
                    목장 방문
                  </button>
                </li>
              ))}
              {friends.length === 0 && <EmptyState title="아직 친구가 없어요" />}
            </ul>
          ) : (
            <ul className="flex flex-col gap-2">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-card">
                  <p className="font-semibold text-ink-900">{r.nickname}</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => acceptRequest(r.id)}
                      className="rounded-full bg-leaf-500 px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      수락
                    </button>
                    <button
                      type="button"
                      onClick={() => rejectRequest(r.id)}
                      className="rounded-full bg-ivory-100 px-3 py-1.5 text-xs font-semibold text-ink-900"
                    >
                      거절
                    </button>
                  </div>
                </li>
              ))}
              {requests.length === 0 && <EmptyState title="받은 친구 요청이 없어요" />}
            </ul>
          )}
        </div>

        <aside className="rounded-xl bg-white p-4 shadow-card">
          <p className="mb-1 text-sm font-semibold text-ink-900">내 친구 ID</p>
          <p className="mb-3 rounded-lg bg-ivory-100 px-3 py-2 text-center font-mono text-sm">{user?.uid}</p>
          <button
            type="button"
            onClick={copyId}
            className="w-full rounded-full bg-leaf-500 px-4 py-2 text-sm font-semibold text-white hover:bg-leaf-600"
          >
            ID 복사·공유하기
          </button>
        </aside>
      </div>
    </FocusedLayout>
  )
}
