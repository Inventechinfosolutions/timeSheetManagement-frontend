import './Welcome.css'

const Welcome = () => {
  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <h1>Welcome!</h1>
        <p className="welcome-message">
          You have successfully logged in to the TimeSheet Management System.
        </p>
        <div className="welcome-features">
          <h2>Features</h2>
          <ul>
            <li>Track your work hours</li>
            <li>Manage your timesheets</li>
            <li>View reports and analytics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Welcome

