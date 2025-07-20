import React, { useState } from 'react';
import './Signup.css';
import { Link, useNavigate } from 'react-router-dom';
import BotImage from '../Assets/Bot.png';
import Logo from '../Assets/Logo.png';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

function Signup() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        age: '',
        gender: '',
        password: '',
        confirmPassword: ''
    });
    
    const validatePassword = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{8,}$/;
        return regex.test(password);
    };


    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, age, gender, password, confirmPassword } = formData;

        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        if (!validatePassword(password)) {
            alert("Password must be at least 8 characters long and include:\n• 1 uppercase letter\n• 1 lowercase letter\n• 1 number\n• 1 special character");
            return;
        }

        if (parseInt(age) < 16) {
            alert("You must be at least 16 years old to sign up.");
            return;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await setDoc(doc(db, "users", user.uid), {
                name,
                email,
                age,
                gender,
                uid: user.uid,
                createdAt: new Date()
            });

            alert("Signup successful!");
            navigate('/login');
        } catch (error) {
            console.error("Signup or Firestore error:", error.message);

            let message = "Something went wrong. Please try again.";
            if (error.code === 'auth/email-already-in-use') {
                message = "That email is already registered.";
            } else if (error.code === 'auth/weak-password') {
                message = "Password is too weak. Make sure it meets the rules.";
            }

            alert("Error: " + message);
        }
    };


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
                    <Link to="/">
                        <button className="btn btn-login me-3"
                            style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                            Home
                        </button>
                    </Link>
                    <Link to="/login">
                        <button className="btn btn-signup"
                            style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                            Login
                        </button>
                    </Link>
                </div>
            </nav>

            {/* Main Section */}
            <div className="container px-5 flex-grow-1 d-flex align-items-center">
                <div className="row login-container d-flex align-items-center">
                    {/* Form */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="col-md-6 login-left d-flex justify-content-center align-items-center"
                    >
                        <div className="form-container">
                            <img src={Logo} alt="Logo" className="logo-img mb-4" />
                            <form className="scrollable-form" onSubmit={handleSubmit}>
                                <label>Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    placeholder="Enter Your Name"
                                    required
                                    value={formData.name}
                                    onChange={handleChange}
                                />

                                <label>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Enter Your Email"
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                />

                                <label>Age</label>
                                <input
                                    type="number"
                                    name="age"
                                    min="16"
                                    placeholder="Your Age"
                                    required
                                    value={formData.age}
                                    onChange={handleChange}
                                />

                                <label>Gender</label>
                                <select
                                    name="gender"
                                    required
                                    value={formData.gender}
                                    onChange={handleChange}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>

                                <label>Password</label>
                                    <input
                                        type="password"
                                        name="password"
                                        placeholder="Enter Your Password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                <small className="text-muted mb-2 d-block">
                                    Must include 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
                                </small>

                                <label>Re-enter Password</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    placeholder="Re-Enter Your Password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />

                                <button type="submit" className="btn login-btn">
                                    Signup
                                </button>
                            </form>
                        </div>
                    </motion.div>

                    {/* Bot Image */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="col-md-6 login-right d-flex justify-content-center align-items-center"
                    >
                        <div className="Bot">
                            <img src={BotImage} alt="Bot" className="bot-img" />
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Signup;
