import React from 'react';
import { useState, useEffect } from 'react';
import './Doctors.css';
import { Link, useNavigate } from 'react-router-dom';
import Logo from '../Assets/Logo.png';
import { motion } from 'framer-motion';
import { auth } from './firebase';
import doctorsData from './doctors.json';
import { onAuthStateChanged } from 'firebase/auth';

// Import doctor images - you'll need to add these to your Assets folder
import doctor1 from '../Assets/doctor1.jpg';
import doctor2 from '../Assets/doctor2.jpg';
import doctor3 from '../Assets/doctor3.jpg';
import doctor4 from '../Assets/doctor4.jpg';
import doctor5 from '../Assets/doctor5.jpg';

function Doctors() {
    const navigate = useNavigate();

    // Auth state
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

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

    const handleLogout = async () => {
        const confirmLogout = window.confirm("Are you sure you want to logout?");
        if (confirmLogout) {
            await auth.signOut();
            navigate('/');
        }
    };
    
    const handleBookAppointment = (doctorId) => {
        navigate(`/appointment/${doctorId}`);
    };

    // Map doctor images
    const doctorImages = {
        1: doctor1,
        2: doctor2,
        3: doctor3,
        4: doctor4,
        5: doctor5
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
                    <button onClick={handleLogout} className="btn btn-login"
                        style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container px-5"
                style={{
                    paddingTop: '20px',
                    paddingBottom: '40px',
                    flexGrow: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}>
                <motion.div 
                    className="doctors-section w-100"
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 1 }}>
                    
                    <h2 className="doctors-title">Our Psychologists</h2>
                    <p className="doctors-subtitle">Start by choosing a psychologist you'd like to book an appointment with.</p>                 
                    <div className="doctors-grid">
                        {doctorsData.map((doctor) => (
                            <div key={doctor.id} className="doctor-card">
                                <div className="doctor-image-container">
                                    <img 
                                        src={doctorImages[doctor.id]} 
                                        alt={doctor.name}
                                        className="doctor-image"
                                    />
                                </div>
                                <div className="doctor-info">
                                    <h3 className="doctor-name">{doctor.name}</h3>
                                    <p className="doctor-credentials">{doctor.credentials}</p>
                                    <p className="doctor-specialization">{doctor.specialization}</p>
                                    <div className="doctor-details">
                                        <p><strong>Experience:</strong> {doctor.experience}</p>
                                        <p><strong>Working Days:</strong> {doctor.workingDays}</p>
                                        <p><strong>Working Hours:</strong> {doctor.workingHours}</p>
                                        <p><strong>Consultation:</strong> {doctor.consultationModes.join(', ')}</p>
                                    </div>
                                    <p className="doctor-bio">{doctor.bio}</p>
                                    <button 
                                        className="btn btn-appointment"
                                        onClick={() => handleBookAppointment(doctor.id)}
                                    >
                                        Book Appointment
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

export default Doctors;