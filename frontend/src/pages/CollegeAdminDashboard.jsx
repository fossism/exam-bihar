import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, UserPlus, BookOpen, Upload, ClipboardList, Trash2, Mail, Award } from 'lucide-react';

const CollegeAdminDashboard = () => {
  const { apiRequest, logoutUser, user } = useAuth();
  const [activeTab, setActiveTab] = useState('faculty'); // 'faculty' or 'students'
  const [facultyList, setFacultyList] = useState([]);
  const [studentList, setStudentList] = useState([]);
  
  // Single User Form States
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  
  // Student Specific Form States
  const [studentBranch, setStudentBranch] = useState('CSE');
  const [studentSemester, setStudentSemester] = useState(1);
  const [studentRegNum, setStudentRegNum] = useState('');

  // Bulk CSV States
  const [csvText, setCsvText] = useState('');
  const [csvProgress, setCsvProgress] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadRosters = async () => {
    try {
      // In a real app we'd fetch filtered by college context. Let's fetch mock or create helper.
      // For now, let's build local rosters
      setFacultyList([
        { _id: '1', name: 'Dr. Rajesh Kumar', email: 'rajesh@beuc.edu.in', role: 'Faculty' },
        { _id: '2', name: 'Prof. Anita Sharma', email: 'anita@beuc.edu.in', role: 'Faculty' },
      ]);
      setStudentList([
        { _id: '1', name: 'Aarav Kumar Singh', email: 'aarav@student.beuc.edu.in', regNumber: '22105118001', branch: 'CSE', semester: 6 },
        { _id: '2', name: 'Priya Kumari', email: 'priya@student.beuc.edu.in', regNumber: '22105118002', branch: 'CSE', semester: 6 },
      ]);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadRosters();
  }, []);

  const handleCreateFaculty = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) {
      setError('Please fill in all faculty credentials');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const newFaculty = await apiRequest('/auth/admin-create-user', {
        method: 'POST',
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: 'Faculty',
        }),
      });
      setMessage(`Faculty account for ${newFaculty.name} created!`);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      // Add to local state list
      setFacultyList(prev => [...prev, newFaculty]);
    } catch (err) {
      setError(err.message || 'Failed to create faculty profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword || !studentRegNum) {
      setError('Please fill in all student details');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const newStudent = await apiRequest('/auth/admin-create-user', {
        method: 'POST',
        body: JSON.stringify({
          name: formName,
          email: formEmail,
          password: formPassword,
          role: 'Student',
          branch: studentBranch,
          semester: Number(studentSemester),
          regNumber: studentRegNum,
        }),
      });
      setMessage(`Student account for ${newStudent.name} created!`);
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      setStudentRegNum('');
      // Add to local state
      setStudentList(prev => [...prev, { ...newStudent, regNumber: studentRegNum, branch: studentBranch, semester: studentSemester }]);
    } catch (err) {
      setError(err.message || 'Failed to create student account');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkImport = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) {
      setError('Please paste CSV data');
      return;
    }
    setError('');
    setMessage('');
    setCsvProgress('Initializing import...');
    
    // Parse CSV lines: name, email, password, regNumber, branch, semester
    const lines = csvText.split('\n');
    let successCount = 0;
    let failCount = 0;
    
    setLoading(true);
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length < 6) {
        failCount++;
        continue;
      }
      
      const [name, email, password, regNumber, branch, semester] = parts.map(p => p.trim());
      
      setCsvProgress(`Importing student ${i + 1} of ${lines.length}...`);
      
      try {
        const added = await apiRequest('/auth/admin-create-user', {
          method: 'POST',
          body: JSON.stringify({
            name,
            email,
            password,
            role: 'Student',
            regNumber,
            branch,
            semester: Number(semester)
          })
        });
        successCount++;
        setStudentList(prev => [...prev, { ...added, regNumber, branch, semester: Number(semester) }]);
      } catch (err) {
        console.error('Failed line:', line, err);
        failCount++;
      }
    }
    
    setCsvProgress('');
    setLoading(false);
    setCsvText('');
    setMessage(`Bulk upload complete. Successfully registered ${successCount} students. Fails/Skips: ${failCount}.`);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="brand" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <img src="/golghar.png" alt="Golghar Logo" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
          <span>exambihar <span style={{ color: 'var(--primary)' }}>~$</span></span>
        </div>

        <div className="sidebar-nav">
          <div className={`nav-link ${activeTab === 'faculty' ? 'active' : ''}`} onClick={() => setActiveTab('faculty')}>
            <Users size={18} />
            <span>Faculty Roster</span>
          </div>

          <div className={`nav-link ${activeTab === 'students' ? 'active' : ''}`} onClick={() => setActiveTab('students')}>
            <ClipboardList size={18} />
            <span>Student Roster</span>
          </div>
        </div>

        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          College: <strong style={{ color: 'white' }}>{user?.collegeId?.name || 'N/A'}</strong>
        </div>

        <div className="logout-btn" onClick={logoutUser}>
          <span>Sign Out</span>
        </div>
      </div>

      {/* Main Panel */}
      <div className="main-content">
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.25rem' }}>College Administration Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Manage examiner credentials, classes, and student enrollments</p>
        </div>

        {/* Message Blocks */}
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
        {csvProgress && (
          <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', color: '#34d399', padding: '1rem', marginBottom: '1.5rem' }}>
            {csvProgress}
          </div>
        )}

        {activeTab === 'faculty' ? (
          /* FACULTY MANAGEMENT TAB */
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
            {/* Create Faculty Form */}
            <div className="glass-panel" style={{ height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <UserPlus size={20} color="#10b981" /> Create Faculty Account
              </h3>
              
              <form onSubmit={handleCreateFaculty}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Dr. Rajesh Kumar"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. rajesh@college.edu.in"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="password123"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                  {loading ? 'Creating...' : 'Register Faculty'}
                </button>
              </form>
            </div>

            {/* Faculty List Table */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Faculty members (Examiners)</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyList.map((fac) => (
                      <tr key={fac._id}>
                        <td style={{ fontWeight: '500' }}>{fac.name}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                            <Mail size={14} />
                            {fac.email}
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-primary">{fac.role}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          /* STUDENT MANAGEMENT TAB */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '2rem' }}>
              {/* Register Student Form */}
              <div className="glass-panel">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserPlus size={20} color="#06b6d4" /> Add Single Student
                </h3>
                
                <form onSubmit={handleCreateStudent}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Priyesh Ranjan"
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-input"
                        placeholder="e.g. student@college.edu.in"
                        value={formEmail}
                        onChange={(e) => setFormEmail(e.target.value)}
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
                        placeholder="pass123"
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">University Reg Number</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. 22105118005"
                        value={studentRegNum}
                        onChange={(e) => setStudentRegNum(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Branch</label>
                      <select
                        className="form-input"
                        style={{ background: 'var(--bg-secondary)', color: 'white' }}
                        value={studentBranch}
                        onChange={(e) => setStudentBranch(e.target.value)}
                      >
                        <option value="CSE">CSE</option>
                        <option value="ECE">ECE</option>
                        <option value="EE">EE</option>
                        <option value="ME">ME</option>
                        <option value="CE">CE</option>
                        <option value="IT">IT</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Semester</label>
                      <select
                        className="form-input"
                        style={{ background: 'var(--bg-secondary)', color: 'white' }}
                        value={studentSemester}
                        onChange={(e) => setStudentSemester(e.target.value)}
                      >
                        {[1,2,3,4,5,6,7,8].map(s => (
                          <option key={s} value={s}>Semester {s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
                    {loading ? 'Adding...' : 'Register Student'}
                  </button>
                </form>
              </div>

              {/* Bulk CSV Uploader */}
              <div className="glass-panel">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Upload size={20} color="#d946ef" /> Bulk Import Students (CSV)
                </h3>
                
                <form onSubmit={handleBulkImport}>
                  <div className="form-group">
                    <label className="form-label">Paste CSV Rows (Comma Separated)</label>
                    <textarea
                      className="form-input"
                      rows="6"
                      placeholder="Format: Name, Email, Password, RegNumber, Branch, Semester&#10;Amit Kumar, amit@beuc.edu.in, student123, 22105118003, CSE, 6&#10;Sudha Kumari, sudha@beuc.edu.in, student123, 22105118004, CSE, 6"
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      style={{ resize: 'none', fontFamily: 'monospace', fontSize: '0.85rem' }}
                    ></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
                    {loading ? 'Running CSV Import...' : 'Import CSV List'}
                  </button>
                </form>
              </div>
            </div>

            {/* Student list */}
            <div className="glass-panel">
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Registered Students</h3>
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Registration No</th>
                      <th>Branch</th>
                      <th>Semester</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentList.map((std) => (
                      <tr key={std._id}>
                        <td style={{ fontWeight: '500' }}>{std.name}</td>
                        <td>{std.email}</td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{std.regNumber}</span>
                        </td>
                        <td>{std.branch}</td>
                        <td>
                          <span className="badge badge-success">Sem {std.semester}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollegeAdminDashboard;
