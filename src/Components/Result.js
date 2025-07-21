// Enhanced Result.js with retake option and better state management
import React, { useState, useEffect } from 'react';
import './Result.css';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Assets/Logo.png';
import { motion } from 'framer-motion';
import { auth } from './firebase';
import { useLocation } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { getIdToken } from 'firebase/auth';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

function Result() {
    const location = useLocation();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [canRetake, setCanRetake] = useState(false);
    const [timeUntilRetake, setTimeUntilRetake] = useState(null);
    const [showRetakeConfirm, setShowRetakeConfirm] = useState(false);
    
    // Get data from location state or fetch from backend
    const [resultData, setResultData] = useState(location.state || {});
    
    const { depression, anxiety, stress, depressionLabel, anxietyLabel, stressLabel, submittedAt, fromPersisted } = resultData;

    const API_BASE_URL = 'https://moodlybackend-production.up.railway.app'; 

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                if (!location.state) {
                    // If no state passed, fetch from backend
                    fetchResultData(currentUser.uid);
                } else {
                    checkRetakeAvailability(currentUser.uid);
                }
            } else {
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate, location.state]);

   const fetchResultData = async (userId) => {
        try {
            const token = await getIdToken(auth.currentUser);
            console.log('🔍 Fetching result for user:', userId);
            
            const response = await fetch(`${API_BASE_URL}/api/questionnaire/result/${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            console.log('📡 Response status:', response.status);
            const data = await response.json();
            console.log('📊 Response data:', data);
            
            if (data.success && data.result) {
                console.log('✅ Result found:', data.result);
                setResultData(data.result);
                checkRetakeAvailability(userId, data.result.submittedAt);
            } else {
                console.log('❌ No result found, data.success:', data.success, 'data.result:', data.result);
                // DON'T navigate immediately - let the component render the "No Results" message
                // navigate('/question');
            }
        } catch (error) {
            console.error('💥 Error fetching result:', error);
            // DON'T navigate on error either
            // navigate('/question');
        } finally {
            setLoading(false);
        }
};

    const checkRetakeAvailability = async (userId, submissionTime = submittedAt) => {
    try {
        const token = await getIdToken(auth.currentUser);
        const response = await fetch(`${API_BASE_URL}/api/questionnaire-status/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        setCanRetake(data.canAttempt);
        setTimeUntilRetake(data.timeRemaining);
        setLoading(false);
    } catch (error) {
        console.error('Error checking retake availability:', error);
        setLoading(false);
    }
};

const handleLogout = () => {
        confirmAlert({
            customUI: ({ onClose }) => {
                return (
                    <div className="custom-confirm-box">
                        <h2>Confirm Logout</h2>
                        <p>Are you sure you want to logout?</p>
                        <div className="custom-confirm-buttons">
                            <button
                                className="btn-confirm"
                                onClick={async () => {
                                    onClose();
                                    await auth.signOut();
                                    navigate('/');
                                }}
                            >
                                Yes, Logout
                            </button>
                            <button className="btn-cancel" onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </div>
                );
            }
        });
    };

    const handleRetakeRequest = () => {
        setShowRetakeConfirm(true);
    };

    const confirmRetake = async () => {
    try {
        const token = await getIdToken(auth.currentUser);
        const response = await fetch(`${API_BASE_URL}/api/questionnaire/clear/${user.uid}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });

        if (response.ok) {
            navigate('/question');
        } else {
            alert('Error clearing previous result. Please try again.');
        }
    } catch (error) {
        console.error('Error clearing result:', error);
        alert('Network error. Please try again.');
    }
    setShowRetakeConfirm(false);
};

    const cancelRetake = () => {
        setShowRetakeConfirm(false);
    };

    const formatTimeUntilRetake = (seconds) => {
        if (!seconds) return '';
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    const getResultDate = () => {
        if (submittedAt) {
            return new Date(submittedAt).toLocaleDateString();
        }
        return 'Today';
    };

    const showChatbot = depressionLabel !== "Severe" && 
                       depressionLabel !== "Moderate" && 
                       depressionLabel !== "Extremely Severe";

    if (loading) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!resultData || !resultData.depressionLabel || !resultData.anxietyLabel || !resultData.stressLabel) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <h2>No Results Found</h2>
                    <p>Please take the questionnaire first.</p>
                    <Link to="/question" className="btn btn-primary">Take Questionnaire</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid d-flex flex-column min-vh-100">
            {/* Navbar */}
            <nav className="d-flex justify-content-between align-items-center px-5 py-2"
                style={{ height: 'clamp(72px, 10vh, 100px)', margin: 'clamp(1rem, 2vw, 2rem)' }}>
                <div className="d-flex align-items-center">
                    <img src={Logo} alt="Logo"
                        style={{ height: 'clamp(160px, 7vh, 80px)', objectFit: 'contain' }}
                        className="me-3" />
                </div>
                <div className="d-flex">
                    <button onClick={handleLogout} className="btn btn-login"
                        style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="container px-5"
                style={{
                    paddingTop: '0px',
                    paddingBottom: '40px',
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                }}>
                {/* Result Section */}
                <motion.div 
                    className="result-section d-flex flex-column flex-md-row justify-content-center align-items-center w-100 gap-0 my-5 px-4"
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 1 }}
                >
                    {/* Left Box - Score */}
                    <div className="result-box p-4 rounded-2 text-white text-center flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="mb-0">Your Result</h5>
                            <small className="text-light">
                                {fromPersisted ? 'Previous Result' : getResultDate()}
                            </small>
                        </div>
                        <div className="result-circle d-flex justify-content-center align-items-center mx-auto mb-3">
                            <h1>{depression + anxiety + stress}</h1>
                        </div>
                        <h4>{depressionLabel}, {anxietyLabel}, {stressLabel}</h4>
                        <p>Depression: {depression} ({depressionLabel})</p>
                        <p>Anxiety: {anxiety} ({anxietyLabel})</p>
                        <p>Stress: {stress} ({stressLabel})</p>
                        
                        {/* Retake Button */}
                        <div className="mt-4">
                            {canRetake ? (
                                <button 
                                    onClick={handleRetakeRequest}
                                    className="btn btn-outline-light btn-sm"
                                >
                                    Retake Questionnaire
                                </button>
                            ) : (
                                <div className="text-center">
                                    <small className="text-light">
                                        Next retake available in: {formatTimeUntilRetake(timeUntilRetake)}
                                    </small>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Box - Summary */}
                    <div className="summary-box p-4 rounded-2 bg-white text-dark flex-grow-1">
                        <h5 className="mb-4">Here You Go</h5>
                        <div className="summary-item d-flex justify-content-between align-items-center p-3 rounded mb-4 bg-light">
                            <span>⚡ AI Chatbot</span>
                            <span>
                                {showChatbot ? 
                                    <Link to="/chatbot" className="btn btn-sm btn-primary"  style={{ color: 'black' ,fontSize: '20px'}}>Start</Link> : 
                                    <span style={{ opacity: 0.5 }}>
                                        <small>Not recommended based on your results</small>
                                    </span>
                                }
                            </span>
                        </div>

                        <div className="summary-item d-flex justify-content-between align-items-center p-3 rounded mb-4 bg-light">
                            <span>📅 Book Appointment</span>
                            <span><Link to="/appointment" className="btn btn-sm btn-primary"  style={{ color: 'black', fontSize: '20px' }}>Now</Link></span>
                        </div>

                        <div className="summary-item d-flex justify-content-between align-items-center p-3 rounded mb-4 bg-light">
                            <span>📞 Helplines</span>
                            <span><Link to="/helpline" className="btn btn-sm btn-primary"  style={{ color: 'black' , fontSize: '20px'}}>View</Link></span>
                        </div>

                        {!showChatbot && (
                            <div className="alert alert-warning mt-4">
                                <small>
                                    <strong>Important:</strong> Based on your results, we recommend 
                                    speaking with a mental health professional. Please consider 
                                    booking an appointment or contacting a helpline.
                                </small>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Retake Confirmation Modal */}
            {showRetakeConfirm && (
                <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                    <div className="modal-dialog">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Retake Questionnaire</h5>
                            </div>
                            <div className="modal-body">
                                <p>Are you sure you want to retake the questionnaire?</p>
                                <p><strong>Note:</strong> This will replace your current results and you won't be able to retake again for 24 hours.</p>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={cancelRetake}>
                                    Cancel
                                </button>
                                <button type="button" className="btn btn-primary" onClick={confirmRetake}>
                                    Yes, Retake
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Result;