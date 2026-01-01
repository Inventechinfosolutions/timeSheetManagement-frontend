import { Link, useNavigate, useLocation } from 'react-router-dom'
import './Header.css'

const Header = () => {
  const location = useLocation()

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-logo">
          <Link to="/" className="logo-link">
            <h2>TimeSheet Management</h2>
          </Link>
        </div>
        
        <nav className="header-nav">
          <Link 
            to="/dashboard" 
            className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </Link>
          <Link 
            to="/login" 
            className={`nav-link ${location.pathname === '/login' ? 'active' : ''}`}
          >
            Login
          </Link>
          <Link 
            to="/register" 
            className={`nav-link ${location.pathname === '/register' ? 'active' : ''}`}
          >
            Register
          </Link>
          <Link 
            to="/about" 
            className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}
          >
            About
          </Link>
          <Link 
            to="/contact" 
            className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}
          >
            Contact
          </Link>
        </nav>
      </div>
    </header>
  )
}

export default Header

