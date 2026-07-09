import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, BookOpen, GraduationCap, School } from 'lucide-react';

const staticColleges = [
  { _id: '667cfc10d3f28d5423bc0001', name: 'Bihar Engineering University Campus (BEUC)', code: '100', location: 'Patna, Bihar' },
  { _id: '667cfc10d3f28d5423bc0002', name: 'Vidya Vihar Institute of Technology, Purnea', code: '102', location: 'Purnea, Bihar' },
  { _id: '667cfc10d3f28d5423bc0003', name: 'Netaji Subhas Institute of Technology, Bihta', code: '103', location: 'Bihta, Patna, Bihar' },
  { _id: '667cfc10d3f28d5423bc0004', name: 'Sityog Institute of Technology, Aurangabad', code: '106', location: 'Aurangabad, Bihar' },
  { _id: '667cfc10d3f28d5423bc0005', name: 'Muzaffarpur Institute of Technology (MIT)', code: '107', location: 'Muzaffarpur, Bihar' },
  { _id: '667cfc10d3f28d5423bc0006', name: 'Bhagalpur College of Engineering, Bhagalpur', code: '108', location: 'Bhagalpur, Bihar' },
  { _id: '667cfc10d3f28d5423bc0007', name: 'Nalanda College of Engineering, Chandi', code: '109', location: 'Chandi, Nalanda, Bihar' },
  { _id: '667cfc10d3f28d5423bc0008', name: 'Gaya College of Engineering, Gaya', code: '110', location: 'Gaya, Bihar' },
  { _id: '667cfc10d3f28d5423bc0009', name: 'Darbhanga College of Engineering, Darbhanga', code: '111', location: 'Darbhanga, Bihar' },
  { _id: '667cfc10d3f28d5423bc000a', name: 'Motihari College of Engineering, Motihari', code: '113', location: 'Motihari, Bihar' },
  { _id: '667cfc10d3f28d5423bc000b', name: 'LNJP Institute of Technology, Chapra', code: '117', location: 'Chapra, Bihar' },
  { _id: '667cfc10d3f28d5423bc000c', name: 'Buddha Institute of Technology, Gaya', code: '118', location: 'Gaya, Bihar' },
  { _id: '667cfc10d3f28d5423bc000d', name: 'Adwaita Mission Institute of Technology, Banka', code: '119', location: 'Banka, Bihar' },
  { _id: '667cfc10d3f28d5423bc000e', name: 'Exalt College of Engineering & Technology, Vaishali', code: '122', location: 'Vaishali, Bihar' },
  { _id: '667cfc10d3f28d5423bc000f', name: 'Siwan Engineering & Technical Institute, Siwan', code: '123', location: 'Siwan, Bihar' },
  { _id: '667cfc10d3f28d5423bc0010', name: 'Sershah Engineering College, Sasaram', code: '124', location: 'Sasaram, Bihar' },
  { _id: '667cfc10d3f28d5423bc0011', name: 'RRSDCE Begusarai', code: '125', location: 'Begusarai, Bihar' },
  { _id: '667cfc10d3f28d5423bc0012', name: 'Bakhtiyarpur College of Engineering, Patna', code: '126', location: 'Bakhtiyarpur, Patna, Bihar' },
  { _id: '667cfc10d3f28d5423bc0013', name: 'Sitamarhi Institute of Technology, Sitamarhi', code: '127', location: 'Sitamarhi, Bihar' },
  { _id: '667cfc10d3f28d5423bc0014', name: 'B. P. Mandal College of Engineering, Madhepura', code: '128', location: 'Madhepura, Bihar' },
  { _id: '667cfc10d3f28d5423bc0015', name: 'Katihar Engineering College, Katihar', code: '129', location: 'Katihar, Bihar' },
  { _id: '667cfc10d3f28d5423bc0016', name: 'Supaul College of Engineering, Supaul', code: '130', location: 'Supaul, Bihar' },
  { _id: '667cfc10d3f28d5423bc0017', name: 'Purnea College of Engineering, Purnea', code: '131', location: 'Purnea, Bihar' },
  { _id: '667cfc10d3f28d5423bc0018', name: 'Saharsa College of Engineering, Saharsa', code: '132', location: 'Saharsa, Bihar' },
  { _id: '667cfc10d3f28d5423bc0019', name: 'Government Engineering College, Jamui', code: '133', location: 'Jamui, Bihar' },
  { _id: '667cfc10d3f28d5423bc001a', name: 'Government Engineering College, Banka', code: '134', location: 'Banka, Bihar' },
  { _id: '667cfc10d3f28d5423bc001b', name: 'Government Engineering College, Vaishali', code: '135', location: 'Vaishali, Bihar' },
  { _id: '667cfc10d3f28d5423bc001c', name: 'Mother’s Institute of Technology, Bihta', code: '136', location: 'Bihta, Patna, Bihar' },
  { _id: '667cfc10d3f28d5423bc001d', name: 'R.P. Sharma Institute of Technology, Patna', code: '139', location: 'Patna, Bihar' },
  { _id: '667cfc10d3f28d5423bc001e', name: 'Maulana Azad College of Engineering & Technology, Patna', code: '140', location: 'Patna, Bihar' },
  { _id: '667cfc10d3f28d5423bc001f', name: 'Government Engineering College, Nawada', code: '141', location: 'Nawada, Bihar' },
  { _id: '667cfc10d3f28d5423bc0020', name: 'Government Engineering College, Kishanganj', code: '142', location: 'Kishanganj, Bihar' },
  { _id: '667cfc10d3f28d5423bc0021', name: 'Government Engineering College, Munger', code: '144', location: 'Munger, Bihar' },
  { _id: '667cfc10d3f28d5423bc0022', name: 'Government Engineering College, Sheohar', code: '145', location: 'Sheohar, Bihar' },
  { _id: '667cfc10d3f28d5423bc0023', name: 'Government Engineering College, West Champaran', code: '146', location: 'Bettiah, West Champaran, Bihar' },
  { _id: '667cfc10d3f28d5423bc0024', name: 'Government Engineering College, Aurangabad', code: '147', location: 'Aurangabad, Bihar' },
  { _id: '667cfc10d3f28d5423bc0025', name: 'Government Engineering College, Kaimur', code: '148', location: 'Kaimur, Bihar' },
  { _id: '667cfc10d3f28d5423bc0026', name: 'Government Engineering College, Gopalganj', code: '149', location: 'Gopalganj, Bihar' },
  { _id: '667cfc10d3f28d5423bc0027', name: 'Government Engineering College, Madhubani', code: '150', location: 'Madhubani, Bihar' },
  { _id: '667cfc10d3f28d5423bc0028', name: 'Government Engineering College, Siwan', code: '151', location: 'Siwan, Bihar' },
  { _id: '667cfc10d3f28d5423bc0029', name: 'Government Engineering College, Jehanabad', code: '152', location: 'Jehanabad, Bihar' },
  { _id: '667cfc10d3f28d5423bc002a', name: 'Government Engineering College, Arwal', code: '153', location: 'Arwal, Bihar' },
  { _id: '667cfc10d3f28d5423bc002b', name: 'Government Engineering College, Khagaria', code: '154', location: 'Khagaria, Bihar' },
  { _id: '667cfc10d3f28d5423bc002c', name: 'Government Engineering College, Buxar', code: '155', location: 'Buxar, Bihar' },
  { _id: '667cfc10d3f28d5423bc002d', name: 'Government Engineering College, Bhojpur', code: '156', location: 'Bhojpur, Bihar' },
  { _id: '667cfc10d3f28d5423bc002e', name: 'Government Engineering College, Sheikhpura', code: '157', location: 'Sheikhpura, Bihar' },
  { _id: '667cfc10d3f28d5423bc002f', name: 'Government Engineering College, Lakhisarai', code: '158', location: 'Lakhisarai, Bihar' },
  { _id: '667cfc10d3f28d5423bc0030', name: 'Government Engineering College, Samastipur', code: '159', location: 'Samastipur, Bihar' },
  { _id: '667cfc10d3f28d5423bc0031', name: 'Shri Phanishwar Nath Renu Engineering College, Araria', code: '165', location: 'Araria, Bihar' },
  { _id: '667cfc10d3f28d5423bc0032', name: 'Millia Kishanganj College of Engineering & Technology, Kishanganj', code: '166', location: 'Kishanganj, Bihar' },
  { _id: '667cfc10d3f28d5423bc0033', name: 'Millia Institute of Technology, Purnia', code: '167', location: 'Purnia, Bihar' },
  { _id: '667cfc10d3f28d5423bc0034', name: 'CIPET: Institute of Petrochemicals Technology, Bihta', code: '169', location: 'Bihta, Patna, Bihar' },
  { _id: '667cfc10d3f28d5423bc0035', name: 'Dr. Ashok Gagan College, Bihta', code: '170', location: 'Bihta, Patna, Bihar' }
];

