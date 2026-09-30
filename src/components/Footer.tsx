import "./Footer.css";
import inventLogo from "../assets/invent-logo.svg";
import MobileFooter from "./mobileHeader/MobileFooter";

interface FooterProps {
  className?: string;
}

const Footer = ({ className = "" }: FooterProps) => {
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Mobile View - Separate dedicated file matching mobile header & sidebar */}
      <div className="block md:hidden">
        <MobileFooter className={className} />
      </div>

      {/* Desktop View */}
      <footer className={`footer ${className} hidden md:block`}>
        <div className="footer-container">
          <div className="footer-content">
            <span className="footer-small">
              &copy; {currentYear} Worksphere Powered by
            </span>
            <a
              href="https://inventechinfo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-brand"
              title="InvenTech Info Solutions"
            >
              <img
                src={inventLogo}
                alt="InvenTech"
                className="footer-logo"
              />
            </a>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
