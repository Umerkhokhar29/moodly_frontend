import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Components/Home";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import Question from "./Components/Question";
import Result from "./Components/Result";
import Chatbot from "./Components/Chatbot";
import Appointment from "./Components/Appointment";
import Helpline from "./Components/Helpline";
import Doctors from './Components/Doctors';
import ViewAppointments from "./Components/ViewAppointments";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/question" element={<Question />} />
        <Route path="/result" element={<Result />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/appointment" element={<Appointment />} />
        <Route path="/helpline" element={<Helpline />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/appointment/:doctorId" element={<Appointment />} /> 
        <Route path="/view-appointments" element={<ViewAppointments />} />
      </Routes>
    </Router>
  );
}

export default App;


