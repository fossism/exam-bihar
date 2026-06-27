import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { BookOpen, Calendar, HelpCircle, Eye, Trash2, Edit2, Play, Users, CheckCircle, Save, FileText, ChevronRight } from 'lucide-react';

const FacultyDashboard = () => {
  const { apiRequest, logoutUser, user } = useAuth();
  
  // Dashboard Tabs: 'questions', 'exams', 'grading'
  const [activeTab, setActiveTab] = useState('questions');
  
  // Data States
  const [questions, setQuestions] = useState([]);
  const [exams, setExams] = useState([]);
  const [activeExamForGrading, setActiveExamForGrading] = useState(null);
  const [attempts, setAttempts] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);

  // Form toggles
  const [showQForm, setShowQForm] = useState(false);
  const [showEForm, setShowEForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);

  // Question Form States
  const [qSubject, setQSubject] = useState('');
  const [qTopic, setQTopic] = useState('');
  const [qType, setQType] = useState('MCQ');
  const [qText, setQText] = useState('');
  const [qOptions, setQOptions] = useState(['', '', '', '']);
  const [qCorrect, setQCorrect] = useState(0);
  const [qDifficulty, setQDifficulty] = useState('Medium');
  const [qPoints, setQPoints] = useState(2);
  
  // Coding fields
  const [codingTemplate, setCodingTemplate] = useState('');
  const [testCasesText, setTestCasesText] = useState('[\n  {"input": "\\"hello\\"", "output": "olleh", "isPublic": true}\n]');

  // Exam Form States
  const [eTitle, setETitle] = useState('');
  const [eDescription, setEDescription] = useState('');
  const [eSubject, setESubject] = useState('');
  const [eDuration, setEDuration] = useState(30);
  const [eStart, setEStart] = useState('');
  const [eEnd, setEEnd] = useState('');
  const [eSemester, setESemester] = useState(6);
  const [eBranches, setEBranches] = useState(['CSE']);
  const [eRandomize, setERandomize] = useState(false);
  const [eWebcam, setEWebcam] = useState(true);
  const [eFullscreen, setEFullscreen] = useState(true);
  const [eTabLimit, setETabLimit] = useState(3);
  const [selectedQIds, setSelectedQIds] = useState([]);

  // Grading Form States
  const [gradeScore, setGradeScore] = useState(0);
  const [gradeFeedback, setGradeFeedback] = useState('');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Load Initial Data
  const loadQuestions = async () => {
    try {
      const qData = await apiRequest('/questions');
      setQuestions(qData);
    } catch (err) {
      console.error('Error fetching questions', err);
    }
  };

  const loadExams = async () => {
    try {
      const eData = await apiRequest('/exams');
      setExams(eData);
    } catch (err) {
      console.error('Error fetching exams', err);
    }
  };

  useEffect(() => {
    loadQuestions();
    loadExams();
  }, []);

  // Handle Question Creation/Update
  const handleSaveQuestion = async (e) => {
    e.preventDefault();
    if (!qSubject || !qText) {
      setError('Subject and Question Text are required');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    let parsedTestCases = [];
    if (qType === 'Coding') {
      try {
        parsedTestCases = JSON.parse(testCasesText);
      } catch (err) {
        setError('Invalid test case JSON syntax');
        setLoading(false);
        return;
      }
    }

    const payload = {
      subject: qSubject,
      topic: qTopic,
      type: qType,
      text: qText,
      options: qType === 'MCQ' ? qOptions : undefined,
      correctOption: qType === 'MCQ' ? Number(qCorrect) : undefined,
      codingTemplate: qType === 'Coding' ? codingTemplate : undefined,
      codingTestCases: qType === 'Coding' ? parsedTestCases : undefined,
      difficulty: qDifficulty,
      points: Number(qPoints),
    };

    try {
      if (editingQuestion) {
        await apiRequest(`/questions/${editingQuestion._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        setMessage('Question updated in bank');
      } else {
        await apiRequest('/questions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setMessage('Question added to bank');
      }
      
      // Reset form
      setQSubject('');
      setQTopic('');
      setQType('MCQ');
      setQText('');
      setQOptions(['', '', '', '']);
      setQCorrect(0);
      setCodingTemplate('');
      setQPoints(2);
      setShowQForm(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (err) {
      setError(err.message || 'Error saving question');
    } finally {
      setLoading(false);
    }
  };

  // Handle Exam Creation
  const handleCreateExam = async (e) => {
    e.preventDefault();
    if (!eTitle || !eSubject || !eStart || !eEnd || selectedQIds.length === 0) {
      setError('Please fill in exam details and choose at least 1 question');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);

    const payload = {
      title: eTitle,
      description: eDescription,
      subject: eSubject,
      duration: Number(eDuration),
      startTime: eStart,
      endTime: eEnd,
      semester: Number(eSemester),
      branches: eBranches,
      randomizeQuestions: eRandomize,
      questions: selectedQIds,
      proctoringSettings: {
        webcamSnapshots: eWebcam,
        fullscreenLock: eFullscreen,
        tabSwitchLimit: Number(eTabLimit),
      },
    };

    try {
      await apiRequest('/exams', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setMessage('Exam scheduled successfully!');
      // Reset
      setETitle('');
      setEDescription('');
      setESubject('');
      setEStart('');
      setEEnd('');
      setSelectedQIds([]);
      setShowEForm(false);
      loadExams();
    } catch (err) {
      setError(err.message || 'Error scheduling exam');
    } finally {
      setLoading(false);
    }
  };

  const handleEditQuestionClick = (q) => {
    setEditingQuestion(q);
    setQSubject(q.subject);
    setQTopic(q.topic || '');
    setQType(q.type);
    setQText(q.text);
    if (q.options) setQOptions(q.options);
    if (q.correctOption !== undefined) setQCorrect(q.correctOption);
    if (q.codingTemplate) setCodingTemplate(q.codingTemplate);
    if (q.codingTestCases) setTestCasesText(JSON.stringify(q.codingTestCases, null, 2));
    setQDifficulty(q.difficulty);
    setQPoints(q.points);
    setShowQForm(true);
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question from bank?')) return;
    try {
      await apiRequest(`/questions/${id}`, { method: 'DELETE' });
      setMessage('Question removed');
      loadQuestions();
    } catch (err) {
      setError(err.message || 'Failed to delete question');
    }
  };

  // Open Grading Sub-panel
  const openGradingView = async (exam) => {
    setActiveExamForGrading(exam);
    setActiveTab('grading');
    setSelectedAttempt(null);
    try {
      const attemptData = await apiRequest(`/attempts/exam/${exam._id}`);
      setAttempts(attemptData);
    } catch (err) {
      console.error(err);
    }
  };

  const selectStudentAttempt = async (id) => {
    try {
      const detail = await apiRequest(`/attempts/${id}`);
      setSelectedAttempt(detail);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGradeSubmit = async (e, answerId) => {
    e.preventDefault();
    try {
      await apiRequest(`/attempts/${selectedAttempt._id}/grade`, {
        method: 'PUT',
        body: JSON.stringify({
          answerId,
          evaluatedPoints: Number(gradeScore),
          feedback: gradeFeedback,
        }),
      });
      alert('Answer evaluation saved');
      // Reload attempt details
      selectStudentAttempt(selectedAttempt._id);
    } catch (err) {
      alert(err.message);
    }
  };

  const finalizeStudentGrading = async () => {
    if (!window.confirm('Finalize grading for this student? This triggers score calculation.')) return;
    try {
      await apiRequest(`/attempts/${selectedAttempt._id}/finalize`, { method: 'POST' });
      alert('Student exam attempt fully graded!');
      setSelectedAttempt(null);
      // Reload exam attempts
      openGradingView(activeExamForGrading);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="brand">
          <BookOpen size={26} color="#10b981" />
          <span>ExamBihar Examiner</span>
        </div>

        <div className="sidebar-nav">
          <div className={`nav-link ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>
            <HelpCircle size={18} />
            <span>Question Bank</span>
          </div>

          <div className={`nav-link ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => { setActiveTab('exams'); setActiveExamForGrading(null); }}>
            <Calendar size={18} />
            <span>Exams Scheduler</span>
          </div>
        </div>

        <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid var(--border-color)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Instructor: <strong style={{ color: 'white' }}>{user?.name}</strong>
        </div>

        <div className="logout-btn" onClick={logoutUser}>
          <span>Sign Out</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Messages */}
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

        {/* QUESTION BANK TAB */}
        {activeTab === 'questions' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem' }}>Question Bank Repository</h2>
                <p style={{ color: 'var(--text-muted)' }}>Draft, view, and organize exam questions</p>
              </div>
              <button className="btn btn-primary" onClick={() => { setShowQForm(!showQForm); setEditingQuestion(null); }}>
                {showQForm ? 'Close Editor' : 'Add New Question'}
              </button>
            </div>

            {showQForm && (
              <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>{editingQuestion ? 'Edit Question' : 'Create New Question'}</h3>
                <form onSubmit={handleSaveQuestion}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input type="text" className="form-input" placeholder="e.g. Operating Systems" value={qSubject} onChange={e => setQSubject(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Topic</label>
                      <input type="text" className="form-input" placeholder="e.g. Demand Paging" value={qTopic} onChange={e => setQTopic(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Question Type</label>
                      <select className="form-input" style={{ background: 'var(--bg-secondary)', color: 'white' }} value={qType} onChange={e => setQType(e.target.value)}>
                        <option value="MCQ">Multiple Choice (MCQ)</option>
                        <option value="Descriptive">Descriptive/Short Answer</option>
                        <option value="Coding">Coding Problem</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Question text (Supports Markdown)</label>
                    <textarea className="form-input" rows="4" placeholder="Write your question details here..." value={qText} onChange={e => setQText(e.target.value)} required></textarea>
                  </div>

                  {/* MCQ Options Block */}
                  {qType === 'MCQ' && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.25rem', background: 'rgba(0,0,0,0.1)' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>MCQ Options</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                        {qOptions.map((opt, i) => (
                          <div key={i} className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Option {i + 1}</label>
                            <input
                              type="text"
                              className="form-input"
                              placeholder={`Option text ${i + 1}`}
                              value={opt}
                              onChange={(e) => {
                                const newOpts = [...qOptions];
                                newOpts[i] = e.target.value;
                                setQOptions(newOpts);
                              }}
                              required={qType === 'MCQ'}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Correct Answer Key</label>
                        <select className="form-input" style={{ background: 'var(--bg-secondary)', color: 'white' }} value={qCorrect} onChange={e => setQCorrect(Number(e.target.value))}>
                          {qOptions.map((_, i) => (
                            <option key={i} value={i}>Option {i + 1}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Coding Block */}
                  {qType === 'Coding' && (
                    <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.25rem', background: 'rgba(0,0,0,0.1)' }}>
                      <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Coding Configuration</h4>
                      <div className="form-group">
                        <label className="form-label">Starter Template Code</label>
                        <textarea className="form-input code-editor-area" rows="5" placeholder="function codeTemplate() { ... }" value={codingTemplate} onChange={e => setCodingTemplate(e.target.value)}></textarea>
                      </div>
                      <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Test Cases (JSON array of input/output)</label>
                        <textarea className="form-input code-editor-area" rows="4" value={testCasesText} onChange={e => setTestCasesText(e.target.value)}></textarea>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Points/Marks</label>
                      <input type="number" className="form-input" min="1" value={qPoints} onChange={e => setQPoints(e.target.value)} />
                    </div>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label">Difficulty</label>
                      <select className="form-input" style={{ background: 'var(--bg-secondary)', color: 'white' }} value={qDifficulty} onChange={e => setQDifficulty(e.target.value)}>
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      <Save size={16} /> Save Question
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => { setShowQForm(false); setEditingQuestion(null); }}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Questions List */}
            <div className="glass-panel">
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Question Snippet</th>
                      <th>Subject</th>
                      <th>Type</th>
                      <th>Difficulty</th>
                      <th>Marks</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {questions.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No questions created. Click "Add New Question" above to start seeding the bank.</td>
                      </tr>
                    ) : (
                      questions.map((q) => (
                        <tr key={q._id}>
                          <td style={{ fontWeight: '500', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.text}</td>
                          <td>{q.subject}</td>
                          <td>
                            <span className={`badge ${q.type === 'MCQ' ? 'badge-primary' : q.type === 'Coding' ? 'badge-warning' : 'badge-success'}`}>{q.type}</span>
                          </td>
                          <td>{q.difficulty}</td>
                          <td>{q.points}</td>
                          <td style={{ textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem' }} onClick={() => handleEditQuestionClick(q)}>
                              <Edit2 size={14} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.4rem', color: '#ef4444', borderColor: 'rgba(239,68,68,0.2)' }} onClick={() => handleDeleteQuestion(q._id)}>
                              <Trash2 size={14} />
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
        )}

        {/* EXAMS SCHEDULER TAB */}
        {activeTab === 'exams' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <h2 style={{ fontSize: '1.75rem' }}>Exam Schedules & Controls</h2>
                <p style={{ color: 'var(--text-muted)' }}>Build, edit, and review academic online examinations</p>
              </div>
              <button className="btn btn-primary" onClick={() => setShowEForm(!showEForm)}>
                {showEForm ? 'Close Builder' : 'Create Exam Schedule'}
              </button>
            </div>

            {showEForm && (
              <div className="glass-panel" style={{ marginBottom: '2rem' }}>
                <h3 style={{ marginBottom: '1.5rem' }}>Create Exam Schedule</h3>
                <form onSubmit={handleCreateExam}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Exam Title</label>
                      <input type="text" className="form-input" placeholder="e.g. OS End-Sem June 2026" value={eTitle} onChange={e => setETitle(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subject</label>
                      <input type="text" className="form-input" placeholder="e.g. Operating Systems" value={eSubject} onChange={e => setESubject(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Duration (Minutes)</label>
                      <input type="number" className="form-input" min="5" value={eDuration} onChange={e => setEDuration(e.target.value)} required />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Instructions / Description</label>
                    <textarea className="form-input" rows="2" placeholder="Rules, syllabus, proctoring warnings..." value={eDescription} onChange={e => setEDescription(e.target.value)}></textarea>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Active Start Time</label>
                      <input type="datetime-local" className="form-input" value={eStart} onChange={e => setEStart(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Active End Time</label>
                      <input type="datetime-local" className="form-input" value={eEnd} onChange={e => setEEnd(e.target.value)} required />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label className="form-label">Target Semester</label>
                      <select className="form-input" style={{ background: 'var(--bg-secondary)', color: 'white' }} value={eSemester} onChange={e => setESemester(Number(e.target.value))}>
                        {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Target Branches (Comma separated)</label>
                      <input type="text" className="form-input" placeholder="e.g. CSE, IT" value={eBranches.join(', ')} onChange={e => setEBranches(e.target.value.split(',').map(b => b.trim().toUpperCase()))} />
                    </div>
                  </div>

                  {/* Proctoring Settings */}
                  <div style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.1)' }}>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>Anti-Cheat Proctoring Settings</h4>
                    <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={eWebcam} onChange={e => setEWebcam(e.target.checked)} />
                        <span>Webcam Proctor Snapshots</span>
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={eFullscreen} onChange={e => setEFullscreen(e.target.checked)} />
                        <span>Strict Fullscreen Lock</span>
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>Max Tab Switches Allowed:</span>
                        <input type="number" className="form-input" style={{ width: '80px', padding: '0.3rem' }} min="0" value={eTabLimit} onChange={e => setETabLimit(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  {/* Question Checklist */}
                  <div className="form-group">
                    <label className="form-label">Select Questions to Include ({selectedQIds.length} chosen)</label>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1rem', background: 'rgba(0,0,0,0.2)' }}>
                      {questions.length === 0 ? (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No questions in bank. Add questions first.</p>
                      ) : (
                        questions.map((q) => (
                          <label key={q._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', padding: '0.5rem 0', cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                            <input
                              type="checkbox"
                              checked={selectedQIds.includes(q._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedQIds(prev => [...prev, q._id]);
                                } else {
                                  setSelectedQIds(prev => prev.filter(id => id !== q._id));
                                }
                              }}
                            />
                            <div>
                              <span className="badge badge-primary" style={{ marginRight: '0.5rem' }}>{q.type}</span>
                              <span style={{ fontSize: '0.9rem' }}>{q.text} ({q.points} Marks)</span>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      Schedule Exam
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setShowEForm(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Exams List */}
            <div className="glass-panel">
              <div className="table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Subject</th>
                      <th>Targets</th>
                      <th>Duration</th>
                      <th>Proctor Rules</th>
                      <th style={{ textAlign: 'center' }}>Monitor & Grading</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No exams scheduled. Click "Create Exam Schedule" to build one.</td>
                      </tr>
                    ) : (
                      exams.map((ex) => (
                        <tr key={ex._id}>
                          <td style={{ fontWeight: '500' }}>{ex.title}</td>
                          <td>{ex.subject}</td>
                          <td>
                            <span className="badge badge-success">Sem {ex.semester}</span>
                            <span className="badge badge-primary" style={{ marginLeft: '0.25rem' }}>
                              {ex.branches.join(', ') || 'All Branches'}
                            </span>
                          </td>
                          <td>{ex.duration} mins</td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                              {ex.proctoringSettings.webcamSnapshots && <span className="badge badge-warning">Camera</span>}
                              {ex.proctoringSettings.fullscreenLock && <span className="badge badge-danger">Fullscreen</span>}
                              {ex.proctoringSettings.tabSwitchLimit > 0 && <span className="badge badge-primary">Tabs ({ex.proctoringSettings.tabSwitchLimit})</span>}
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                              {/* Link to Live Proctor dashboard */}
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => window.open(`/proctor/${ex._id}`, '_blank')}
                              >
                                <Users size={14} style={{ marginRight: '4px' }} /> Live Proctor
                              </button>

                              <button
                                className="btn btn-secondary"
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                onClick={() => openGradingView(ex)}
                              >
                                <CheckCircle size={14} style={{ marginRight: '4px' }} /> Evaluation ({attempts.filter(a => a.examId === ex._id).length})
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* EVALUATION / GRADING VIEW SUB-PANEL */}
        {activeTab === 'grading' && activeExamForGrading && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <div>
                <button className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', marginBottom: '0.5rem' }} onClick={() => setActiveTab('exams')}>
                  &larr; Back to Exams list
                </button>
                <h2 style={{ fontSize: '1.75rem' }}>Grading: {activeExamForGrading.title}</h2>
                <p style={{ color: 'var(--text-muted)' }}>Assess descriptive submissions and compile grading marksheet</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
              {/* Attempt list */}
              <div className="glass-panel" style={{ height: 'fit-content' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Student Submissions</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {attempts.length === 0 ? (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No student attempts found for this exam.</p>
                  ) : (
                    attempts.map((att) => (
                      <div
                        key={att._id}
                        className={`glass-panel glass-panel-hover ${selectedAttempt?._id === att._id ? 'active' : ''}`}
                        style={{
                          padding: '1rem',
                          cursor: 'pointer',
                          borderLeftWidth: '4px',
                          borderLeftColor: att.isGraded ? 'var(--success)' : att.status === 'Disqualified' ? 'var(--danger)' : 'var(--warning)',
                          background: selectedAttempt?._id === att._id ? 'rgba(16, 185, 129, 0.08)' : 'var(--glass-bg)',
                        }}
                        onClick={() => selectStudentAttempt(att._id)}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <h4 style={{ fontSize: '0.95rem' }}>{att.studentId?.name || 'Unknown Student'}</h4>
                          <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {att.isGraded ? `${att.totalScore} Marks` : 'UNGRADED'}
                          </span>
                        </div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.25rem 0' }}>
                          Reg: {att.studentId?.regNumber}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <span className={`badge ${att.status === 'Submitted' ? 'badge-success' : att.status === 'Disqualified' ? 'badge-danger' : 'badge-primary'}`}>
                            {att.status}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)' }}>
                            Switches: {att.tabSwitches} | Escs: {att.fullscreenViolations}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Attempt Detail & Grading Panel */}
              <div className="glass-panel">
                {selectedAttempt ? (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                      <div>
                        <h3>Grading Sheet: {selectedAttempt.studentId?.name}</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          Reg No: {selectedAttempt.studentId?.regNumber} | Branch: {selectedAttempt.studentId?.branch}
                        </p>
                      </div>
                      <button className="btn btn-success" onClick={finalizeStudentGrading}>
                        Finalize & Release Result
                      </button>
                    </div>

                    {/* Proctor Alerts review */}
                    {(selectedAttempt.tabSwitches > 0 || selectedAttempt.fullscreenViolations > 0) && (
                      <div style={{ border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.06)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 1rem', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
                        <strong style={{ color: '#f87171' }}>Proctor Warnings Tripped:</strong> The student switched browser tabs <strong>{selectedAttempt.tabSwitches} times</strong> and exited full-screen <strong>{selectedAttempt.fullscreenViolations} times</strong>.
                        {selectedAttempt.webcamSnapshots?.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                            {selectedAttempt.webcamSnapshots.map((snap, sIdx) => (
                              <div key={sIdx} style={{ position: 'relative', width: '80px', height: '60px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                <img src={snap.image} alt={`Snapshot ${sIdx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <span style={{ position: 'absolute', bottom: 0, right: 0, background: 'rgba(0,0,0,0.6)', color: 'white', fontSize: '8px', padding: '2px' }}>
                                  {new Date(snap.timestamp).toLocaleTimeString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Answers checklist */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      {selectedAttempt.answers.map((ans, idx) => (
                        <div key={ans._id} style={{ border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '1.25rem', background: 'rgba(255,255,255,0.01)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: '600' }}>Question {idx + 1} ({ans.question?.type})</span>
                            <span className="badge badge-primary">{ans.question?.points} Marks Max</span>
                          </div>
                          
                          <p style={{ marginBottom: '1rem', whiteSpace: 'pre-wrap' }}>{ans.question?.text}</p>

                          {/* Student Answer */}
                          <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '4px', borderLeft: '3px solid var(--primary)', marginBottom: '1rem' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Student Response:</p>
                            {ans.question?.type === 'MCQ' ? (
                              <div>
                                <p>Selected Option: <strong>Option {ans.selectedOption !== undefined ? ans.selectedOption + 1 : 'None'}</strong></p>
                                <p style={{ fontSize: '0.9rem', color: ans.evaluatedPoints > 0 ? '#34d399' : '#f87171', marginTop: '0.25rem' }}>
                                  {ans.evaluatedPoints > 0 ? '✓ Correct Option Selected' : '✗ Incorrect Option Selected'}
                                </p>
                              </div>
                            ) : ans.question?.type === 'Coding' ? (
                              <textarea
                                className="form-input code-editor-area"
                                rows="5"
                                value={ans.codeAnswer || '// No answer submitted'}
                                readOnly
                              ></textarea>
                            ) : (
                              <p style={{ whiteSpace: 'pre-wrap' }}>{ans.textAnswer || 'No answer submitted.'}</p>
                            )}
                          </div>

                          {/* Grading Slider & Feedback (For descriptive/coding) */}
                          {ans.question?.type !== 'MCQ' && (
                            <form onSubmit={(e) => handleGradeSubmit(e, ans._id)} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                <div>
                                  <label className="form-label">Score (Max {ans.question?.points})</label>
                                  <input
                                    type="number"
                                    className="form-input"
                                    min="0"
                                    max={ans.question?.points}
                                    defaultValue={ans.evaluatedPoints}
                                    onChange={e => setGradeScore(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <label className="form-label">Assigned Feedback</label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    placeholder="Provide notes/tips..."
                                    defaultValue={ans.feedback}
                                    onChange={e => setGradeFeedback(e.target.value)}
                                  />
                                </div>
                              </div>
                              <button type="submit" className="btn btn-secondary" style={{ width: 'fit-content', padding: '0.4rem 1rem' }}>
                                Save Score for Q{idx + 1}
                              </button>
                            </form>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '4rem 0' }}>
                    <FileText size={48} style={{ marginBottom: '1rem' }} />
                    <p>Select a student from the sidebar roster to evaluate their exam sheet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyDashboard;
