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
import Adopt from './pages/Adopt'
import LostAndFound from './pages/LostAndFound'
import AnimalProfile from './pages/AnimalProfile'
import AdoptionForm from './pages/AdoptionForm'
import DonationForm from './pages/DonationForm'
import ReportModal from './components/ReportModal'
import LoginModal from './components/LoginModal'
import SignUpModal from './components/SignUpModal'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/our-animals" element={<OurAnimals />} />
              <Route path="/join-us" element={<JoinUs />} />
              <Route path="/about-us" element={<AboutUs />} />
              <Route path="/contact-us" element={<ContactUs />} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/adopt" element={<Adopt />} />
              <Route path="/lost-and-found" element={<LostAndFound />} />
              <Route path="/animal/:id" element={<AnimalProfile />} />
              <Route path="/adoption-form/:animalId" element={<AdoptionForm />} />
              <Route path="/donation-form" element={<DonationForm />} />
            </Routes>
          </main>
          <ReportModal />
          <LoginModal />
          <SignUpModal />
          <Toaster position="top-right" />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App 