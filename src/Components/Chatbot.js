import React, { useState, useEffect, useRef } from 'react';
import './Chatbot.css';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Assets/Logo.png';
import BotImage from '../Assets/Bot.png';
import { motion } from 'framer-motion';
import { auth, provider } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

function Chatbot() {
    const navigate = useNavigate();
    
    // Auth state
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    
    // Chat state management
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sessionId, setSessionId] = useState(null);
    const [error, setError] = useState(null);
    const [isFirstMessage, setIsFirstMessage] = useState(true);
    const [eligibilityStatus, setEligibilityStatus] = useState({
    loading: true,
    eligible: false,
    reason: ''
});
    
    // Session management
    const [userSessions, setUserSessions] = useState([]);
    const [showSessions, setShowSessions] = useState(false);
    
    // Refs for auto-scroll
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const inputRef = useRef(null);

    // API base URL 
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                try {
                    // Get the ID token for API authentication
                    const token = await currentUser.getIdToken();
                    setUser(currentUser);
                    setAuthToken(token);
                    setAuthLoading(false);
                } catch (error) {
                    console.error('Error getting auth token:', error);
                    setAuthLoading(false);
                    handleLogout();
                }
            } else {
                setUser(null);
                setAuthToken(null);
                setAuthLoading(false);
                navigate('/login'); // Redirect to login if not authenticated
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (authToken) {
            checkEligibility();
        }
    }, [authToken]);


    // Auto-scroll to bottom when new messages arrive
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        
        // Always refocus input after scrolling (for chat UI this makes sense)
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize chat with welcome message
    useEffect(() => {
        if (isFirstMessage && !authLoading) {
            const welcomeMessage = {
                role: 'assistant',
                content: "Hello! I'm Moodly, your AI therapy companion. I'm here to listen and support you. How are you feeling today?",
                timestamp: new Date().toISOString()
            };
            setMessages([welcomeMessage]);
            setIsFirstMessage(false);
        }
    }, [isFirstMessage, authLoading]);

    // Load user sessions on component mount
    useEffect(() => {
        if (authToken) {
            loadUserSessions();
        }
    }, [authToken]);

    const handleLogout = async () => {
        try {
            await auth.signOut();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Get auth headers for API requests
    const getAuthHeaders = () => {
        if (!authToken) {
            throw new Error('No authentication token available');
        }
        
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
        };
    };

    const checkEligibility = async () => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/check-eligibility`, {
            method: 'GET',
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error('Failed to check eligibility');
        }

        const data = await response.json();
        setEligibilityStatus({
            loading: false,
            eligible: data.eligible,
            reason: data.reason
        });
    } catch (error) {
        console.error('Eligibility check failed:', error);
        setEligibilityStatus({
            loading: false,
            eligible: false,
            reason: 'error'
        });
    }
};

    // Load user sessions from backend
    const loadUserSessions = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions`, {
                method: 'GET',
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log("Sessions API response: ",data)
            setUserSessions(data.sessions || []);
        } catch (error) {
            console.error('Error loading sessions:', error);
        }
    };

    // API call to backend
    const sendMessageToAPI = async (message, currentSessionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({
                    message: message,
                    ...(currentSessionId && { session_id: currentSessionId })
                }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    // Token expired or invalid
                    handleLogout();
                    throw new Error('Authentication failed. Please log in again.');
                } else if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    };

    // Handle sending messages
    const handleSendMessage = async () => {
        if (!inputMessage.trim() || !authToken) return;

        const userMessage = {
            role: 'user',
            content: inputMessage.trim(),
            timestamp: new Date().toISOString()
        };

        // Add user message to chat
        setMessages(prev => [...prev, userMessage]);
        const currentInput = inputMessage;
        setInputMessage('');     
        setIsLoading(true);
        setError(null);

        try {
            // Send to API
            const response = await sendMessageToAPI(currentInput, sessionId);
            
            // Update session ID if new
            if (!sessionId && response.session_id) {
                setSessionId(response.session_id);
                // Refresh sessions list
                loadUserSessions();
            }

            // Add bot response
            const botMessage = {
                role: 'assistant',
                content: response.response,
                timestamp: new Date().toISOString()
            };

            // Add typing delay for better UX
            setTimeout(() => {
                setMessages(prev => [...prev, botMessage]);
                setIsLoading(false);
            }, 1000 + Math.random() * 1000); // 1-2 second delay

        } catch (error) {
            setIsLoading(false);
            let errorMessage = "I'm having trouble connecting right now. Please try again in a moment.";
            
            if (error.message.includes('rate') || error.message.includes('429')) {
                errorMessage = "I'm receiving too many requests. Please wait a moment before trying again.";
            } else if (error.message.includes('network') || error.message.includes('fetch')) {
                errorMessage = "There seems to be a connection issue. Please check your internet and try again.";
            } else if (error.message.includes('Authentication')) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            
            // Clear error after 5 seconds
            setTimeout(() => setError(null), 5000);
        }
    };

    // Handle Enter key press
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Handle new chat
    const handleNewChat = () => {
        setMessages([]);
        setSessionId(null);
        setInputMessage('');
        setError(null);
        setIsFirstMessage(true);
    };

    // Load existing session
    // REPLACE the existing loadSession function with this:
