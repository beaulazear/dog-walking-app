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

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.div`
  flex: 1; // Takes up remaining space to push the button to the bottom
  padding-bottom: 70px; // Space for the button
`;

const StyledButton = styled.button`
  position: fixed;
  bottom: 20px; // Space from the bottom
  left: 50%; // Center horizontally
  transform: translateX(-50%); // Adjust for centering
  padding: 10px 20px; // Adequate padding for a sleek look
  background-color: transparent; // Transparent background
  color: #007bff; // Primary color for text
  border: 1px solid #007bff; // Border matching the text color
  border-radius: 30px; // Rounded button
  cursor: pointer;
  font-size: 0.9rem; // Slightly smaller text
  font-weight: 500; // Medium font weight
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); // Subtle shadow

  &:hover {
    background-color: #007bff; // Background color on hover
    color: #fff; // White text on hover
    border-color: #007bff; // Maintain border color
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15); // Slightly larger shadow on hover
  }

  @media (max-width: 600px) {
    padding: 8px 16px; // Adjust padding for mobile
    font-size: 0.8rem; // Adjust font size for mobile
  }
`;

function App() {
  const { user, setUser } = useContext(UserContext);
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

  const isLoggedIn = user && Object.keys(user).length > 0; // Check if user has data

  return (
    <AppContainer>
      <MainContent>
        {isLoggedIn ? (
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
          </>
        ) : (
          <>
            <PageNavLinksNotLoggedIn />
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signuppage" element={<Signup />} />
              <Route path="/" element={<HomePage />} />
            </Routes>
          </>
        )}
      </MainContent>
      {isLoggedIn && <StyledButton onClick={handleLogout}>Logout</StyledButton>}
    </AppContainer>
  );
}

export default App;
