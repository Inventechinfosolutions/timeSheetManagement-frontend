// import { useNavigate } from 'react-router-dom'
import {
    Users,
    Shield,
    Clock,
    Laptop,
    BarChart3,
    Download,
    Key,
    Calendar,
    CheckCircle2,
    Building2,
    MapPin,
    Target,
    ShieldCheck,
} from 'lucide-react'
import './MobileAbout.css'

const employeeFeatures = [
    { icon: <Clock size={18} />, title: 'Log in & Log out', desc: 'Accurately record daily working hours.' },
    { icon: <Laptop size={18} />, title: 'Work Mode Selection', desc: 'Choose Office, WFH, or Client Visit.' },
    { icon: <BarChart3 size={18} />, title: 'Personalized Dashboards', desc: 'Summaries of present days & avg hours.' },
    { icon: <Key size={18} />, title: 'Secure Access', desc: 'Change passwords at any time.' },
    { icon: <Download size={18} />, title: 'Custom Reports', desc: 'Download historical data by date range.' },
    { icon: <Calendar size={18} />, title: 'Calendar Snapshots', desc: 'Visual representation of attendance status.' }
]

const dashboardInsights = [
    'Total employee headcount & present status',
    'Daily work mode distribution (Home/Office/Client)',
    'Real-time absentee tracking',
    'Organizational average working hours'
]

const reportingFeatures = [
    'Individual employee-wise attendance',
    'Department-level performance tracking',
    'Complete Organization-wide data exports'
]

const stats = [
    { icon: <Target size={22} />, value: '100%', label: 'Accuracy' },
    { icon: <Clock size={22} />, value: 'Real-Time', label: 'Monitoring' },
    { icon: <ShieldCheck size={22} />, value: 'Secure', label: 'Data' }
]

const MobileAbout = () => {
    // const navigate = useNavigate()

    return (
        <div className="mabout-page">
            {/* Back link */}
            {/* <button className="mabout-back-link" onClick={() => navigate(-1)}>
                <ArrowLeft size={18} />
                <span>BACK</span>
            </button> */}

            {/* Hero */}
            <div className="mabout-hero">
                <svg
                    className="mabout-hero-wave"
                    viewBox="0 0 300 200"
                    preserveAspectRatio="none"
                    aria-hidden="true"
                >
                    {/* Left Wave */}
                    <path
                        d="M0,140 C40,150 60,102 120,110 C200,120 160,60 240,0 L0,0 Z"
                        fill="rgba(255,255,255,0.08)"
                    />

                    {/* Right Wave */}
                    <path
                        d="M60,0 C140,60 100,120 180,110 C240,102 260,150 300,140 L300,200 L60,200 Z"
                        fill="rgba(255,255,255,0.08)"
                    />

                    {/* Left Small Wave */}
                    <path
                        d="M0,150 C20,130 30,90 80,90 C150,90 120,40 190,0 L0,0 Z"
                        fill="rgba(255,255,255,0.06)"
                    />

                    {/* Right Small Wave */}
                    <path
                        d="M110,0 C180,40 150,90 220,90 C270,90 290,130 300,150 L300,0 Z"
                        fill="rgba(255,255,255,0.06)"
                    />
                </svg>

                <h1 className="mabout-title">
                    About the Worksphere Application
                </h1>

                <p className="mabout-subtitle">
                    A comprehensive attendance and workforce time-tracking solution designed to simplify
                    daily attendance management for modern hybrid teams.
                </p>
            </div>

            {/* Core Description Card */}
            {/* Core Description Card */}
            <div className="mabout-card mabout-description-card">
                <div className="mabout-icon-badge mabout-icon-badge--blue mabout-description-icon">
                    <ShieldCheck size={16} />
                </div>

                <p>
                    The platform ensures accurate tracking, transparency, and actionable
                    insights for both employees and administrators. Built to support modern
                    work models such as office work, work from home, and client-site
                    engagements, we simplify workforce productivity with precision.
                </p>
            </div>
            {/* Employee Experience */}
            <div className="mabout-card">
                <div className="mabout-section-header">
                    <div className="mabout-icon-badge mabout-icon-badge--blue">
                        <Users size={20} />
                    </div>
                    <div>
                        <h2 className="mabout-section-title">Employee Experience</h2>
                        <p className="mabout-section-intro">
                            Securely access and manage daily attendance efficiently through our intuitive
                            portal.
                        </p>
                    </div>
                </div>

                <div className="mabout-feature-grid">
                    {employeeFeatures.map((item, i) => (
                        <div className="mabout-feature-cell" key={i}>
                            <div className="mabout-feature-icon">{item.icon}</div>
                            <div className="mabout-feature-text">
                                <h4>{item.title}</h4>
                                <p>{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Administrative Power */}
            <div className="mabout-card">
                <div className="mabout-section-header">
                    <div className="mabout-icon-badge mabout-icon-badge--teal">
                        <Shield size={20} />
                    </div>
                    <div>
                        <h2 className="mabout-section-title">Administrative Power</h2>
                        <p className="mabout-section-intro">
                            Centralized monitoring and real-time oversight across the entire organization.
                        </p>
                    </div>
                </div>

                <div className="mabout-admin-grid">
                    <div className="mabout-subcard mabout-subcard--teal">
                        <h4>
                            <BarChart3 size={16} />
                            Dashboard Insights
                        </h4>
                        <ul>
                            {dashboardInsights.map((text, i) => (
                                <li key={i}>
                                    <CheckCircle2 size={12} />
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="mabout-subcard mabout-subcard--blue">
                        <h4>
                            <Download size={16} />
                            Multi-Level Reporting
                        </h4>
                        <ul>
                            {reportingFeatures.map((text, i) => (
                                <li key={i}>
                                    <CheckCircle2 size={12} />
                                    <span>{text}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                <div className="mabout-centralized">
                    <div className="mabout-centralized-icons">
                        <Building2 size={26} />
                        <MapPin size={26} />
                    </div>
                    <p>Centralized Monitoring for Distributed Teams</p>
                </div>
            </div>

            {/* Purpose & Business Value */}
            <div className="mabout-purpose">
                <h2>Purpose &amp; Business Value</h2>
                <p>
                    The Timesheet Application is built to support hybrid and distributed work environments
                    while maintaining accountability and operational efficiency. By combining intuitive
                    employee workflows with powerful administrative dashboards, the system helps
                    organizations reduce manual tracking, improve attendance accuracy, and gain clear
                    visibility into workforce availability and work patterns.
                </p>

                <div className="mabout-stats">
                    {stats.map((s, i) => (
                        <div className="mabout-stat" key={i}>
                            <div className="mabout-stat-icon">{s.icon}</div>
                            <div className="mabout-stat-value">{s.value}</div>
                            <div className="mabout-stat-label">{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

export default MobileAbout