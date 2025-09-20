import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './user/modal/Navbar'
import Home from './user/pages/Main/Home'
import OurAnimals from './user/pages/Main/OurAnimals'
import JoinUs from './user/pages/Main/JoinUs'
import AboutUs from './user/pages/Main/AboutUs'
import ContactUs from './user/pages/Main/ContactUs'
import Donate from './user/pages/Main/Donate'
import LostAndFound from './user/pages/Main/LostAndFound'
import AdoptionForm from './user/pages/OtherForm/AdoptionForm'
import DonationForm from './user/pages/OtherForm/DonationForm'
import VolunteerForm from './user/pages/OtherForm/VolunteerForm'
import LostReport from './user/pages/ReportForm/LostReport'
import FoundReport from './user/pages/ReportForm/FoundReport'
import AbusedReport from './user/pages/ReportForm/AbusedReport'
import TransparencyDashboard from './user/pages/Main/TransparencyDashboard'
import PasswordReset from './user/authentication/PasswordReset'
import ReportModal from './user/modal/ReportModal'
import LoginModal from './user/authentication/LoginModal'
import SignUpModal from './user/authentication/SignUpModal'
import ForgotPasswordModal from './user/authentication/ForgotPasswordModal'
import Footer from './user/modal/Footer'
import AdminApp from './admin/AdminApp'

function AppLayout() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {!isAdminRoute && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/our-animals" element={<OurAnimals />} />
          <Route path="/join-us" element={<JoinUs />} />
          <Route path="/about-us" element={<AboutUs />} />
          <Route path="/contact-us" element={<ContactUs />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/lost-and-found" element={<LostAndFound />} />
          <Route path="/adoption-form/:animalId" element={<AdoptionForm />} />
          <Route path="/donation-form" element={<DonationForm />} />
          <Route path="/volunteer" element={<VolunteerForm />} />
          <Route path="/report/lost" element={<LostReport />} />
          <Route path="/report/found" element={<FoundReport />} />
          <Route path="/report/abuse" element={<AbusedReport />} />
          <Route path="/transparency" element={<TransparencyDashboard />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/admin/*" element={<AdminApp />} />
        </Routes>
      </main>
      {!isAdminRoute && (
        <>
          <ReportModal />
          <LoginModal />
          <SignUpModal />
          <ForgotPasswordModal />
          <Footer />
        </>
      )}
      <Toaster position="top-right" />
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppLayout />
      </Router>
    </AuthProvider>
  )
}

export default App 