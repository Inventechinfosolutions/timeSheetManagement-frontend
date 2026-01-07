import './Dashboard.css'

const Dashboard = () => {
  return (
    <div className="dashboard-wrapper">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
          <p className="dashboard-subtitle">Welcome back! Here's your overview</p>
        </div>

        <div className="dashboard-stats">
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>Total Hours</h3>
              <p className="stat-value">156.5</p>
              <p className="stat-label">This Month</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>Timesheets</h3>
              <p className="stat-value">12</p>
              <p className="stat-label">Active Entries</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>Completed</h3>
              <p className="stat-value">8</p>
              <p className="stat-label">This Week</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <h3>Efficiency</h3>
              <p className="stat-value">92%</p>
              <p className="stat-label">Average</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          <div className="dashboard-section">
            <h2>Recent Activity</h2>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon">✓</div>
                <div className="activity-details">
                  <p className="activity-title">Timesheet submitted</p>
                  <p className="activity-time">2 hours ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">✓</div>
                <div className="activity-details">
                  <p className="activity-title">New entry added</p>
                  <p className="activity-time">5 hours ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">✓</div>
                <div className="activity-details">
                  <p className="activity-title">Weekly report generated</p>
                  <p className="activity-time">1 day ago</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">✓</div>
                <div className="activity-details">
                  <p className="activity-title">Profile updated</p>
                  <p className="activity-time">2 days ago</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Quick Actions</h2>
            <div className="quick-actions">
              <button className="action-button">➕ Add Timesheet</button>
              <button className="action-button">📋 View Reports</button>
              <button className="action-button">⚙️ Settings</button>
              <button className="action-button">📤 Export Data</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

