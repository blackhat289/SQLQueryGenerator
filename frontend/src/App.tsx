import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastNotifications'
import { AuthProvider } from './components/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Dashboard } from './pages/Dashboard'
import { SQLGenerator } from './pages/SQLGenerator'
import { SchemaUpload } from './pages/SchemaUpload'
import { QueryHistory } from './pages/QueryHistory'
import { Settings } from './pages/Settings'
import { Profile } from './pages/Profile'
import { NotFound } from './pages/NotFound'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ForgotPassword } from './pages/ForgotPassword'

export const App: React.FC = () => {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <ErrorBoundary>
            <Routes>
              {/* Public Authentications Paths */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />

              {/* Secure App Shell Routes */}
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-300">
                      <Navbar />
                      <div className="flex flex-1 relative">
                        <Sidebar />
                        <main className="flex-1 p-5 sm:p-6 md:p-8 overflow-y-auto max-h-[calc(100vh-4rem)] pb-20 md:pb-8">
                          <Routes>
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/generator" element={<SQLGenerator />} />
                            <Route path="/upload" element={<SchemaUpload />} />
                            <Route path="/history" element={<QueryHistory />} />
                            <Route path="/settings" element={<Settings />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="*" element={<NotFound />} />
                          </Routes>
                        </main>
                      </div>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </ErrorBoundary>
        </AuthProvider>
      </ToastProvider>
    </Router>
  )
}

export default App;
