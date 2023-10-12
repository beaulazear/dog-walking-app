import React from "react";
import { Route, Routes } from 'react-router-dom';
import PageNavLinks from "./components/navlinks/PageNavLinks";
import HomePage from "./components/home/HomePage";
import Login from "./components/home/Login";
import Signup from "./components/home/Signup";
import PetsPage from "./components/pets/PetsPage";
import AppointmentsPage from "./components/appointments/AppointmentsPage";

function App() {
  return (
    <div>
      <PageNavLinks />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signuppage" element={<Signup />} />
        <Route path="/petspage" element={<PetsPage />} />
        <Route path="/appointmentspage" element={<AppointmentsPage />} />
      </Routes>
    </div>
  );
}

export default App;
