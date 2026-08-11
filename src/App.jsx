import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './router/AuthContext'
import { CurrencyProvider } from './context/CurrencyContext'
import { BagProvider } from './context/BagContext'
import { RegisteredPhotosProvider } from './context/RegisteredPhotosContext'
import { QuestsProvider } from './context/QuestsContext'
import { TutorialProvider } from './context/TutorialContext'
import ProtectedRoute from './router/ProtectedRoute'
import GrowthStageModal from './components/common/GrowthStageModal'
import BackgroundMusicController from './components/common/BackgroundMusicController'
import ButtonSoundController from './components/common/ButtonSoundController'
import SoundAssetPreloader from './components/common/SoundAssetPreloader'

import AuthRouteLayout from './pages/auth/AuthRouteLayout'
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Ranch from './pages/Ranch'
import RanchHabitat from './pages/RanchHabitat'
import Exploration from './pages/Exploration'
import FieldGuide from './pages/FieldGuide'
import Quests from './pages/Quests'
import Friends from './pages/Friends'
import FriendRanch from './pages/FriendRanch'
import FriendRanchHabitat from './pages/FriendRanchHabitat'
import FriendFieldGuide from './pages/FriendFieldGuide'
import Shop from './pages/Shop'
import Bag from './pages/Bag'
import AiCompanion from './pages/AiCompanion'
import Quiz from './pages/Quiz'
import Profile from './pages/Profile'

export default function App() {
  return (
    <AuthProvider>
      <CurrencyProvider>
      <QuestsProvider>
      <BagProvider>
      <RegisteredPhotosProvider>
      <TutorialProvider>
      <BackgroundMusicController />
      <ButtonSoundController />
      <SoundAssetPreloader />
      <GrowthStageModal />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<AuthRouteLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>

        <Route path="/ranch" element={<ProtectedRoute><Ranch /></ProtectedRoute>} />
        <Route path="/ranch/:habitatId" element={<ProtectedRoute><RanchHabitat /></ProtectedRoute>} />
        <Route path="/exploration" element={<ProtectedRoute><Exploration /></ProtectedRoute>} />
        <Route path="/field-guide" element={<ProtectedRoute><FieldGuide /></ProtectedRoute>} />
        <Route path="/quests" element={<ProtectedRoute><Quests /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><Friends /></ProtectedRoute>} />
        <Route path="/friends/ranch/:uid" element={<ProtectedRoute><FriendRanch /></ProtectedRoute>} />
        <Route path="/friends/ranch/:uid/:habitatId" element={<ProtectedRoute><FriendRanchHabitat /></ProtectedRoute>} />
        <Route path="/friends/field-guide/:uid" element={<ProtectedRoute><FriendFieldGuide /></ProtectedRoute>} />
        <Route path="/shop" element={<ProtectedRoute><Shop /></ProtectedRoute>} />
        <Route path="/bag" element={<ProtectedRoute><Bag /></ProtectedRoute>} />
        <Route path="/ai-companion" element={<ProtectedRoute><AiCompanion /></ProtectedRoute>} />
        <Route path="/quiz" element={<ProtectedRoute><Quiz /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/profile/edit" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
      </TutorialProvider>
      </RegisteredPhotosProvider>
      </BagProvider>
      </QuestsProvider>
      </CurrencyProvider>
    </AuthProvider>
  )
}