const loadSession = async (sessionId) => {
    try {
        setIsLoading(true);
        
        // First, get the session messages
        const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/messages`, {
            method: 'GET',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            const data = await response.json();
            setSessionId(sessionId);
            setMessages(data.messages || []);
            setIsFirstMessage(false);
            setShowSessions(false);
            setError(null);
        } else {
            throw new Error('Failed to load session');
        }
    } catch (error) {
        console.error('Error loading session:', error);
        setError('Failed to load session. Please try again.');
    } finally {
        setIsLoading(false);
    }
};

    // Delete session
    const deleteSession = async (sessionId) => {
        try {
            const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}`, {
                method: 'DELETE',
                headers: getAuthHeaders(),
            });

            if (response.ok) {
                loadUserSessions(); // Refresh sessions list
                if (sessionId === sessionId) {
                    handleNewChat(); // Clear current chat if deleted session is active
                }
            }
        } catch (error) {
            console.error('Error deleting session:', error);
        }
    };

    // Quick therapy prompts
    const quickPrompts = [
        "I'm feeling anxious about something",
        "I need someone to talk to",
        "Help me understand my emotions"
    ];

    const handleQuickPrompt = (prompt) => {
        setInputMessage(prompt);
    };

    // Show loading if auth is still loading
    if (authLoading || eligibilityStatus.loading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }
    // Not eligible - show restriction message
