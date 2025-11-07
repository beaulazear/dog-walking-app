import React, { useContext, lazy, Suspense } from "react";
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserContext } from "./context/user";
import Navbar from "./components/Navbar";
import LoadingScreen from "./components/LoadingScreen";

// Lazy load route components for better code splitting
const Login = lazy(() => import("./components/Login"));
const Signup = lazy(() => import("./components/Signup"));
const Dashboard = lazy(() => import("./components/Dashboard"));
const TodaysWalks = lazy(() => import("./components/TodaysWalks"));
const PetsPage = lazy(() => import("./components/PetsPage"));
const MyTeam = lazy(() => import("./components/MyTeam"));
const SharedAppointments = lazy(() => import("./components/SharedAppointments"));

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
          <Suspense fallback={<LoadingScreen>Loading page...</LoadingScreen>}>
            <Routes>
              <Route path="/todays-walks" element={<TodaysWalks />} />
              <Route path="/pets-page" element={<PetsPage />} />
              <Route path="/my-team" element={<MyTeam />} />
              <Route path="/shared" element={<SharedAppointments />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </Suspense>
        </>
      ) : (
        <Suspense fallback={<LoadingScreen>Loading...</LoadingScreen>}>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="*" element={<Login />} />
          </Routes>
        </Suspense>
      )}
    </>
  );
}

export default App;