// Enhanced Question.js with persistence and 24-hour limit
import React, { useState, useEffect } from 'react';
import './Question.css';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Assets/Logo.png';
import { motion } from 'framer-motion';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { getIdToken} from 'firebase/auth';

function Question() {
    const [currentPage, setCurrentPage] = useState(0);
    const [responses, setResponses] = useState(new Array(21).fill(null));
    const [loading, setLoading] = useState(true);
    const [canAttempt, setCanAttempt] = useState(true);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [user, setUser] = useState(null);
    const navigate = useNavigate();

    // Your existing questions and categories arrays
    const questions = [
        ["I found it hard to wind down", "I was aware of dryness of my mouth", "I couldn't seem to experience any positive feeling at all", "I experienced breathing difficulty", "I found it difficult to work up the initiative to do things", "I tended to over-react to situations", "I experienced trembling"],
        ["I felt that I was using a lot of nervous energy", "I was worried about situations in which I might panic and make a fool of myself", "I felt that I had nothing to look forward to", "I found myself getting agitated", "I found it difficult to relax", "I felt down-hearted and blue", "I was intolerant of anything that kept me from getting on with what I was doing"],
        ["I felt I was close to panic", "I was unable to become enthusiastic about anything", "I felt I wasn't worth much as a person", "I felt that I was rather touchy", "I was aware of the action of my heart in the absence of physical exertion", "I felt scared without any good reason", "I felt that life was meaningless"]
    ];

    const categories = ['s', 'a', 'd', 'a', 'd', 's', 'a', 's', 'a', 'd', 's', 's', 'd', 's', 'a', 'd', 'd', 's', 'a', 'a', 'd'];

    const severityLevels = {
        depression: [
            { min: 0, max: 9, label: "Normal" },
            { min: 10, max: 13, label: "Mild" },
            { min: 14, max: 20, label: "Moderate" },
            { min: 21, max: 27, label: "Severe" },
            { min: 28, max: Infinity, label: "Extremely Severe" }
        ],
        anxiety: [
            { min: 0, max: 7, label: "Normal" },
            { min: 8, max: 9, label: "Mild" },
            { min: 10, max: 14, label: "Moderate" },
            { min: 15, max: 19, label: "Severe" },
            { min: 20, max: Infinity, label: "Extremely Severe" }
        ],
        stress: [
            { min: 0, max: 14, label: "Normal" },
            { min: 15, max: 18, label: "Mild" },
            { min: 19, max: 25, label: "Moderate" },
            { min: 26, max: 33, label: "Severe" },
            { min: 34, max: Infinity, label: "Extremely Severe" }
        ]
    };

    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL; 

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                checkQuestionnaireStatus(currentUser.uid);
            } else {
                navigate('/');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const checkQuestionnaireStatus = async (userId) => {
    try {
        const token = await getIdToken(auth.currentUser);
        const response = await fetch(`${API_BASE_URL}/api/questionnaire-status/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        
        if (data.hasValidResult) {
            navigate('/result', { 
                state: { 
                    ...data.result,
                    fromPersisted: true 
                } 
            });
            return;
        }
        
        if (!data.canAttempt) {
            setCanAttempt(false);
            setTimeRemaining(data.timeRemaining);
        }
        
        setLoading(false);
    } catch (error) {
        console.error('Error checking questionnaire status:', error);
        setLoading(false);
    }
};

const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
        await auth.signOut();
        navigate('/');
    }
};

    const handleResponseChange = (index, value) => {
        const newResponses = [...responses];
        newResponses[index] = parseInt(value);
        setResponses(newResponses);
    };

    const handleNext = () => {
        if (currentPage < questions.length - 1) {
            setCurrentPage(currentPage + 1);
        }
    };

    const handlePrevious = () => {
        if (currentPage > 0) {
            setCurrentPage(currentPage - 1);
        }
    };

    const calculateScores = () => {
        let depression = 0, anxiety = 0, stress = 0;
        responses.forEach((value, index) => {
            if (categories[index] === 'd') depression += value;
            if (categories[index] === 'a') anxiety += value;
            if (categories[index] === 's') stress += value;
        });

        depression *= 2;
        anxiety *= 2;
        stress *= 2;

        return { depression, anxiety, stress };
    };

    const determineSeverity = (score, type) => {
        const level = severityLevels[type].find(range => score >= range.min && score <= range.max);
        return level ? level.label : "Unknown";
    };

    const handleSubmit = async () => {
    if (responses.includes(null)) {
        alert("Please answer all questions before submitting.");
        return;
    }

    const scores = calculateScores();
    const severityResults = {
        depressionLabel: determineSeverity(scores.depression, "depression"),
        anxietyLabel: determineSeverity(scores.anxiety, "anxiety"),
        stressLabel: determineSeverity(scores.stress, "stress")
    };

    try {
        const token = await getIdToken(auth.currentUser);
        const response = await fetch(`${API_BASE_URL}/api/questionnaire/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: user.uid,
                responses: responses,
                scores: scores,
                severityResults: severityResults
            })
        });

        const result = await response.json();
        
        if (result.success) {
            navigate('/result', { 
                state: { 
                    ...scores, 
                    ...severityResults,
                    submittedAt: new Date().toISOString()
                } 
            });
        } else {
            alert('Error submitting questionnaire. Please try again.');
        }
    } catch (error) {
        console.error('Error submitting questionnaire:', error);
        alert('Network error. Please check your connection and try again.');
    }
};

    const formatTimeRemaining = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    if (loading) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (!canAttempt) {
        return (
            <div className="container-fluid d-flex flex-column min-vh-100">
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
                
                <div className="container d-flex justify-content-center align-items-center flex-grow-1">
                    <div className="text-center">
                        <h2>Questionnaire Not Available</h2>
                        <p>You can take the questionnaire again in {formatTimeRemaining(timeRemaining)}</p>
                        <p>You can only take the questionnaire once every 24 hours.</p>
                        <Link to="/dashboard" className="btn btn-primary mt-3">Go to Dashboard</Link>
                    </div>
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
                <div className="row question-container d-flex align-items-center">
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }} style={{ flex: 1, overflowY: 'auto', maxHeight: '70vh' }}>
                        
                        <div className="OuterLayer">
                            <div className="InnerLayer">
                                <div className="qa-container">
                                    <h1 className="qa-title">Mood Mirror</h1>
                                    <p className="qa-instructions">
                                        Please read each statement and circle a number 0, 1, 2, or 3 which
                                        indicates how much the statement applied to you over the past week.
                                        There are no right or wrong answers. <br />
                                        <strong>Do not spend too much time on any statement.</strong>
                                    </p>
                                    <p className="qa-scale">
                                        The rating scale is as follows: <br />
                                        0 Did not apply to me at all <br />
                                        1 Applied to me to some degree, or some of the time <br />
                                        2 Applied to me to a considerable degree, or a good part of the time <br />
                                        3 Applied to me very much or most of the time
                                    </p>
                                    <form className="qa-form">
                                        {questions[currentPage].map((question, index) => (
                                            <div className="qa-question" key={index}>
                                                <label className="qa-label">Q{index + 1 + currentPage * 7} {question}</label>
                                                <div className="qa-options">
                                                    {[0, 1, 2, 3].map(value => (
                                                        <label key={value} className="qa-option">
                                                            <input
                                                                type="radio"
                                                                name={`question-${index + currentPage * 7}`}
                                                                value={value}
                                                                checked={responses[index + currentPage * 7] === value}
                                                                onChange={(e) => handleResponseChange(index + currentPage * 7, e.target.value)}
                                                                required
                                                            />
                                                            {value}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </form>
                                    <div className="navigation-buttons">
                                        <button onClick={handlePrevious} disabled={currentPage === 0}>Previous</button>
                                        {currentPage < questions.length - 1 ? (
                                            <button onClick={handleNext}>Next</button>
                                        ) : (
                                            <button onClick={handleSubmit}>Submit</button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Question;