import React, { useContext } from "react";
import { UserContext } from "./context/user";
import { Route, Routes } from 'react-router-dom';
import PageNavLinks from "./components/navlinks/PageNavLinks";
import PageNavLinksNotLoggedIn from "./components/navlinks/PageNavLinksNotLoggedIn";
import HomePage from "./components/home/HomePage";
import Login from "./components/home/Login";
import Signup from "./components/home/Signup";
import PetsPage from "./components/pets/PetsPage";
import TodaysWalksPage from "./components/appointments/TodaysWalksPage";
import InvoicesPage from "./components/invoices/InvoicePage";
import LoggedInHome from "./components/home/LoggedInHome";
import { TodaysAppointmentsProvider } from './context/appointments';

function App() {

  const { user } = useContext(UserContext)

  if (user) {
    return (
      <div>
        <PageNavLinks />
        <TodaysAppointmentsProvider>
          <Routes>
            <Route path="/loggedinhome" element={<LoggedInHome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signuppage" element={<Signup />} />
            <Route path="/petspage" element={<PetsPage />} />
            <Route path="/todayswalkspage" element={<TodaysWalksPage />} />
            <Route path="/invoicespage" element={<InvoicesPage />} />
          </Routes>
        </TodaysAppointmentsProvider>
      </div>
    );
  } else {
    return (
      <div>
        <PageNavLinksNotLoggedIn />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signuppage" element={<Signup />} />
          <Route path="/" element={<HomePage />} />
        </Routes>
      </div>
    )
  }
}

export default App;
