import "./Footer.css";
import inventechLogo from "../assets/inventech-logo.jpg";
import worksphereLogo from "../assets/workspherelogo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <img
            src={inventechLogo}
            alt="InvenTech Logo"
            className="footer-logo"
          />

          <p className="footer-small">
            &copy; {currentYear} worksphere Powred by{" "}
            <a
              href="https://inventechinfo.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-brand"
            >
              InvenTech Info Solutions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
