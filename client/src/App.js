import React, { useContext } from "react";
import { UserContext } from "./context/user";
import { Route, Routes, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
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

const StyledButton = styled.button`
  position: fixed;
  bottom: 0;
  width: 100%;
  height: 40px;
  background-color: red;
  color: black;
  text-align: center;
  border: none;
  cursor: pointer;
  /* Additional styles */
  font-size: 1rem;
  font-weight: bold;
  border-radius: 0;
  transition: background-color 0.3s ease;
  
  &:hover {
    background-color: darkred;
  }
`;

function App() {

  const { user } = useContext(UserContext)

  const { setUser } = useContext(UserContext)

  const navigate = useNavigate()

  function handleLogout() {

    const confirmation = window.confirm("Are you sure you want to log out?")

    if (confirmation) {
      fetch("/logout", {
        method: "DELETE",
      }).then(() => {
        setUser(null)
        navigate('/')
      })
    } else {
      console.log("Log out aborted")
    }
  }

  if (user) {
    return (
      <div style={{ paddingBottom: '25px' }}>
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
        <StyledButton onClick={handleLogout}>Logout</StyledButton>
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
