import './Footer.css'
import inventechLogo from '../assets/inventech-logo.jpg'
import inLogo from '../assets/in-logo.png'
import { useState, useEffect } from 'react'

const Footer = () => {
  const currentYear = new Date().getFullYear()
  const [imgSrc, setImgSrc] = useState(inventechLogo);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setImgLoaded(true);
    img.onerror = () => {
      setImgLoaded(false);
      // Try alternative logo if primary fails
      setImgSrc(require('../assets/in-logo.png'));
    };
    img.src = inventechLogo;
  }, []);

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          {imgLoaded ? (
            <img src={imgSrc} alt="Logo" className="footer-logo" onError={() => setImgLoaded(false)} />
          ) : (
            <span className="footer-text-logo">InvenTech</span>
          )}
          <p className="footer-small">
            &copy; {currentYear} TimeSheet Management | Design and Developed by <span className="footer-brand">InvenTech Info Solutions</span>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
