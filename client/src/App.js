import React, { useContext } from "react";
import { UserContext } from "./context/user";
import { Route, Routes, useNavigate } from 'react-router-dom';
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

  const { setUser } = useContext(UserContext)

  const navigate = useNavigate()

  function handleLogout() {
    fetch("/logout", {
      method: "DELETE",
    }).then(() => {
      setUser(null)
      navigate('/')
    })
  }

  if (user) {
    return (
      <div>
        <PageNavLinks />
        <TodaysAppointmentsProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signuppage" element={<Signup />} />
            <Route path="/petspage" element={<PetsPage />} />
            <Route path="/todayswalkspage" element={<TodaysWalksPage />} />
            <Route path="/invoicespage" element={<InvoicesPage />} />
            <Route path="/" element={<LoggedInHome />} />
          </Routes>
        </TodaysAppointmentsProvider>
        <button
          onClick={handleLogout}
          style={{
            position: 'fixed',
            left: '0',
            bottom: '0',
            width: '100%',
            backgroundColor: 'red',
            color: 'white',
            textAlign: 'center',
            margin: '0',
            marginTop: '20px',
            padding: '6px'
          }}
        >
          Logout Here
        </button>

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
