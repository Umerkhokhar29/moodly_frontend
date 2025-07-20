import React, { useState } from 'react';
import './Login.css';
import { Link, useNavigate } from 'react-router-dom';
import BotImage from '../Assets/Bot.png';
import Logo from '../Assets/Logo.png';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, provider } from './firebase'; // adjust path if needed

function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('Login successful!');
            navigate('/question'); // change route if needed
        } catch (error) {
            alert('Login failed: ' + error.message);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            await signInWithPopup(auth, provider);
            alert('Google login successful!');
            navigate('/question'); // change route if needed
        } catch (error) {
            alert('Google login failed: ' + error.message);
        }
    };

    return (
        <div className="container-fluid d-flex flex-column min-vh-100">
            {/* Navbar */}
            <nav className="d-flex justify-content-between align-items-center px-5 py-2"
                style={{
                    height: 'clamp(72px, 10vh, 100px)',
                    margin: 'clamp(1rem, 2vw, 2rem)',
                }}>
                <div className="d-flex align-items-center">
                    <img src={Logo} alt="Logo"
                        style={{ height: 'clamp(160px, 7vh, 80px)', objectFit: 'contain' }}
                        className="me-3" />
                </div>
                <div className="d-flex">
                    <Link to="/">
                        <button className="btn btn-login me-3"
                            style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                            Home
                        </button>
                    </Link>
                    <Link to="/signup">
                        <button className="btn btn-signup"
                            style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                            Signup
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="container px-5"
                style={{
                    paddingTop: '0px',
                    paddingBottom: '20px',
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                }}>
                <div className="row login-container d-flex align-items-center">
                    {/* Left side - bot image */}
                    <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="col-md-6 login-left d-flex justify-content-center align-items-center">
                        <div className="Bot">
                            <img src={BotImage} alt="Bot" className="bot-img" />
                        </div>
                    </motion.div>

                    {/* Right side - login form */}
                    <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="col-md-6 login-right d-flex justify-content-center align-items-center">
                        <div className="form-container">
                            <img src={Logo} alt="Logo" className="logo-img mb-4" />
                            <form onSubmit={handleLogin}>
                                <label>Email</label>
                                <input
                                    type="email"
                                    placeholder="something@gmail.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />

                                <label>Password</label>
                                <input
                                    type="password"
                                    placeholder="••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <div className="text-end">
                                    <a href="#" className="forgot-link">Forgot Password?</a>
                                </div>

                                <button type="submit" className="btn login-btn">Login</button>
                            </form>

                            <div className="divider">Or</div>

                            <button className="btn google-btn" onClick={handleGoogleLogin}>
                                Continue with Google
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Login;
