import { ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ApiLoadingSpinner from './ApiLoadingSpinner'

import './Layout.css'

interface LayoutProps {
  children: ReactNode
}

const isDashboardRoute = (pathname: string) =>
  pathname.includes("/admin-dashboard") ||
  pathname.includes("/manager-dashboard") ||
  pathname.includes("/employee-dashboard");

const Layout = ({ children }: LayoutProps) => {
  const { pathname } = useLocation()
  const showContentSpinner = !isDashboardRoute(pathname)

  return (
    <div className="layout">
      <Header />
      <main className="main-content">
        {showContentSpinner ? (
          <div className="relative flex-1 min-h-0 flex flex-col">
            {children}
            <ApiLoadingSpinner contained />
          </div>
        ) : (
          children
        )}
        <Footer />
      </main>
    </div>
  )
}

export default Layout

