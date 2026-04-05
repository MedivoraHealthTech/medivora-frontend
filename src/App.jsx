import { Routes, Route } from 'react-router-dom'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import ProfileSettings from './pages/ProfileSettings'
import DoctorsPage from './pages/DoctorsPage'
import DoctorPublicProfile from './pages/DoctorPublicProfile'
import ConsultationsPage from './pages/ConsultationsPage'
import PrescriptionsPage from './pages/PrescriptionsPage'
import BookAppointment from './pages/BookAppointment'
import DashboardPage from './pages/DashboardPage'
import AppLayout from './pages/AppLayout'
import ProtectedRoute from './components/ProtectedRoute'
import DoctorLayout from './pages/doctor/DoctorLayout'
import DoctorLoginPage from './pages/doctor/DoctorLoginPage'
import DoctorDashboard from './pages/doctor/DoctorDashboard'
import DoctorConsultations from './pages/doctor/DoctorConsultations'
import DoctorProfile from './pages/doctor/DoctorProfile'
import PrescriptionReview from './pages/doctor/PrescriptionReview'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/doctor/login" element={<DoctorLoginPage />} />

      {/* Patient routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="settings" element={<ProfileSettings />} />
          <Route path="doctors" element={<DoctorsPage />} />
          <Route path="doctors/:id" element={<DoctorPublicProfile />} />
          <Route path="consultations" element={<ConsultationsPage />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="book-appointment" element={<BookAppointment />} />
        </Route>
      </Route>

      {/* Doctor routes */}
      <Route element={<ProtectedRoute requiredRole="doctor" redirectTo="/login" />}>
        <Route element={<DoctorLayout />}>
          <Route path="doctor" element={<DoctorDashboard />} />
          <Route path="doctor/consultations" element={<DoctorConsultations />} />
          <Route path="doctor/prescriptions" element={<PrescriptionReview />} />
          <Route path="doctor/profile" element={<DoctorProfile />} />
        </Route>
      </Route>
    </Routes>
  )
}
