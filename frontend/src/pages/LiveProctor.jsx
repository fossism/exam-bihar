import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, AlertTriangle, Eye, Video, Wifi, WifiOff, CheckCircle, RefreshCw, XCircle } from 'lucide-react';

const LiveProctor = () => {
  const { examId } = useParams();
  const { apiRequest } = useAuth();
  const [examDetails, setExamDetails] = useState(null);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchProctorData = async () => {
    try {
      // Get exam details if not already loaded
      if (!examDetails) {
        const exam = await apiRequest(`/exams/${examId}`);
        setExamDetails(exam);
      }

      // Fetch all attempts for this exam
      const attempts = await apiRequest(`/attempts/exam/${examId}`);
      setStudentAttempts(attempts);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Proctor API Error:', err);
      setError('Connection interrupted. Retrying...');
    }
  };

  useEffect(() => {
    fetchProctorData();
    
    // Set up rapid polling interval for proctor console (every 2.5 seconds)
    const interval = setInterval(() => {
      fetchProctorData();
    }, 2500);

    return () => clearInterval(interval);
  }, [examId, examDetails]);

  const handleForceSubmit = async (attemptId, studentName) => {
    if (!window.confirm(`Force submit exam session for ${studentName}?`)) return;
    try {
      await apiRequest(`/attempts/${attemptId}/submit`, { method: 'POST' });
      alert(`Exam submitted for ${studentName}`);
      fetchProctorData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDisqualify = async (attemptId, studentName) => {
    if (!window.confirm(`Disqualify student ${studentName} for cheating? This locks the student out of their exam.`)) return;
    try {
      // In our controller, warning logging triggers disqualification on limit.
      // Or we can manually mock it by updating attempt status via a grading endpoint.
      // Let's call the warning endpoint with a limit trigger.
      await apiRequest(`/attempts/${attemptId}/warning`, {
        method: 'POST',
        body: JSON.stringify({ type: 'tabSwitch' }), // Trigger tab warning which increments limit
      });
      // We repeat it if limit is higher, or just trigger warning. Let's make an explicit disqualification action.
      // Wait, we can call save with status: Disqualified since we own backend. Let's do that!
      await apiRequest(`/attempts/${attemptId}/save`, {
        method: 'POST',
        body: JSON.stringify({ answers: [], status: 'Disqualified' }), // Save will auto submit
      });
      alert(`Student ${studentName} disqualified.`);
      fetchProctorData();
    } catch (err) {
      alert(err.message);
    }
  };

  const getStatusBadge = (attempt) => {
    const now = new Date();
    const heartbeatAge = now - new Date(attempt.lastHeartbeat);
    const isOffline = heartbeatAge > 8000; // 8 seconds buffer

    if (attempt.status === 'Submitted' || attempt.status === 'AutoSubmitted') {
      return (
        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <CheckCircle size={12} /> SUBMITTED
        </span>
      );
    }
    if (attempt.status === 'Disqualified') {
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
          <XCircle size={12} /> DISQUALIFIED
        </span>
      );
    }
    if (isOffline) {
      return (
        <span className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', background: '#374151', color: '#9ca3af' }}>
          <WifiOff size={12} /> OFFLINE
        </span>
      );
    }
    return (
      <span className="badge badge-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
        <Wifi size={12} /> ACTIVE
      </span>
    );
  };

  return (
    <div style={{ padding: '2rem', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Video size={24} color="var(--danger)" />
            <h1 style={{ fontSize: '1.5rem', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)' }}>Live Proctor Command Console</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Exam: <strong style={{ color: 'white' }}>{examDetails?.title || 'Loading...'}</strong> | Subject: {examDetails?.subject}
          </p>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <RefreshCw size={14} className="spin" />
            <span>Auto-refreshing live stream</span>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
            Last Sync: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'N/A'}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-sm)', color: '#f87171', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      {/* Grid of student tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {studentAttempts.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '6rem 0', background: 'rgba(255,255,255,0.01)', border: '1px dashed var(--border-color)', borderRadius: 'var(--radius-md)' }}>
            <ShieldAlert size={48} style={{ color: 'var(--text-dark)', marginBottom: '1rem' }} />
            <h3 style={{ color: 'var(--text-muted)' }}>No student logins logged yet</h3>
            <p style={{ color: 'var(--text-dark)', fontSize: '0.9rem', marginTop: '0.25rem' }}>Exam lobby is active. Waiting for candidates to launch console.</p>
          </div>
        ) : (
          studentAttempts.map((attempt) => {
            const numQuestions = examDetails?.questions?.length || 0;
            const numAnswered = attempt.answers?.filter(ans => ans.selectedOption !== undefined || ans.textAnswer || ans.codeAnswer).length || 0;
            const latestSnapshot = attempt.webcamSnapshots?.length > 0
              ? attempt.webcamSnapshots[attempt.webcamSnapshots.length - 1].image
              : null;
            
            const hasCheated = attempt.tabSwitches > 0 || attempt.fullscreenViolations > 0;

            return (
              <div
                key={attempt._id}
                className="glass-panel"
                style={{
                  padding: '1.25rem',
                  border: hasCheated ? '1px solid var(--warning)' : '1px solid var(--border-color)',
                  background: hasCheated ? 'rgba(255, 204, 0, 0.02)' : 'var(--bg-secondary)',
                }}
              >
                {/* Webcam Preview Screen */}
                <div style={{ position: 'relative', width: '100%', height: '140px', background: '#000', borderRadius: '6px', overflow: 'hidden', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {latestSnapshot ? (
                    <img src={latestSnapshot} alt={attempt.studentId?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dark)' }}>
                      <Video size={32} />
                      <span style={{ fontSize: '10px', marginTop: '0.25rem' }}>No Camera Capture</span>
                    </div>
                  )}

                  {/* Absolute Status Badges */}
                  <div style={{ position: 'absolute', top: '8px', left: '8px' }}>
                    {getStatusBadge(attempt)}
                  </div>
                </div>

                {/* Candidate Info */}
                <div>
                  <h4 style={{ fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {attempt.studentId?.name}
                  </h4>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '2px 0' }}>
                    Reg: {attempt.studentId?.regNumber} | CSE
                  </p>
                  
                  {/* Progress Indicator */}
                  <div style={{ margin: '0.75rem 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span>{numAnswered} / {numQuestions} Questions</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${numQuestions > 0 ? (numAnswered / numQuestions) * 100 : 0}%`,
                          height: '100%',
                          background: 'var(--primary)',
                          borderRadius: '10px',
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Anti-cheat alerts */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', padding: '0.5rem', background: '#000000', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ flex: 1, textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                      <p style={{ color: 'var(--text-muted)' }}>Tab Switches</p>
                      <strong style={{ color: attempt.tabSwitches > 0 ? 'var(--warning)' : 'white', fontSize: '0.9rem' }}>
                        {attempt.tabSwitches}
                      </strong>
                    </div>
                    <div style={{ flex: 1, textAlign: 'center' }}>
                      <p style={{ color: 'var(--text-muted)' }}>FS Escapes</p>
                      <strong style={{ color: attempt.fullscreenViolations > 0 ? 'var(--danger)' : 'white', fontSize: '0.9rem' }}>
                        {attempt.fullscreenViolations}
                      </strong>
                    </div>
                  </div>

                  {/* Actions (Only for active attempts) */}
                  {attempt.status === 'Started' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.35rem', fontSize: '0.75rem', borderColor: 'rgba(255,51,51,0.2)', color: 'var(--danger)' }}
                        onClick={() => handleDisqualify(attempt._id, attempt.studentId?.name)}
                      >
                        Disqualify
                      </button>
                      <button
                        className="btn btn-primary"
                        style={{ padding: '0.35rem', fontSize: '0.75rem' }}
                        onClick={() => handleForceSubmit(attempt._id, attempt.studentId?.name)}
                      >
                        Force Submit
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default LiveProctor;
