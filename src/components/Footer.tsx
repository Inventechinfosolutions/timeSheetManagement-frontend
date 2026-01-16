import './Footer.css'
import inventechLogo from '../assets/inventech-logo.jpg'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <img src={inventechLogo} alt="Logo" className="footer-logo" />
          <p className="footer-small">
            &copy; {currentYear} TimeSheet Management | Design and Developed by <span className="footer-brand">InvenTech Info Solutions</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
