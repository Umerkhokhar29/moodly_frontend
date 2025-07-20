import React from 'react';
import './Helpline.css';
import { useNavigate } from 'react-router-dom';
import Logo from '../Assets/Logo.png';
import { motion } from 'framer-motion';
import { auth } from './firebase'; 

function Helpline() {
    const navigate = useNavigate();

const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");
    if (confirmLogout) {
        await auth.signOut();
        navigate('/');
    }
};

    const helplines = [
        { name: "TASKEEN HELPLINE", phone: "+92-317-4253441", email: "help@taskeen.org" },
        { name: "WILLING WAYS (PSYCHIATRIC EMERGENCY)", phone: "0322-7413639", email: "Karachi@willingways.org" },
        { name: "SINDH MENTAL HEALTH AUTHORITY HELPLINE", phone: "021-111-117-642 | 022-111-117-642" },
        { name: "PAKISTAN SUICIDE PREVENTION HELPLINE", phone: "+92-21-111-111-730" },
        { name: "PROJECT YAQEEN", phone: "92 042-37802445" },
        { name: "ROZAN COUNSELING HELPLINE", phone: "0304-111-1741" },
        { name: "MINISTRY OF HUMAN RIGHTS HELPLINE", phone: "1099 | 0333-9085709" },
        { name: "HOUSE OF PEBBLES (THERAPY CENTER)", phone: "(021) 37224371" },
        { name: "TRAUMA RELEASE AND WELLNESS CENTRE", phone: "0317-1188507", email: "info@trwcentre.com" },
        { name: "KARWAN E HAYAT", phone: "0311-1222398 | (021) 111-534-111 | (021) 32856774-5", email: "tamkeen.kashif@keh.org.pk" }
    ];

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
            {/* Content Section */}
            <div className="container px-5 flex-grow-1 d-flex align-items-center justify-content-center">
                <motion.div 
                    className="helpline-box p-4 rounded shadow w-100" 
                    initial={{ opacity: 0, y: 50 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    transition={{ duration: 1 }}>
                    <h1 className="text-center mb-4 fw-bold">Mental Health Support Contacts</h1>
                    <div className="row row-cols-1 row-cols-md-2 g-2">
                        {helplines.map((item, index) => (
                            <div key={index} className="col">
                                <div className="border rounded p-3 bg-white bg-opacity-75">
                                    <h5 className="fw-semibold mb-1">{item.name}</h5>
                                    <p className="mb-1"><strong>Mobile:</strong> {item.phone}</p>
                                    {item.email && <p className="mb-0"><strong>Email:</strong> {item.email}</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
                </div>
            </div>
        </div>
    );
}

export default Helpline;
