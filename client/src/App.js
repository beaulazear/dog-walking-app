import React, { useContext } from "react";
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserContext } from "./context/user";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Dashboard from "./components/Dashboard";
import TodaysWalks from "./components/TodaysWalks";
import PetsPage from "./components/PetsPage";
import LoadingScreen from "./components/LoadingScreen";

function App() {
  const { user, loading } = useContext(UserContext);

  if (loading) {
    return <LoadingScreen>Loading...</LoadingScreen>;
  }

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            fontSize: '14px',
            padding: '12px 16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {user ? (
        <>
          <Navbar />
          <Routes>
            <Route path="/todays-walks" element={<TodaysWalks />} />
            <Route path="/pets-page" element={<PetsPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </>
      ) : (
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Login />} />
        </Routes>
      )}
    </>
  );
}

export default App;