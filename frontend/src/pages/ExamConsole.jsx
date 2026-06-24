import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertTriangle, Play, HelpCircle, ChevronLeft, ChevronRight, CheckCircle, Video, Eye, Award } from 'lucide-react';

const ExamConsole = () => {
  const { id: examId } = useParams();
  const { apiRequest } = useAuth();
  const navigate = useNavigate();

  // Attempt Data States
  const [attemptId, setAttemptId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [responses, setResponses] = useState({}); // { questionId: { selectedOption, textAnswer, codeAnswer } }
  const [flagged, setFlagged] = useState({}); // { questionId: boolean }

  // Timer
  const [timeLeft, setTimeLeft] = useState(null);

  // Proctor/Anti-cheat settings
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [tabLimit, setTabLimit] = useState(3);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState(null);
  
  // Code execution results
  const [codeOutputs, setCodeOutputs] = useState(null);

  // References
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const webcamIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);

  // Initialize Exam
  useEffect(() => {
    const launchExam = async () => {
      try {
        const data = await apiRequest('/attempts/start', {
          method: 'POST',
          body: JSON.stringify({ examId }),
        });

        setAttemptId(data.attemptId);
        setQuestions(data.questions);
        setTimeLeft(data.timeRemainingSeconds);
        setTabWarnings(data.tabSwitches);

        // Prepopulate previous responses if resuming
        const loadedResponses = {};
        if (data.answers && data.answers.length > 0) {
          data.answers.forEach((ans) => {
            loadedResponses[ans.questionId] = {
              selectedOption: ans.selectedOption,
              textAnswer: ans.textAnswer,
              codeAnswer: ans.codeAnswer,
            };
          });
        }
        setResponses(loadedResponses);

        // Attempt to request fullscreen
        triggerFullscreen();
        setupProctorListeners();
        startWebcam();
      } catch (err) {
        alert(err.message || 'Failed to start exam');
        navigate('/dashboard');
      }
    };

    launchExam();

    return () => {
      // Cleanup proctor loops
      cleanupListeners();
    };
  }, [examId]);

  // Countdown timer loop
  useEffect(() => {
    if (timeLeft === null) return;
    if (timeLeft <= 0) {
      handleAutoSubmit();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft]);

  // Setup periodic sync & webcam capture intervals
  useEffect(() => {
    if (!attemptId) return;

    // Periodically save answers to server (every 15 seconds)
    syncIntervalRef.current = setInterval(() => {
      syncResponses();
    }, 15000);

    // Periodically take webcam snapshots (every 25 seconds)
    webcamIntervalRef.current = setInterval(() => {
      captureWebcamFrame();
    }, 25000);

    return () => {
      clearInterval(syncIntervalRef.current);
      clearInterval(webcamIntervalRef.current);
    };
  }, [attemptId, responses]);

  // Request user full-screen mode
  const triggerFullscreen = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().then(() => setFullscreenActive(true)).catch(() => setFullscreenActive(false));
    }
  };

  // Setup security listeners
  const setupProctorListeners = () => {
    // Listen for visibility changes (tab switching)
    document.addEventListener('visibilitychange', handleTabSwitch);
    window.addEventListener('blur', handleTabSwitch);
    
    // Listen for fullscreen change
    document.addEventListener('fullscreenchange', handleFullscreenChange);
  };

  const cleanupListeners = () => {
    document.removeEventListener('visibilitychange', handleTabSwitch);
    window.removeEventListener('blur', handleTabSwitch);
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    
    if (webcamIntervalRef.current) clearInterval(webcamIntervalRef.current);
    if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);

    // Stop camera stream
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const handleFullscreenChange = () => {
    if (!document.fullscreenElement) {
      setFullscreenActive(false);
      logProctorWarning('fullscreen');
    } else {
      setFullscreenActive(true);
    }
  };

  const handleTabSwitch = () => {
    if (document.hidden || !document.hasFocus()) {
      logProctorWarning('tabSwitch');
    }
  };

  const logProctorWarning = async (type) => {
    if (!attemptId) return;
    try {
      const res = await apiRequest(`/attempts/${attemptId}/warning`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      });

      if (res.disqualified) {
        cleanupListeners();
        alert('EXAM TERMINATED: You have exceeded the allowable tab-switch threshold. Your exam has been locked and submitted.');
        navigate('/dashboard');
        return;
      }

      setTabWarnings(res.tabSwitches);
      
      if (type === 'tabSwitch') {
        alert(`WARNING: Switching tabs is prohibited. Warning count: ${res.tabSwitches}/${tabLimit}. Exceeding this will automatically submit your exam.`);
      }
    } catch (err) {
      console.error('Error logging warning:', err);
    }
  };

  // Webcam stream activation
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraPermission(true);
      }
    } catch (err) {
      console.error('Webcam permission denied:', err);
      setCameraPermission(false);
    }
  };

  const captureWebcamFrame = () => {
    if (!cameraActive || !canvasRef.current || !videoRef.current) return;
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = 320;
      canvas.height = 240;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, 320, 240);
      
      const base64Image = canvas.toDataURL('image/webp');
      
      // Upload frame
      apiRequest(`/attempts/${attemptId}/snapshot`, {
        method: 'POST',
        body: JSON.stringify({ image: base64Image }),
      });
    } catch (err) {
      console.error('Failed to capture snapshot frame:', err);
    }
  };

  // Sync current responses to MongoDB
  const syncResponses = async () => {
    if (!attemptId) return;
    
    // Map responses state dictionary to backend array format
    const answersArray = Object.keys(responses).map((qId) => ({
      questionId: qId,
      selectedOption: responses[qId].selectedOption,
      textAnswer: responses[qId].textAnswer,
      codeAnswer: responses[qId].codeAnswer,
    }));

    try {
      // Local Backup
      localStorage.setItem(`attempt_${attemptId}_answers`, JSON.stringify(responses));
      
      await apiRequest(`/attempts/${attemptId}/save`, {
        method: 'POST',
        body: JSON.stringify({ answers: answersArray }),
      });
    } catch (err) {
      console.warn('Network sync offline, progress saved in localStorage backup.');
    }
  };

  const updateResponse = (questionId, field, value) => {
    setResponses((prev) => {
      const updated = {
        ...prev,
        [questionId]: {
          ...(prev[questionId] || { selectedOption: undefined, textAnswer: '', codeAnswer: '' }),
          [field]: value,
        },
      };
      return updated;
    });
    setCodeOutputs(null);
  };

  // Live code runner for student sandbox
  const handleRunCode = (question) => {
    const code = responses[question._id]?.codeAnswer || '';
    if (!code.trim()) {
      alert('Code editor is empty.');
      return;
    }

    try {
      // Extract function name, default to standard function
      const match = code.match(/function\s+(\w+)/);
      const fnName = match ? match[1] : null;

      if (!fnName) {
        setCodeOutputs([{ error: 'Syntax Error: Could not find function declaration.' }]);
        return;
      }

      // Execute code client side safely
      const results = question.codingTestCases.filter(tc => tc.isPublic).map((tc) => {
        try {
          // Build evaluator
          const runner = new Function(`
            ${code}
            try {
              return ${fnName}(${tc.input});
            } catch(e) {
              return "Error: " + e.message;
            }
          `);
          const runRes = runner();
          return {
            input: tc.input,
            expected: tc.output,
            actual: String(runRes),
            passed: String(runRes) === tc.output,
          };
        } catch (e) {
          return { input: tc.input, expected: tc.output, actual: e.message, passed: false };
        }
      });
      setCodeOutputs(results);
    } catch (err) {
      setCodeOutputs([{ error: err.message }]);
    }
  };

  // Submit operations
  const handleSubmitClick = async () => {
    if (!window.confirm('Are you sure you want to finish the exam? This will submit your answers for evaluation.')) return;
    submitExam();
  };

  const handleAutoSubmit = () => {
    alert('Time limit expired! Your answers are being auto-submitted.');
    submitExam();
  };

  const submitExam = async () => {
    cleanupListeners();
    try {
      // Sync last updates
      const answersArray = Object.keys(responses).map((qId) => ({
        questionId: qId,
        selectedOption: responses[qId].selectedOption,
        textAnswer: responses[qId].textAnswer,
        codeAnswer: responses[qId].codeAnswer,
      }));

      await apiRequest(`/attempts/${attemptId}/save`, {
        method: 'POST',
        body: JSON.stringify({ answers: answersArray }),
      });

      await apiRequest(`/attempts/${attemptId}/submit`, { method: 'POST' });
      
      // Clean local backup
      localStorage.removeItem(`attempt_${attemptId}_answers`);
      
      alert('Exam submitted successfully! Redirecting to student lobby.');
      navigate('/dashboard');
    } catch (err) {
      alert(err.message || 'Error submitting exam. Please check connection and try again.');
    }
  };

  // Helpers
  const formatTime = (secs) => {
    if (secs === null) return '--:--';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (questions.length === 0) {
    return <div style={{ textAlign: 'center', padding: '6rem 0' }}>Launching secure exam lobby...</div>;
  }

  const currentQ = questions[currentIdx];
  const currentResp = responses[currentQ._id] || { selectedOption: undefined, textAnswer: '', codeAnswer: '' };

  return (
    <div style={{ background: '#090d16', minHeight: '100vh' }}>
      {/* Exam Header */}
      <div className="exam-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Shield size={22} color="#6366f1" />
          <h2 style={{ fontSize: '1.2rem' }}>Exam Portal Console</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          {/* Security alerts */}
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem' }}>
            <span style={{ color: tabWarnings > 0 ? '#f59e0b' : 'var(--text-muted)' }}>
              Tab warnings: {tabWarnings}/{tabLimit}
            </span>
            <span style={{ color: fullscreenActive ? '#10b981' : '#ef4444' }}>
              {fullscreenActive ? 'Fullscreen: ON' : 'Fullscreen: LOCKED OUT'}
            </span>
          </div>

          {/* Synced Timer */}
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem 1rem', borderRadius: '4px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem' }}>
            {formatTime(timeLeft)}
          </div>

          <button className="btn btn-success" onClick={handleSubmitClick}>
            Submit Exam
          </button>
        </div>
      </div>

      {/* Screen Lockout Modal if Fullscreen exited */}
      {!fullscreenActive && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(9, 13, 22, 0.96)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
          <AlertTriangle size={64} color="#f59e0b" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>FULLSCREEN DETECTED: EXITED</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '500px', marginBottom: '2rem' }}>
            To protect testing integrity, you are locked out. You must activate Fullscreen to continue your exam. Unapproved actions are proctored.
          </p>
          <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} onClick={triggerFullscreen}>
            Restore Fullscreen Lock
          </button>
        </div>
      )}

      {/* Main console grids */}
      <div className="exam-console-container">
        {/* Left Side: Question Block */}
        <div>
          <div className="question-card fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Question {currentIdx + 1} of {questions.length}
              </span>
              <span className="badge badge-primary">
                {currentQ.points} Marks
              </span>
            </div>

            <h3 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
              {currentQ.text}
            </h3>

            {/* MCQ Answers */}
            {currentQ.type === 'MCQ' && (
              <div className="option-container">
                {currentQ.options.map((opt, oIdx) => (
                  <div
                    key={oIdx}
                    className={`option-card ${currentResp.selectedOption === oIdx ? 'selected' : ''}`}
                    onClick={() => updateResponse(currentQ._id, 'selectedOption', oIdx)}
                  >
                    <input
                      type="radio"
                      className="option-radio"
                      checked={currentResp.selectedOption === oIdx}
                      onChange={() => {}}
                    />
                    <span>{opt}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Descriptive Answer */}
            {currentQ.type === 'Descriptive' && (
              <div className="form-group" style={{ marginTop: '1.5rem' }}>
                <label className="form-label">Write your answer below (Descriptive/Text):</label>
                <textarea
                  className="form-input"
                  rows="10"
                  placeholder="Explain your solution in detail..."
                  value={currentResp.textAnswer || ''}
                  onChange={(e) => updateResponse(currentQ._id, 'textAnswer', e.target.value)}
                  style={{ fontSize: '1rem' }}
                ></textarea>
              </div>
            )}

            {/* Coding Problem */}
            {currentQ.type === 'Coding' && (
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label">Coding Sandbox (JavaScript):</label>
                  <button className="btn btn-secondary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.8rem' }} onClick={() => handleRunCode(currentQ)}>
                    <Play size={12} style={{ marginRight: '4px' }} /> Run Public Test Cases
                  </button>
                </div>
                
                <textarea
                  className="form-input code-editor-area"
                  rows="12"
                  value={currentResp.codeAnswer || currentQ.codingTemplate || ''}
                  onChange={(e) => updateResponse(currentQ._id, 'codeAnswer', e.target.value)}
                ></textarea>

                {/* Local test outputs */}
                {codeOutputs && (
                  <div style={{ marginTop: '1rem', background: '#121722', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '1rem' }}>
                    <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCircle size={14} color="#10b981" /> Test Cases Evaluation Output
                    </h4>
                    {codeOutputs[0]?.error ? (
                      <p style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {codeOutputs[0].error}
                      </p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                        {codeOutputs.map((tc, tcIdx) => (
                          <div key={tcIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(0,0,0,0.2)', borderRadius: '4px', borderLeft: tc.passed ? '3px solid #10b981' : '3px solid #ef4444' }}>
                            <div>
                              <p>Input: <code>{tc.input}</code></p>
                              <p style={{ color: 'var(--text-muted)' }}>Expected: <code>{tc.expected}</code> | Actual: <code>{tc.actual}</code></p>
                            </div>
                            <span style={{ fontWeight: 'bold', color: tc.passed ? '#34d399' : '#f87171' }}>
                              {tc.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
            >
              <ChevronLeft size={16} /> Previous Question
            </button>

            <button
              className="btn btn-secondary"
              onClick={() => {
                setFlagged((prev) => ({
                  ...prev,
                  [currentQ._id]: !prev[currentQ._id],
                }));
              }}
            >
              {flagged[currentQ._id] ? 'Unflag Review' : 'Flag for Review'}
            </button>

            {currentIdx < questions.length - 1 ? (
              <button
                className="btn btn-secondary"
                onClick={() => setCurrentIdx(currentIdx + 1)}
              >
                Next Question <ChevronRight size={16} />
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleSubmitClick}>
                Submit Exam
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Sidebar Navigation Grid */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Questions Navigation Grid</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
            {questions.map((q, idx) => {
              const resp = responses[q._id];
              const isAnswered = resp && (resp.selectedOption !== undefined || resp.textAnswer || resp.codeAnswer);
              const isFlagged = flagged[q._id];

              let bg = 'rgba(255, 255, 255, 0.05)';
              let border = '1px solid var(--border-color)';
              let text = 'var(--text-main)';

              if (idx === currentIdx) {
                border = '2px solid var(--primary)';
              }

              if (isFlagged) {
                bg = 'rgba(245, 158, 11, 0.2)';
                text = '#fbbf24';
              } else if (isAnswered) {
                bg = 'rgba(16, 185, 129, 0.2)';
                text = '#34d399';
              }

              return (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(idx)}
                  style={{
                    width: '100%',
                    aspectRatio: '1',
                    borderRadius: '4px',
                    background: bg,
                    border: border,
                    color: text,
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', marginBottom: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Proctor Camera Feed</h4>
            
            {cameraPermission === false ? (
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#f87171' }}>
                Camera access required to submit. Please allow permissions.
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', aspectRatio: '4/3', background: '#000', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                ></video>
                <div style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.6)', padding: '2px 6px', borderRadius: '50px', fontSize: '10px' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                  <span>PROCTOR STREAMING</span>
                </div>
              </div>
            )}
          </div>

          {/* Hidden helper elements */}
          <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
        </div>
      </div>
    </div>
  );
};

export default ExamConsole;
