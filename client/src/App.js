import React, { useContext } from "react";
import { Route, Routes } from 'react-router-dom';
import { UserContext } from "./context/user";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
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
      <Navbar />
      {user ? (
        <>
          <Routes>
            <Route path="/todays-walks" element={<TodaysWalks />} />
            <Route path="/pets-page" element={<PetsPage />} />
            <Route path="*" element={<Dashboard />} />
          </Routes>
        </>
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Home />} />
        </Routes>
      )}
    </>
  );
}

export default App;