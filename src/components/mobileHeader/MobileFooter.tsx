import "./MobileFooter.css";
import inventLogo from "../../assets/invent-logo.svg";

interface MobileFooterProps {
  className?: string;
}

const MobileFooter = ({ className = "" }: MobileFooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={`mobile-footer ${className}`} aria-label="Mobile Footer">
      <div className="mobile-footer-container">
        <div className="mobile-footer-content">
          <span className="mobile-footer-text">
            &copy; {currentYear} Worksphere Powered by
          </span>
          <a
            href="https://inventechinfo.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="mobile-footer-brand-link"
            title="InvenTech Info Solutions"
          >
            <span className="mobile-footer-logo-badge">
              <img
                src={inventLogo}
                alt="InvenTech"
                className="mobile-footer-logo"
              />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
};

export default MobileFooter;
