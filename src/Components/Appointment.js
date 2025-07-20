import React, { useState, useEffect } from 'react';
import './Appointment.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Logo from '../Assets/Logo.png';
import { motion } from 'framer-motion';
import { auth } from './firebase';
import doctorsData from './doctors.json';
import emailjs from '@emailjs/browser';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

// Import doctor images
import doctor1 from '../Assets/doctor1.jpg';
import doctor2 from '../Assets/doctor2.jpg';
import doctor3 from '../Assets/doctor3.jpg';
import doctor4 from '../Assets/doctor4.jpg';
import doctor5 from '../Assets/doctor5.jpg';
import { onAuthStateChanged } from 'firebase/auth';

function Appointment() {
    const navigate = useNavigate();

    // Auth state
    const [user, setUser] = useState(null);
    const [authToken, setAuthToken] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    //email service variables
    const SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
    const TEMPLATE_USER = process.env.REACT_APP_EMAILJS_TEMPLATE_USER;
    const TEMPLATE_ADMIN = process.env.REACT_APP_EMAILJS_TEMPLATE_ADMIN;
    const PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;

    const { doctorId } = useParams();
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        age: '',
        gender: '',
        contact: '',
        email: '',
        appointmentDate: '',
        appointmentTime: '',
        therapyMode: '',
    });

    const doctorImages = {
        1: doctor1,
        2: doctor2,
        3: doctor3,
        4: doctor4,
        5: doctor5
    };

    const timeSlots = [
        '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
        '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM'
    ];

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
    // Auto-fill email from Firebase Auth
    useEffect(() => {
            if (user && user.email) {
                setFormData(prev => ({
                    ...prev,
                    email: user.email
                }));
            }
        }, [user]);    
    useEffect(() => {
        if (doctorId) {
            const doctor = doctorsData.find(d => d.id === parseInt(doctorId));
            setSelectedDoctor(doctor);
        }
    }, [doctorId]);
        
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

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


    const showConfirmation = () => {
        return new Promise((resolve) => {
            confirmAlert({
                customUI: ({ onClose }) => {
                    return (
                        <div className="custom-confirm-box">
                            <h2>Confirm Appointment</h2>
                            <p>
                                Are you sure you want to book an appointment with <strong>{selectedDoctor.name}</strong> <br />
                                on <strong>{formData.appointmentDate}</strong> at <strong>{formData.appointmentTime}</strong>?
                            </p>
                            <div className="custom-confirm-buttons">
                                <button
                                    className="btn-confirm"
                                    onClick={() => {
                                        onClose();
                                        resolve(true);
                                    }}
                                >
                                    Yes, Confirm
                                </button>
                                <button className="btn-cancel" onClick={() => { onClose(); resolve(false); }}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    );
                }
            });
        });
    };


    const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const handleSubmit = async (e) => {
        e.preventDefault();

        const confirm = await showConfirmation();
        if (!confirm) return;


        setIsSubmitting(true);

        const appointmentData = {
            id: Date.now(),
            doctorId: selectedDoctor.id,
            doctorName: selectedDoctor.name,
            patientName: formData.name,
            patientAge: formData.age,
            patientGender: formData.gender,
            patientContact: formData.contact,
            patientEmail: formData.email,
            appointmentDate: formData.appointmentDate,
            appointmentTime: formData.appointmentTime,
            therapyMode: formData.therapyMode,
            status: 'pending',
            bookedAt: new Date().toISOString()
        };

        try {
            const response = await fetch(`${API_BASE_URL}/api/appointments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(appointmentData)
            });

            if (!response.ok) {
                throw new Error('Failed to save appointment');
            }

            // Send confirmation to patient
            await emailjs.send(
                SERVICE_ID,
                TEMPLATE_USER,
                {
                    to_email: formData.email,
                    patient_name: formData.name,
                    doctor_name: selectedDoctor.name,
                    appointment_date: formData.appointmentDate,
                    appointment_time: formData.appointmentTime,
                    therapy_mode: formData.therapyMode
                },
                PUBLIC_KEY
            );

            // Send notification to admin
            await emailjs.send(
                SERVICE_ID,
                TEMPLATE_ADMIN,
                {
                    to_email: 'muhammedumer292003@gmail.com',
                    patient_name: formData.name,
                    patient_email: formData.email,
                    patient_contact: formData.contact,
                    doctor_name: selectedDoctor.name,
                    appointment_date: formData.appointmentDate,
                    appointment_time: formData.appointmentTime,
                    therapy_mode: formData.therapyMode
                },
                PUBLIC_KEY
            );

            toast.success(`Appointment booked with ${selectedDoctor.name}! Redirecting...`);



            // Delay before redirect
            setTimeout(() => {
                navigate('/view-appointments');
            }, 4950);

        } catch (error) {
            console.error('Error:', error);
            if (error.message.includes('Failed to save appointment')) {
                toast.error('Failed to save appointment. Please try again.');
            } else {
                toast.warn('Appointment saved but email sending failed. Please contact support.');
            }
        } finally {
            setIsSubmitting(false);
        }
};


    if (!selectedDoctor) {
        return (
            <div className="container-fluid d-flex justify-content-center align-items-center min-vh-100">
                <div className="text-center">
                    <h2>🩺 No doctor selected</h2>
                    <p>Please start by selecting a doctor to continue booking your session.</p>
                    <Link to="/doctors" className="btn btn-appointment">Browse Available Doctors</Link>
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
                <div className="d-flex gap-3">
                    <Link to="/doctors" className="btn btn-login"
                        style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                        Back to Doctors
                    </Link>
                    <Link to="/view-appointments" className="btn btn-login"
                        style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                        View Appointments
                    </Link>
                    <button onClick={handleLogout} className="btn btn-login"
                        style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}>
                        Logout
                    </button>
                </div>
            </nav>

            {/* Main Content */}
            <div className="container px-5"
                style={{
                    paddingTop: '0px',
                    paddingBottom: '40px',
                    flexGrow: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                <motion.div 
                    className="appointment-section d-flex flex-column justify-content-center align-items-center w-100 gap-4"
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 1 }}>
                    
                    {/* Selected Doctor Info */}
                    <div className="selected-doctor-info">
                        <h2 style={{ textAlign: 'center', fontSize: '32px', marginBottom: '20px', fontFamily: 'Outfit, sans-serif' }}>
                            Book Appointment
                        </h2>
                        <div className="doctor-selection-card">
                            <img 
                                src={doctorImages[selectedDoctor.id]} 
                                alt={selectedDoctor.name}
                                className="selected-doctor-image"
                            />
                            <div className="selected-doctor-details">
                                <h3>{selectedDoctor.name}</h3>
                                <p>{selectedDoctor.credentials}</p>
                                <p><strong>Specialization:</strong> {selectedDoctor.specialization}</p>
                                <p><strong>Working Hours:</strong> {selectedDoctor.workingHours}</p>
                            </div>
                        </div>
                    </div>

                    {/* Appointment Form */}
                    <form onSubmit={handleSubmit} className="appointment-form">
                        <span style={{textAlign: 'center', fontSize: '28px', marginBottom:'20px', fontFamily: 'Outfit, sans-serif'}}>
                            Patient Information
                        </span>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Full Name:</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label>Age:</label>
                                <input type="number" name="age" value={formData.age} onChange={handleChange} required />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Gender:</label>
                                <select name="gender" value={formData.gender} onChange={handleChange} required>
                                    <option value="">Select</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Contact Number:</label>
                                <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required />
                            </div>
                        </div>

                        <label>Email Address:</label>
                            <input 
                                type="email" 
                                name="email" 
                                value={formData.email} 
                                readOnly={true}
                                style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }}
                                title="Email auto-filled from your account"
                                required 
                            />

                        <div className="form-row">
                            <div className="form-group">
                                <label>Appointment Date:</label>
                                <input 
                                    type="date" 
                                    name="appointmentDate" 
                                    value={formData.appointmentDate} 
                                    onChange={handleChange} 
                                    min={new Date().toISOString().split('T')[0]}
                                    required 
                                />
                            </div>
                            <div className="form-group">
                                <label>Appointment Time:</label>
                                <select name="appointmentTime" value={formData.appointmentTime} onChange={handleChange} required>
                                    <option value="">Select Time</option>
                                    {timeSlots.map(time => (
                                        <option key={time} value={time}>{time}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <label>Mode of Therapy:</label>
                        <select name="therapyMode" value={formData.therapyMode} onChange={handleChange} required>
                            <option value="">Select</option>
                            {selectedDoctor.consultationModes.map(mode => (
                                <option key={mode} value={mode.toLowerCase()}>{mode}</option>
                            ))}
                        </select>
                        
                        <button type="submit" className="btn btn-appointment" disabled={isSubmitting}>
                            {isSubmitting ? 'Booking...' : 'Confirm Appointment'}
                        </button>

                    </form>
                </motion.div>
            </div>
                <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick pauseOnFocusLoss draggable pauseOnHover />
        </div>
    );
}

export default Appointment;