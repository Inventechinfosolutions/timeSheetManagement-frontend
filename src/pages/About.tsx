import './About.css'

const About = () => {
  return (
    <div className="about-container">
      <div className="about-hero">
        <h1>About TimeSheet Management</h1>
        <p className="hero-subtitle">Streamlining time tracking for modern teams</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Our Mission</h2>
          <p>
            At TimeSheet Management, we believe that efficient time tracking is the foundation of 
            successful project management. Our mission is to provide businesses and individuals with 
            a powerful, intuitive platform that simplifies time tracking, enhances productivity, and 
            delivers actionable insights.
          </p>
        </section>

        <section className="about-section">
          <h2>What We Offer</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⏱️</div>
              <h3>Easy Time Tracking</h3>
              <p>Quick and intuitive time entry with support for multiple projects and tasks.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Detailed Reports</h3>
              <p>Comprehensive analytics and reports to help you understand how time is being spent.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Team Collaboration</h3>
              <p>Work seamlessly with your team members and manage timesheets collectively.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Reliable</h3>
              <p>Your data is protected with enterprise-grade security and regular backups.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Multi-Platform</h3>
              <p>Access your timesheets from anywhere, on any device, at any time.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Fast & Efficient</h3>
              <p>Lightning-fast performance with an interface designed for speed and ease of use.</p>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Our Story</h2>
          <p>
            Founded in 2020, TimeSheet Management was born from a simple observation: most time 
            tracking tools were either too complex or too basic. We set out to create a solution that 
            strikes the perfect balance between functionality and simplicity.
          </p>
          <p>
            Today, we serve thousands of businesses and individuals worldwide, helping them track 
            their time more effectively and make data-driven decisions. Our commitment to 
            continuous improvement means we're always adding new features and refining the user experience.
          </p>
        </section>

        <section className="about-section">
          <h2>Our Values</h2>
          <div className="values-list">
            <div className="value-item">
              <h3>Simplicity</h3>
              <p>We believe in making complex tasks simple and accessible to everyone.</p>
            </div>
            <div className="value-item">
              <h3>Innovation</h3>
              <p>We continuously innovate to stay ahead of the curve and meet evolving needs.</p>
            </div>
            <div className="value-item">
              <h3>Reliability</h3>
              <p>We're committed to providing a stable, dependable platform you can count on.</p>
            </div>
            <div className="value-item">
              <h3>Customer Focus</h3>
              <p>Your success is our success. We listen, learn, and adapt based on your feedback.</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default About

