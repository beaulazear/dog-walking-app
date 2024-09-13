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
import { AppointmentsProvider } from './context/appointments';
import { InvoicesProvider } from './context/invoices';
import { PetsProvider } from "./context/pets";

const StyledButton = styled.button`
  position: fixed;
  bottom: 0;
  right: 0;
  margin: 10px;
  padding: 10px 20px;
  background-color: #ccc;
  color: #333;
  border: none;
  cursor: pointer;
  font-size: 0.9rem;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  transition: background-color 0.3s ease;

  &:hover {
    background-color: #bbb;
  }

  @media (max-width: 600px) {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
`;

function App() {
  const { user } = useContext(UserContext);
  const { setUser } = useContext(UserContext);
  const navigate = useNavigate();

  function handleLogout() {
    const confirmation = window.confirm("Are you sure you want to log out?");
    if (confirmation) {
      fetch("/logout", {
        method: "DELETE",
      }).then(() => {
        setUser(null);
        navigate('/');
      });
    } else {
      console.log("Log out aborted");
    }
  }

  return (
    <div>
      {user && (
        <>
          <PageNavLinks />
          <AppointmentsProvider>
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
          </AppointmentsProvider>
          <StyledButton onClick={handleLogout}>Logout</StyledButton>
        </>
      )}
      {!user && (
        <>
          <PageNavLinksNotLoggedIn />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signuppage" element={<Signup />} />
            <Route path="/" element={<HomePage />} />
          </Routes>
        </>
      )}
    </div>
  );
}

export default App;
