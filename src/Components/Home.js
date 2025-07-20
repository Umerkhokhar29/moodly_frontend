import React from 'react';
import './Home.css';
import { Link } from 'react-router-dom';
import MainImage from '../Assets/Bot.png';
import Logo from '../Assets/Logo.png';
import { motion } from 'framer-motion';
function Home() {
  return (
      <div className="container-fluid d-flex flex-column min-vh-100">
          {/* Navbar */}
              <nav
                  className="d-flex justify-content-between align-items-center px-5 py-2"
                      style={{
                          height: 'clamp(72px, 10vh, 100px)',
                          margin: 'clamp(1rem, 2vw, 2rem)', // space on top, left, right, bottom
                        }}
              >
                  <div className="d-flex align-items-center">
                      <img
                          src={Logo}
                          alt="Logo"
                          style={{
                              height: 'clamp(160px, 7vh, 80px)',
                              objectFit: 'contain',
                            }}
                      className="me-3"
                   />
                  </div>
                  <div className="d-flex">
                  <Link to="/login">
                      <button
                          className="btn btn-login me-3"
                          style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}
                      >
                      Login
                      </button>
                      </Link>
                      <Link to="/signup">
                      <button
                          className="btn btn-signup"
                              style={{ fontSize: 'clamp(1.2rem, 1.5vw, 1.4rem)', padding: '0.5rem 1.2rem' }}
                      >
                      Signup
                      </button>
                      </Link>
                    </div>
                </nav>
               

          {/* Hero Section */}  
              <div
                  className="container px-5"
                  style={{
                      paddingTop: '0px', // More space below navbar
                      paddingBottom: '40px',
                      flexGrow: 1,
                      display: 'flex',
                      alignItems: 'center',
                  }}
>
                  <div className="row align-items-center justify-content-center gy-5 gx-5">
                      {/* Text Section with animation */}
                      <motion.div
                          initial={{ opacity: 0, x: -50 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 1 }}
                          className="col-md-6 d-flex justify-content-center"
                      >
                 <div style={{ maxWidth: '700px', color: 'black' }}>
                      <h1 className="fw-bold mb-4" style={{ fontSize: '4rem' }}>
                          Your Free<br />Personal AI Therapist
                      </h1>
                      <p style={{ fontSize: '1.5rem' }}>
                          Measure & improve your mental health in real-time with your personal AI chatbot.
                          <br />Available 24/7.
                      </p>
                      <Link to="/login">
                      <button className="btn mt-4 custom-start-btn">
                            Get Started
                      </button>
                      </Link>

                  </div>
                     </motion.div>

                     {/* Image Section with animation */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1 }}
                        className="col-md-6 d-flex justify-content-center"
                    >
                  <img
                      src={MainImage}
                      alt="Therapy"
                      className="img-fluid"
                          style={{
                            maxWidth: '450px',
                            marginLeft: '40px',
                          }}
                   />
                   </motion.div>
               </div>
              </div>

        </div>
  
  );
}

export default Home;
