import { useState } from 'react'
import './Contact.css'

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    // Validation
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      setError('Please fill in all fields')
      return
    }

    if (!formData.email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    // Simulate form submission
    console.log('Contact form submitted:', formData)
    setSuccess(true)
    setFormData({ name: '', email: '', subject: '', message: '' })
    
    // Reset success message after 5 seconds
    setTimeout(() => setSuccess(false), 5000)
  }

  return (
    <div className="contact-container">
      <div className="contact-content">
        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>

        <div className="contact-wrapper">
          <div className="contact-info">
            <h2>Get in Touch</h2>
            <div className="info-item">
              <div className="info-icon">📧</div>
              <div>
                <h3>Email</h3>
                <p>support@timesheet.com</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">📞</div>
              <div>
                <h3>Phone</h3>
                <p>+1 (555) 123-4567</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">📍</div>
              <div>
                <h3>Address</h3>
                <p>123 Business Street<br />Suite 100<br />City, State 12345</p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">🕒</div>
              <div>
                <h3>Business Hours</h3>
                <p>Monday - Friday: 9:00 AM - 6:00 PM<br />Saturday: 10:00 AM - 4:00 PM<br />Sunday: Closed</p>
              </div>
            </div>
          </div>

          <div className="contact-form-wrapper">
            <form onSubmit={handleSubmit} className="contact-form">
              {error && <div className="error-message">{error}</div>}
              {success && <div className="success-message">Thank you! Your message has been sent successfully.</div>}
              
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                >
                  <option value="">Select a subject</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Inquiry</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="message">Message *</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Enter your message"
                  rows={6}
                />
              </div>

              <button type="submit" className="submit-button">
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact

