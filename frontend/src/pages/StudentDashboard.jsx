import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Award, FileText, CheckCircle, Clock, BookOpen, AlertCircle, PlayCircle, LogOut } from 'lucide-react';

const StudentDashboard = () => {
  const { apiRequest, logoutUser, user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [activeTab, setActiveTab] = useState('lobby'); // 'lobby' or 'results'
  const [loading, setLoading] = useState(true);
  const [selectedResult, setSelectedResult] = useState(null);

  const loadExams = async () => {
    try {
      setLoading(true);
      const data = await apiRequest('/exams/student');
      setExams(data);
    } catch (err) {
      console.error('Failed to load student exams:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleLaunchConsole = (id) => {
    if (window.confirm('Launch examination console? Fullscreen and webcam monitoring will be activated. Make sure your browser allows webcam access.')) {
      navigate(`/exam/${id}`);
    }
  };

  const handleViewResult = async (attemptId) => {
    try {
      const detail = await apiRequest(`/attempts/${attemptId}`);
      setSelectedResult(detail);
    } catch (err) {
      alert('Failed to fetch detailed result sheet');
    }
  };

  const activeExams = exams.filter(e => {
    const now = new Date();
    return new Date(e.endTime) > now && e.attemptStatus !== 'Submitted' && e.attemptStatus !== 'AutoSubmitted' && e.attemptStatus !== 'Disqualified';
  });

  const completedExams = exams.filter(e => {
    const now = new Date();
    return new Date(e.endTime) <= now || e.attemptStatus === 'Submitted' || e.attemptStatus === 'AutoSubmitted' || e.attemptStatus === 'Disqualified';
  });

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="brand" style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>
          <GraduationCapIcon />
          <span>exambihar <span style={{ color: 'var(--primary)' }}>~$</span></span>
        </div>

        <div className="sidebar-nav">
          <div className={`nav-link ${activeTab === 'lobby' ? 'active' : ''}`} onClick={() => { setActiveTab('lobby'); setSelectedResult(null); }}>
            <Clock size={18} />
            <span>Exams Lobby</span>
          </div>

          <div className={`nav-link ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>
            <Award size={18} />
            <span>Reports & Grades</span>
          </div>
        </div>

        {user && (
          <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Student: <strong style={{ color: 'white' }}>{user.name}</strong>
            <div style={{ fontSize: '10px', marginTop: '2px' }}>Reg: {user.regNumber}</div>
            <div style={{ fontSize: '10px' }}>Sem {user.semester} | {user.branch}</div>
          </div>
        )}

        <div className="logout-btn" onClick={logoutUser}>
          <LogOut size={16} />
          <span>Sign Out</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.75rem' }}>Welcome, {user?.name || 'Student'}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Check scheduled examinations, launch secure sessions, and view semester marksheet grades.</p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>Loading exams roster...</div>
        ) : (
          <div>
            {/* LOBBY TAB */}
            {activeTab === 'lobby' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Active & Upcoming Examinations</h3>
                
                {activeExams.length === 0 ? (
                  <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <BookOpen size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No active examinations scheduled for your Branch ({user?.branch}) and Semester ({user?.semester}) right now.</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {activeExams.map((exam) => {
                      const now = new Date();
                      const start = new Date(exam.startTime);
                      const isUpcoming = now < start;
                      
                      return (
                        <div key={exam._id} className="glass-panel glass-panel-hover" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: isUpcoming ? '3px solid var(--border-color)' : '3px solid var(--primary)' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                              <span className="badge badge-primary">{exam.subject}</span>
                              <span className="badge badge-success">{exam.duration} Minutes</span>
                            </div>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{exam.title}</h4>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: '1.4', marginBottom: '1rem' }}>
                              {exam.description}
                            </p>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                              <div>Start: {new Date(exam.startTime).toLocaleString()}</div>
                              <div>End: {new Date(exam.endTime).toLocaleString()}</div>
                            </div>
                          </div>

                          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                            {isUpcoming ? (
                              <button className="btn btn-secondary" style={{ width: '100%' }} disabled>
                                Upcoming Exam (LOCKED)
                              </button>
                            ) : (
                              <button
                                className="btn btn-primary"
                                style={{ width: '100%' }}
                                onClick={() => handleLaunchConsole(exam._id)}
                              >
                                <PlayCircle size={16} style={{ marginRight: '4px' }} />
                                {exam.attemptStatus === 'Started' ? 'Resume Exam Console' : 'Launch Exam Console'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* RESULTS TAB */}
            {activeTab === 'results' && (
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '1.25rem' }}>Past Evaluations & marksheets</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: selectedResult ? '1.1fr 2fr' : '1fr', gap: '2rem' }}>
                  {/* Results list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {completedExams.length === 0 ? (
                      <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <Award size={40} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>No past evaluation sessions found.</p>
                      </div>
                    ) : (
                      completedExams.map((exam) => (
                        <div
                          key={exam._id}
                          className="glass-panel glass-panel-hover"
                          style={{
                            padding: '1.25rem',
                            borderLeft: '4px solid',
                            borderLeftColor: exam.attemptStatus === 'Disqualified' ? 'var(--danger)' : exam.score !== null ? 'var(--success)' : 'var(--warning)',
                            background: selectedResult?.examId?._id === exam._id ? 'rgba(16, 185, 129, 0.08)' : 'var(--glass-bg)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <span className="badge badge-primary" style={{ marginBottom: '0.4rem' }}>{exam.subject}</span>
                              <h4 style={{ fontSize: '1rem' }}>{exam.title}</h4>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              {exam.attemptStatus === 'Disqualified' ? (
                                <span style={{ color: 'var(--danger)', fontWeight: 'bold', fontSize: '0.85rem' }}>DISQUALIFIED</span>
                              ) : exam.score !== null ? (
                                <strong style={{ fontSize: '1.1rem', color: 'var(--success)' }}>
                                  {exam.score} Marks
                                </strong>
                              ) : (
                                <span style={{ color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 'bold' }}>GRADING PENDING</span>
                              )}
                            </div>
                          </div>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            <span>Attempt: {exam.attemptStatus}</span>
                            {exam.attemptId && (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                                onClick={() => handleViewResult(exam.attemptId)}
                              >
                                View Marksheet
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Detailed Marksheet Card */}
                  {selectedResult && (
                    <div className="glass-panel fade-in">
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        <div>
                          <h3 style={{ fontSize: '1.2rem' }}>Exam Evaluation Marksheet</h3>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            Subject: {selectedResult.examId?.subject} | Student: {user?.name}
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <h3 style={{ fontSize: '1.5rem', color: 'var(--success)' }}>
                            {selectedResult.isGraded ? `${selectedResult.totalScore} Marks` : 'Awaiting Final Review'}
                          </h3>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                            Total Grade Card
                          </span>
                        </div>
                      </div>

                      {/* Proctor Violations Alert */}
                      {(selectedResult.tabSwitches > 0 || selectedResult.fullscreenViolations > 0) && (
                        <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', padding: '0.5rem 1rem', borderRadius: '4px', marginBottom: '1.5rem', fontSize: '0.75rem', color: '#fbbf24' }}>
                          Notice: Exam session recorded {selectedResult.tabSwitches} tab-switches and {selectedResult.fullscreenViolations} fullscreen escapes.
                        </div>
                      )}

                      {/* Answers Sheet review */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                        {selectedResult.answers?.map((ans, idx) => (
                          <div key={ans._id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', background: 'rgba(255,255,255,0.01)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                              <strong style={{ color: 'var(--text-main)' }}>Q{idx + 1}. {ans.question?.type}</strong>
                              <span style={{ color: ans.evaluatedPoints > 0 ? '#34d399' : 'var(--text-muted)' }}>
                                Score: {ans.evaluatedPoints} / {ans.question?.points} Marks
                              </span>
                            </div>
                            <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', whiteSpace: 'pre-wrap' }}>{ans.question?.text}</p>
                            
                            {/* Student Answer */}
                            <div style={{ padding: '0.75rem', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', fontSize: '0.85rem', borderLeft: '3px solid var(--primary)' }}>
                              <p style={{ color: 'var(--text-dark)', fontSize: '0.7rem', textTransform: 'uppercase', marginBottom: '2px' }}>Your Response:</p>
                              {ans.question?.type === 'MCQ' ? (
                                <span>Selected Option {ans.selectedOption !== undefined ? ans.selectedOption + 1 : 'None'}</span>
                              ) : ans.question?.type === 'Coding' ? (
                                <pre style={{ fontFamily: 'monospace', overflowX: 'auto' }}>{ans.codeAnswer}</pre>
                              ) : (
                                <p style={{ whiteSpace: 'pre-wrap' }}>{ans.textAnswer}</p>
                              )}
                            </div>

                            {/* Feedbacks */}
                            {ans.feedback && (
                              <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#34d399' }}>
                                <strong>Feedback:</strong> {ans.feedback}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Simple custom component icon since we don't have lucide-react loaded or want to make it 100% stable
const GraduationCapIcon = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '1.75rem',
    height: '1.75rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(0, 255, 102, 0.05)',
    border: '1px solid rgba(0, 255, 102, 0.2)',
    color: 'var(--primary)',
  }}>
    <FileText size={16} />
  </div>
);

export default StudentDashboard;
