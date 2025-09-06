import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import OurAnimals from './pages/OurAnimals'
import JoinUs from './pages/JoinUs'
import AboutUs from './pages/AboutUs'
import ContactUs from './pages/ContactUs'
import Donate from './pages/Donate'
import LostAndFound from './pages/LostAndFound'
import AdoptionForm from './pages/OtherForm/AdoptionForm'
import DonationForm from './pages/OtherForm/DonationForm'
import VolunteerForm from './pages/OtherForm/VolunteerForm'
import LostReport from './pages/ReportForm/LostReport'
import FoundReport from './pages/ReportForm/FoundReport'
import AbusedReport from './pages/ReportForm/AbusedReport'
import TransparencyDashboard from './pages/TransparencyDashboard'
import ReportModal from './components/ReportModal'
import LoginModal from './components/LoginModal'
import SignUpModal from './components/SignUpModal'
import ForgotPasswordModal from './components/ForgotPasswordModal'
import Footer from './components/Footer'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
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
            </Routes>
          </main>
          <ReportModal />
          <LoginModal />
          <SignUpModal />
          <ForgotPasswordModal />
          <Toaster position="top-right" />
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App 