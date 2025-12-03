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
                      path="/profile"
                      element={
                          <ProtectedRoute>
                              <Profile />
                          </ProtectedRoute>
                      }
                  />
              </Routes>
          </Router>
      </AuthProvider>
  )
}

export default App
