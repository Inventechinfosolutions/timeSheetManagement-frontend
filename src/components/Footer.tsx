import "./Footer.css";
import inventechLogo from "../assets/logo.png";

interface FooterProps {
  className?: string;
}

const Footer = ({ className = "" }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`footer ${className}`}>
      <div className="footer-container">
        <div className="footer-content">
          <p className="footer-small">
            &copy; {currentYear} Worksphere Powered by
          </p>

          <a
            href="https://inventechinfo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-brand"
          >
            <img
              src={inventechLogo}
              alt="InvenTech Info Solutions"
              className="footer-logo"
            />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;