const Login = () => {
  const { loginUser, registerUser, error: authError } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [colleges, setColleges] = useState(staticColleges);

  // Login Form States
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regCollegeId, setRegCollegeId] = useState(staticColleges[0]._id);
  const [regBranch, setRegBranch] = useState('CSE');
  const [regSemester, setRegSemester] = useState(1);
  const [regNumber, setRegNumber] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Searchable dropdown states
  const [collegeSearch, setCollegeSearch] = useState(staticColleges[0].name);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchColleges = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/colleges');
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0) {
            setColleges(data);
            // Sync current selection if matches
            const currentMatch = data.find(c => c.name === collegeSearch);
            if (currentMatch) {
              setRegCollegeId(currentMatch._id);
            } else {
              setRegCollegeId(data[0]._id);
              setCollegeSearch(data[0].name);
            }
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
      if (err.message && (err.message.includes('fetch') || err.message.toLowerCase().includes('network'))) {
        setError('Network Error: Cannot connect to the backend server. Please ensure the backend server is running (run "npm run dev" or "npm start" in the backend folder) and MongoDB is active.');
      } else {
        setError(err.message || 'Login failed. Please check your credentials.');
      }
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
      if (err.message && (err.message.includes('fetch') || err.message.toLowerCase().includes('network'))) {
        setError('Network Error: Cannot connect to the backend server. Please ensure the backend server is running (run "npm run dev" or "npm start" in the backend folder) and MongoDB is active.');
      } else {
        setError(err.message || 'Registration failed.');
      }
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

            <div className="form-group" style={{ position: 'relative' }} ref={dropdownRef}>
              <label className="form-label">Select Engineering College</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type to search college (e.g. MIT, Gaya)..."
                  value={collegeSearch}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCollegeSearch(val);
                    setIsDropdownOpen(true);
                    const match = colleges.find(c => c.name.toLowerCase() === val.toLowerCase());
                    if (match) {
                      setRegCollegeId(match._id);
                    } else {
                      setRegCollegeId('');
                    }
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  required
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    borderColor: regCollegeId ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)',
                  }}
                />
                <span
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    userSelect: 'none'
                  }}
                >
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
