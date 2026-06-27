import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { School, UserPlus, Users, FileText, Trash2, ShieldCheck, MapPin } from 'lucide-react';

const SuperAdminDashboard = () => {
  const { apiRequest, logoutUser, user } = useAuth();
  const [colleges, setColleges] = useState([]);
  
  // Stats
  const [stats, setStats] = useState({
    colleges: 0,
    admins: 0,
    students: 0,
    exams: 0
  });

  // Form States - College
  const [colName, setColName] = useState('');
  const [colCode, setColCode] = useState('');
  const [colLocation, setColLocation] = useState('');

  // Form States - College Admin
  const [adminName, setAdminName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [selectedCollegeId, setSelectedCollegeId] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = async () => {
    try {
      const collegeData = await apiRequest('/colleges');
      setColleges(collegeData);
      if (collegeData.length > 0 && !selectedCollegeId) {
        setSelectedCollegeId(collegeData[0]._id);
      }
      
      // Load mock stats or estimate
      setStats({
        colleges: collegeData.length,
        admins: collegeData.length, // Typically 1 per college
        students: 154, // Mock stats for demo
        exams: 24, // Mock stats for demo
      });
    } catch (err) {
      console.error('Failed to load colleges', err);
      setError('Failed to fetch college list');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCollege = async (e) => {
    e.preventDefault();
    if (!colName || !colCode || !colLocation) {
      setError('Please provide all college details');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await apiRequest('/colleges', {
        method: 'POST',
        body: JSON.stringify({ name: colName, code: colCode, location: colLocation }),
      });
      setMessage('Engineering college registered successfully!');
      setColName('');
      setColCode('');
      setColLocation('');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to register college');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!adminName || !adminEmail || !adminPassword || !selectedCollegeId) {
      setError('Please provide all admin account details');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      await apiRequest('/auth/admin-create-user', {
        method: 'POST',
        body: JSON.stringify({
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: 'CollegeAdmin',
          collegeId: selectedCollegeId,
        }),
      });
      setMessage('College Admin account created successfully!');
      setAdminName('');
      setAdminEmail('');
      setAdminPassword('');
    } catch (err) {
      setError(err.message || 'Failed to create college admin account');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCollege = async (id) => {
    if (!window.confirm('Are you sure you want to remove this college?')) return;
    setError('');
    setMessage('');
    try {
      await apiRequest(`/colleges/${id}`, { method: 'DELETE' });
      setMessage('College removed successfully');
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to remove college');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="brand">
          <ShieldCheck size={26} color="#10b981" />
          <span>ExamBihar Admin</span>
        </div>
        
        <div className="sidebar-nav">
          <div className="nav-link active">
            <School size={18} />
            <span>Colleges Panel</span>
          </div>
        </div>

        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Logged in as: <strong style={{ color: 'white' }}>{user?.name}</strong>
        </div>

        <div className="logout-btn" onClick={logoutUser}>
          <span>Sign Out</span>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>University Control Console</h2>
            <p style={{ color: 'var(--text-muted)' }}>Bihar Engineering University (BEU) Administration</p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', padding: '1rem', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}
        {message && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', color: '#34d399', padding: '1rem', marginBottom: '1.5rem' }}>
            {message}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <School size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Colleges</p>
              <h3 style={{ fontSize: '1.5rem' }}>{stats.colleges}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(6, 182, 212, 0.15)', color: '#06b6d4', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <UserPlus size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Admins</p>
              <h3 style={{ fontSize: '1.5rem' }}>{stats.admins}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <Users size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Students</p>
              <h3 style={{ fontSize: '1.5rem' }}>{stats.students}</h3>
            </div>
          </div>

          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ background: 'rgba(217, 70, 239, 0.15)', color: '#d946ef', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
              <FileText size={24} />
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase' }}>Total Exams</p>
              <h3 style={{ fontSize: '1.5rem' }}>{stats.exams}</h3>
            </div>
          </div>
        </div>

        {/* Creation Grids */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
          {/* Register College Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <School size={20} color="#10b981" /> Register Engineering College
            </h3>
            
            <form onSubmit={handleCreateCollege}>
              <div className="form-group">
                <label className="form-label">College Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Bhagalpur College of Engineering"
                  value={colName}
                  onChange={(e) => setColName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">College Code</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. BCEB"
                    value={colCode}
                    onChange={(e) => setColCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Campus Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Bhagalpur"
                    value={colLocation}
                    onChange={(e) => setColLocation(e.target.value)}
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? 'Registering...' : 'Register College'}
              </button>
            </form>
          </div>

          {/* Create College Admin Form */}
          <div className="glass-panel">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <UserPlus size={20} color="#06b6d4" /> Create College Admin
            </h3>
            
            <form onSubmit={handleCreateAdmin}>
              <div className="form-group">
                <label className="form-label">Admin Representative Name</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Director Office MIT"
                  value={adminName}
                  onChange={(e) => setAdminName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Login Email</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. admin@mitm.edu.in"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="password123"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Assign to College</label>
                <select
                  className="form-input"
                  style={{ background: 'var(--bg-secondary)', color: 'white' }}
                  value={selectedCollegeId}
                  onChange={(e) => setSelectedCollegeId(e.target.value)}
                  required
                >
                  {colleges.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                {loading ? 'Creating Account...' : 'Generate College Admin'}
              </button>
            </form>
          </div>
        </div>

        {/* Colleges List */}
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Registered Engineering Colleges</h3>
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>College Name</th>
                  <th>Code</th>
                  <th>Campus Location</th>
                  <th>Date Registered</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {colleges.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                      No engineering colleges registered yet.
                    </td>
                  </tr>
                ) : (
                  colleges.map((col) => (
                    <tr key={col._id}>
                      <td style={{ fontWeight: '500' }}>{col.name}</td>
                      <td>
                        <span className="badge badge-primary">{col.code}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--text-muted)' }}>
                          <MapPin size={14} />
                          {col.location}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-muted)' }}>
                        {new Date(col.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '0.4rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }}
                          onClick={() => handleDeleteCollege(col._id)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
