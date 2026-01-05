import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import AdminLogin from './AdminDashboard/AdminLogin'
import EmpRegistration from './pages/EmpRegistration'
import AdminRegistration from './AdminDashboard/AdminRegistration'
import AdminDashboard from './AdminDashboard/AdminDashboard'
import EmployeeDashboard from './EmployeeDashboard/EmployeeDashboard'
import Landing from './components/Landing'
import Contact from './pages/Contact'
import About from './pages/About'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Navigate to="/admin-login" replace />} />

        <Route path="/landing" element={<Landing />} />
        <Route path="/welcome" element={<Navigate to="/landing" replace />} />
        <Route path="/" element={<Navigate to="/landing" replace />} />

        <Route path="/*" element={
          <Layout>
            <Routes>
              <Route path="/register" element={<EmpRegistration />} />
              <Route path="/admin-login" element={<AdminLogin />} />

              <Route path="/admin-register" element={<AdminRegistration />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/about" element={<About />} />
              <Route path="/admin-dashboard" element={<AdminDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
          </Layout>
        } />
        <Route path="/employee-dashboard" element={<EmployeeDashboard />} />
      </Routes>
    </Router>
  )
}

export default App