if (!eligibilityStatus.eligible) {
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
                        <h2>Chatbot Access Restricted</h2>
                        <p>
                            {eligibilityStatus.reason === 'no_questionnaire' 
                                ? 'Please complete the questionnaire first to access the chatbot.'
                                : eligibilityStatus.reason === 'depression_detected'
                                ? 'Based on your assessment results, we recommend seeking professional help instead of using the chatbot.'
                                : 'Unable to verify your eligibility at this time.'}
                        </p>
                        <Link to="/question" className="btn btn-primary mt-3">
                            {eligibilityStatus.reason === 'no_questionnaire' ? 'Take Questionnaire' : 'Retake Questionnaire'}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Show error if no user
    if (!user) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <h4>Authentication Required</h4>
                    <p>Please log in to access the chatbot.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>
                        Go to Login
                    </button>
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
                <div className="d-flex align-items-center">
                    <span className="me-3 text-muted">Welcome, {user.displayName || user.email}</span>
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
                
                <motion.div 
                    className="chatbot-section d-flex flex-column flex-md-row justify-content-center align-items-stretch w-100 gap-0 my-5 px-4"
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 1 }}
                >
                    {/* Left Sidebar */}
                    <div className="left-panel d-flex flex-column align-items-start p-4" 
                         style={{ width: '30%', backgroundColor: 'rgba(255, 255, 255, 0.7)', borderRadius: '20px' }}>
                        <img src={Logo} alt="Logo" style={{ height: '80px', marginBottom: '30px' }} />
                        
                        <button 
                            className="btn btn-login w-100 mb-3" 
                            style={{ borderRadius: '50px' }}
                            onClick={handleNewChat}
                        >
                            New Chat
                        </button>

                        <button 
                            className="btn btn-outline-primary w-100 mb-4" 
                            style={{ borderRadius: '50px' }}
                            onClick={() => setShowSessions(!showSessions)}
                        >
                            My Sessions ({userSessions.length})
                        </button>

                       {/* Sessions List */}
{showSessions && (
    <div className="w-100 mb-4 session-list">
        {userSessions.length > 0 ? (
            userSessions.map((session) => {
                const isActive = session.session_id === sessionId;
                return (
                    <div key={session.session_id} className="d-flex align-items-center mb-2">
                        <button 
                            className={`btn btn-sm flex-grow-1 text-start session-button ${isActive ? 'active' : 'btn-light'}`}
                            onClick={() => loadSession(session.session_id)}
                            style={{ fontSize: '0.8rem' }}
                        >
                            {session.preview || 'Chat Session'}
                        </button>
                        <button 
                            className="btn btn-sm btn-outline-danger ms-2"
                            onClick={() => deleteSession(session.session_id)}
                        >
                            ×
                        </button>
                    </div>
                );
            })
        ) : (
            <small className="text-muted">No previous sessions</small>
        )}
    </div>
)}

                        
                        {/* Quick Therapy Prompts */}
                        <div className="w-100">
                            <h6 className="mb-3 text-muted">Quick starters:</h6>
                            {quickPrompts.map((prompt, index) => (
                                <button 
                                    key={index}
                                    className="btn bg-white text-dark mb-2 w-100 text-start" 
                                    style={{ borderRadius: '10px', fontSize: '0.9rem' }}
                                    onClick={() => handleQuickPrompt(prompt)}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        {/* Session Info */}
                        {sessionId && (
                            <div className="mt-auto">
                                <small className="text-muted">Session Active</small>
                                <br />
                                <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                                    ID: {sessionId.substring(0, 8)}...
                                </small>
                            </div>
                        )}
                    </div>

                    {/* Right Chat Area */}
                    <div className="right-panel d-flex flex-column justify-content-between px-4" 
                         style={{ width: '75%', height: '500px' }}>
                        
                        {/* Chat Header */}
                        <div className="text-center py-3">
                            <h3 className="mb-1">Your AI Therapy Companion</h3>
                            <small className="text-muted">Safe space for your thoughts and feelings</small>
                        </div>

                        {/* Messages Container */}
                        <div 
                            className="message-container flex-grow-1 mb-3 px-2"
                            ref={chatContainerRef}
                        >

                            {messages.length === 0 ? (
                                <div className="d-flex flex-column align-items-center justify-content-center h-100">
                                    <img src={BotImage} alt="Bot" style={{ height: '150px', opacity: 0.6, marginBottom: '20px' }} />
                                    <p className="text-muted text-center">Start a conversation with your AI therapist</p>
                                </div>
                            ) : (
                                messages.map((message, index) => (
                                    <div key={index} className={`mb-3 d-flex ${message.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                                        <div 
                                            className={`p-3 rounded-3 ${message.role === 'user' 
                                                ? 'bg-primary text-white' 
                                                : 'bg-light border'}`}
                                            style={{ maxWidth: '70%' }}
                                        >
                                            <div>{message.content}</div>
                                            <small className={`d-block mt-1 ${message.role === 'user' ? 'text-white-50' : 'text-muted'}`}>
                                                {message.timestamp && !isNaN(new Date(message.timestamp)) 
                                                    ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                                    : 'Time unknown'}
                                            </small>

                                        </div>
                                    </div>
                                ))
                            )}
                            
                            {/* Typing Indicator */}
                            {isLoading && (
                                <div className="mb-3 d-flex justify-content-start">
                                    <div className="bg-light border p-3 rounded-3">
                                        <div className="typing-indicator">
                                            <span></span>
                                            <span></span>
                                            <span></span>
                                        </div>
                                        <small className="text-muted">Moodly is typing...</small>
                                    </div>
                                </div>
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Error Display */}
                        {error && (
                            <div className="alert alert-warning alert-dismissible fade show mb-3" role="alert">
                                <small>{error}</small>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-sm" 
                                    onClick={() => setError(null)}
                                    aria-label="Close"
                                ></button>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="input-group mb-3">
                            <input 
                                ref={inputRef}
                                type="text" 
                                className="form-control" 
                                placeholder="Share what's on your mind..."
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                onKeyPress={handleKeyPress}
                                disabled={isLoading || !authToken}
                                style={{ borderRadius: '25px 0 0 25px' }}
                            />
                            <button 
                                className="btn btn-primary"
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputMessage.trim() || !authToken}
                                style={{ borderRadius: '0 25px 25px 0' }}
                            >
                                {isLoading ? (
                                    <div className="spinner-border spinner-border-sm" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                                        <path d="M15.854 7.646-15-7a.5.5 0 0 0-.651.651l7 15a.5.5 0 0 0 .923-.103l1.627-4.395 4.395-1.627a.5.5 0 0 0 .103-.923zM6.25 9.75a.75.75 0 1 1 1.5 0 .75.75 0 0 1-1.5 0z"/>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
                          
            </div>
        </div>
    );
}

export default Chatbot;