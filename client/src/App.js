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
import { TodaysAppointmentsProvider } from './context/todaysAppointments';
import { PetsAppointmentsProvider } from './context/petsAppointments';
import { InvoicesProvider } from './context/invoices';
import { PetsProvider } from "./context/pets";

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
      <div style={{paddingBottom: '25px'}}>
        <PageNavLinks />
        <TodaysAppointmentsProvider>
          <PetsAppointmentsProvider>
            <InvoicesProvider>
              <PetsProvider>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/signuppage" element={<Signup />} />
                  <Route path="/petspage" element={<PetsPage />} />
                  <Route path="/todayswalkspage" element={<TodaysWalksPage />} />
                  <Route path="/invoicespage" element={<InvoicesPage />} />
                  <Route path="/" element={<LoggedInHome />} />
                </Routes>
              </PetsProvider>
            </InvoicesProvider>
          </PetsAppointmentsProvider>
        </TodaysAppointmentsProvider>
        <div style={{ marginBottom: '30px' }}>
          <button
            onClick={handleLogout}
            style={{
              position: 'fixed',
              bottom: '0',
              width: '100%',
              height: '40px',
              backgroundColor: 'red',
              color: 'black',
              textAlign: 'center',
            }}
          >
            Log Out
          </button>

        </div>
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

//fix footer to have space between body

export default App;
