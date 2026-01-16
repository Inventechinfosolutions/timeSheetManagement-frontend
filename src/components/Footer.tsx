import './Footer.css'

const Footer = () => {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-small">
          &copy; {currentYear} TimeSheet Management | Design and Developed by <span className="footer-brand">InvenTech Info Solutions</span>
        </p>
      </div>
    </footer>
  )
}

export default Footer
