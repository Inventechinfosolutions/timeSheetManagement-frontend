import { Link } from 'react-router-dom'
import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>TimeSheet Management</h3>
            <p>Efficiently manage your time and track your work hours.</p>
          </div>
          
          <div className="footer-section">
            <h4>Quick Links</h4>
            <ul>
              <li><Link to="/login">Login</Link></li>
              <li><Link to="/register">Register</Link></li>
              <li><Link to="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/contact">Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {currentYear} TimeSheet Management. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer

