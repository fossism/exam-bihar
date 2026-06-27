import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, BookOpen, GraduationCap, School } from 'lucide-react';

const Login = () => {
  const { loginUser, registerUser, error: authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [colleges, setColleges] = useState([]);
  
  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCollegeId, setRegCollegeId] = useState('');
  const [regBranch, setRegBranch] = useState('CSE');
  const [regSemester, setRegSemester] = useState(1);
  const [regNumber, setRegNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Searchable dropdown states
  const [collegeSearch, setCollegeSearch] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/colleges');
        if (res.ok) {
          const data = await res.json();
          setColleges(data);
          if (data.length > 0) {
            setRegCollegeId(data[0]._id);
            setCollegeSearch(data[0].name);
          }
        }
      } catch (err) {
        console.error('Error fetching colleges:', err);
      }
    };
    fetchColleges();
  }, []);

  const filteredColleges = colleges.filter((c) =>
    c.name.toLowerCase().includes(collegeSearch.toLowerCase()) ||
    c.code.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Please enter all credentials');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginUser(loginEmail, loginPassword);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regCollegeId || !regNumber) {
      setError('Please fill in all registration fields and select a valid college from the dropdown list');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await registerUser({
        name: regName,
        email: regEmail,
        password: regPassword,
        role: 'Student',
        collegeId: regCollegeId,
        branch: regBranch,
        semester: Number(regSemester),
        regNumber,
      });
      setSuccess('Registration successful! Logging you in...');
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '2rem 1.5rem',
    }}>
      <div className="glass-panel fade-in" style={{
        width: '100%',
        maxWidth: isLogin ? '420px' : '550px',
        padding: '2.5rem',
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '3.5rem',
            height: '3.5rem',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            marginBottom: '1rem',
          }}>
            <Shield size={28} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>ExamBihar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Unified Online Examination System for Bihar Colleges
          </p>
        </div>

        {/* Tab Controls */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px',
          marginBottom: '2rem',
        }}>
          <button
            className={`btn ${isLogin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.5rem 0' }}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Student/Faculty Login
          </button>
          <button
            className={`btn ${!isLogin ? 'btn-primary' : 'btn-secondary'}`}
            style={{ flex: 1, padding: '0.5rem 0' }}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Student Signup
          </button>
        </div>

        {/* Message Blocks */}
        {(error || authError) && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#f87171',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}>
            {error || authError}
          </div>
        )}
        {success && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#34d399',
            padding: '0.75rem 1rem',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}>
            {success}
          </div>
        )}

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                className="form-input"
                placeholder="eg. rajesh@beuc.edu.in or aarav@student.beuc.edu.in"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.75rem' }}>
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Aarav Singh"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. aarav@gmail.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Create password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">University Reg Number</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 22105118001"
                  value={regNumber}
                  onChange={(e) => setRegNumber(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Select Engineering College</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type to search college (e.g. MIT, Gaya)..."
                  value={collegeSearch}
                  onChange={(e) => {
                    setCollegeSearch(e.target.value);
                    setIsDropdownOpen(true);
                    const match = colleges.find(c => c.name.toLowerCase() === e.target.value.toLowerCase());
                    if (match) {
                      setRegCollegeId(match._id);
                    } else {
                      setRegCollegeId('');
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 250)}
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderColor: regCollegeId ? 'var(--primary)' : 'rgba(239, 68, 68, 0.4)',
                  }}
                />
                <span style={{
                  position: 'absolute',
                  right: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  pointerEvents: 'none',
                  fontSize: '0.8rem'
                }}>
                  ▼
                </span>
              </div>

              {isDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#111318',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: 'var(--radius-sm)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  zIndex: 99,
                  marginTop: '4px',
                }}>
                  {filteredColleges.length === 0 ? (
                    <div style={{ padding: '0.75rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                      No colleges found matching "{collegeSearch}"
                    </div>
                  ) : (
                    filteredColleges.map((c) => (
                      <div
                        key={c._id}
                        onClick={() => {
                          setRegCollegeId(c._id);
                          setCollegeSearch(c.name);
                          setIsDropdownOpen(false);
                        }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          color: regCollegeId === c._id ? 'var(--primary-hover)' : 'var(--text-main)',
                          background: regCollegeId === c._id ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                          transition: 'background 0.2s',
                          borderBottom: '1px solid rgba(255,255,255,0.02)',
                        }}
                        onMouseDown={(e) => e.preventDefault()}
                        className="dropdown-item-hover"
                      >
                        <div style={{ fontWeight: '500' }}>{c.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Code: {c.code} | {c.location}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
              <div className="form-group">
                <label className="form-label">Branch</label>
                <select
                  className="form-input"
                  style={{ background: 'var(--bg-secondary)', color: 'white' }}
                  value={regBranch}
                  onChange={(e) => setRegBranch(e.target.value)}
                >
                  <option value="CSE">Computer Science & Eng (CSE)</option>
                  <option value="ECE">Electronics & Comm Eng (ECE)</option>
                  <option value="EE">Electrical Eng (EE)</option>
                  <option value="ME">Mechanical Eng (ME)</option>
                  <option value="CE">Civil Eng (CE)</option>
                  <option value="IT">Information Tech (IT)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Semester</label>
                <select
                  className="form-input"
                  style={{ background: 'var(--bg-secondary)', color: 'white' }}
                  value={regSemester}
                  onChange={(e) => setRegSemester(e.target.value)}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>
                      Semester {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.75rem' }}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create Student Account'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
