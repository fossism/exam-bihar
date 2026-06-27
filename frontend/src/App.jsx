import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import CollegeAdminDashboard from './pages/CollegeAdminDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import ExamConsole from './pages/ExamConsole';
import LiveProctor from './pages/LiveProctor';

// Protected Route wrapper component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#090d16',
        color: '#94a3b8',
        fontFamily: 'sans-serif'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(255,255,255,0.05)',
            borderTopColor: '#10b981',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <span>Loading session data...</span>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Routing logic based on logged-in user role
const DashboardSelector = () => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'SuperAdmin':
      return <SuperAdminDashboard />;
    case 'CollegeAdmin':
      return <CollegeAdminDashboard />;
    case 'Faculty':
      return <FacultyDashboard />;
    case 'Student':
      return <StudentDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppContent = () => {
  const { token } = useAuth();
  
  return (
    <Router>
      <Routes>
        {/* Public Login Gate */}
        <Route 
          path="/login" 
          element={token ? <Navigate to="/dashboard" replace /> : <Login />} 
        />
        
        {/* Dashboard router based on user roles */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardSelector />
            </ProtectedRoute>
          } 
        />

        {/* Student Exam Console (requires Student role) */}
        <Route 
          path="/exam/:id" 
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <ExamConsole />
            </ProtectedRoute>
          } 
        />

        {/* Proctor dashboard (requires Faculty or CollegeAdmin role) */}
        <Route 
          path="/proctor/:examId" 
          element={
            <ProtectedRoute allowedRoles={['Faculty', 'CollegeAdmin']}>
              <LiveProctor />
            </ProtectedRoute>
          } 
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
