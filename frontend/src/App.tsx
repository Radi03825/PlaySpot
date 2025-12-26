import './App.css'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import SportComplexes from "./pages/SportComplexes";
import SportComplexDetails from "./pages/SportComplexDetails";
import Facilities from "./pages/Facilities";
import FacilityDetails from "./pages/FacilityDetails";

function App() {

  return (
      <AuthProvider>
          <Router>
              <Navbar />
              <Routes>
                  <Route path="/" element={<Home />} />
                  <Route
                      path="/login"
                      element={
                          <PublicOnlyRoute>
                              <Login />
                          </PublicOnlyRoute>
                      }
                  />
                  <Route
                      path="/register"
                      element={
                          <PublicOnlyRoute>
                              <Register />
                          </PublicOnlyRoute>
                      }
                  />
                  <Route
                      path="/forgot-password"
                      element={
                          <PublicOnlyRoute>
                              <ForgotPassword />
                          </PublicOnlyRoute>
                      }
                  />
                  <Route
                      path="/reset-password"
                      element={
                          <PublicOnlyRoute>
                              <ResetPassword />
                          </PublicOnlyRoute>
                      }
                  />
                  <Route
                      path="/verify-email"
                      element={
                          <PublicOnlyRoute>
                              <VerifyEmail />
                          </PublicOnlyRoute>
                      }
                  />
                  <Route
                      path="/profile"
                      element={
                          <ProtectedRoute>
                              <Profile />
                          </ProtectedRoute>
                      }
                  />
                  <Route path="/sport-complexes" element={<SportComplexes />} />
                  <Route path="/sport-complexes/:id" element={<SportComplexDetails />} />
                  <Route path="/facilities" element={<Facilities />} />
                  <Route path="/facilities/:id" element={<FacilityDetails />} />
              </Routes>
          </Router>
      </AuthProvider>
  )
}

export default App

