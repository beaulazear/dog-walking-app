import React, { useContext } from "react";
import { UserContext } from "./context/user";
import { Route, Routes, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
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
  flex: 1;
  padding-bottom: 70px;
`;

const StyledButton = styled.button`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  background-color: transparent;
  color: #007bff;
  border: 1px solid #007bff;
  border-radius: 30px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  &:hover {
    background-color: #007bff;
    color: #fff;
    border-color: #007bff;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 600px) {
    padding: 8px 16px;
    font-size: 0.8rem;
  }
`;

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const LoadingScreen = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background-color: #f4f4f4;
  color: #007bff;
  animation: ${fadeIn} 0.5s ease-in-out; // Faster fade-in
  text-align: center;

  & > .title {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 10px;
    color: #007bff;
    animation: ${fadeIn} 0.5s ease-in-out; // Faster fade-in for title

    @media (min-width: 768px) {
      font-size: 3.5rem;
    }
  }

  & > .subtitle {
    font-size: 1.2rem;
    color: #007bff;
    opacity: 0.8;
    animation: ${fadeIn} 0.5s ease-in-out; // Faster fade-in for subtitle

    @media (min-width: 768px) {
      font-size: 2rem;
    }
  }
`;

function App() {
  const { user, setUser, loading } = useContext(UserContext);
  const navigate = useNavigate();

  function handleLogout() {
    const confirmation = window.confirm("Are you sure you want to log out?");
    if (confirmation) {
      fetch("/logout", { method: "DELETE" }).then(() => {
        setUser(null);
        navigate('/');
      });
    } else {
      console.log("Log out aborted");
    }
  }

  const isLoggedIn = user && Object.keys(user).length > 0;

  if (loading) {
    return (
      <LoadingScreen>
        <div className="title">Pocket Walks</div>
        <div className="subtitle">loading soon...</div>
      </LoadingScreen>
    );
  }
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
