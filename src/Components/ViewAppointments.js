import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import Logo from '../Assets/Logo.png';
import { motion } from 'framer-motion';
import './Appointment.css'; // Reuse same CSS

function ViewAppointments() {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const API_BASE_URL = 'https://moodlybackend-production.up.railway.app'; 

    // Auth state listener
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setAuthLoading(false);
            } else {
                setUser(null);
                setAuthLoading(false);
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    // Fetch appointments
    useEffect(() => {
        const fetchAppointments = async () => {
            if (!user || !user.email) return;

            try {
                const response = await fetch(
                    `${API_BASE_URL}/api/appointments?email=${encodeURIComponent(user.email)}`
                );
                
                if (response.ok) {
                    const data = await response.json();
                    setAppointments(data);
                } else {
                    console.error('Failed to fetch appointments');
                    setAppointments([]);
                }
            } catch (error) {
                console.error('Error fetching appointments:', error);
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchAppointments();
        }
    }, [user]);

    const handleLogout = async () => {
        const confirmLogout = window.confirm("Are you sure you want to logout?");
        if (confirmLogout) {
            await auth.signOut();
            navigate('/');
        }
    };

    if (authLoading) {
        return <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100">
            <h2>Loading...</h2>
        </div>;
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
                <div className="d-flex gap-3">
                    <Link to="/doctors" className="btn btn-login"
                        style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                        Back to Doctors
                    </Link>
                    <button onClick={handleLogout} className="btn btn-login"
                        style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container px-5" style={{ paddingTop: '0px', paddingBottom: '40px', flexGrow: 1 }}>
                <motion.div 
                    className="d-flex flex-column justify-content-center align-items-center w-100 gap-4"
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 1 }}>
                    
                    <h2 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '20px', fontFamily: 'Outfit, sans-serif' }}>
                        My Appointments
                    </h2>

                    {loading ? (
                        <div className="text-center">
                            <h4>Loading appointments...</h4>
                        </div>
                    ) : appointments.length === 0 ? (
                        <div className="text-center">
                            <h4 style={{ color: '#666', marginBottom: '20px' }}>No appointments booked yet</h4>
                            <p style={{ color: '#888', marginBottom: '30px' }}>
                                Book your first appointment with our qualified therapists
                            </p>
                            <Link to="/doctors" className="btn btn-appointment">
                                Book Appointment
                            </Link>
                        </div>
                    ) : (
                        <div className="appointments-list" style={{ width: '100%', maxWidth: '800px' }}>
                            {appointments.map((appointment) => (
                                <div key={appointment.id} className="appointment-card" 
                                     style={{ 
                                         backgroundColor: '#f8f9fa', 
                                         border: '1px solid #dee2e6', 
                                         borderRadius: '10px', 
                                         padding: '20px', 
                                         marginBottom: '20px',
                                         boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                     }}>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h5 style={{ color: '#2c5aa0', marginBottom: '10px' }}>
                                                {appointment.doctorName}
                                            </h5>
                                            <p><strong>Date:</strong> {appointment.appointmentDate}</p>
                                            <p><strong>Time:</strong> {appointment.appointmentTime}</p>
                                            <p><strong>Mode:</strong> {appointment.therapyMode}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p><strong>Status:</strong> 
                                                <span style={{ 
                                                    color: appointment.status === 'pending' ? '#ffc107' : '#28a745',
                                                    textTransform: 'capitalize',
                                                    marginLeft: '5px'
                                                }}>
                                                    {appointment.status}
                                                </span>
                                            </p>
                                            <p><strong>Booked:</strong> {new Date(appointment.bookedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default ViewAppointments;