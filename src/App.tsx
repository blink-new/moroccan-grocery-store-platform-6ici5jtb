import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import blink from './blink/client'
import HomePage from './pages/HomePage'
import MerchantRegister from './pages/MerchantRegister'
import MerchantDashboard from './pages/MerchantDashboard'
import StorePage from './pages/StorePage'
import AdminPanel from './pages/AdminPanel'
import { Toaster } from './components/ui/toaster'

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/register" element={<MerchantRegister />} />
          <Route path="/dashboard/:merchantId" element={<MerchantDashboard />} />
          <Route path="/store/:storeId" element={<StorePage />} />
          <Route path="/admin/:adminId" element={<AdminPanel />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  )
}

export default App