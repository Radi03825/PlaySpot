import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicOnlyRoute from "./components/PublicOnlyRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import Profile from "./pages/Profile";
import SportComplexes from "./pages/SportComplexes";
import SportComplexDetails from "./pages/SportComplexDetails";
import Facilities from "./pages/Facilities";
import FacilityDetails from "./pages/FacilityDetails";
import ManageFacilities from "./pages/ManageFacilities";
import BecomeManager from "./pages/BecomeManager";
import AdminPanel from "./pages/AdminPanel";
import MyBookings from "./pages/MyBookings";

function App() {
    return (
        <AuthProvider>
            <Router>
                <div className="App">
                    <Navbar />
                    <Routes>
                        {/* Public routes */}
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
                        <Route path="/reset-password" element={<ResetPassword />} />
                        <Route path="/verify-email" element={<VerifyEmail />} />

                        {/* Protected routes */}
                        <Route
                            path="/profile"
                            element={
                                <ProtectedRoute>
                                    <Profile />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/my-bookings"
                            element={
                                <ProtectedRoute>
                                    <MyBookings />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/manage-facilities"
                            element={
                                <ProtectedRoute>
                                    <ManageFacilities />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/become-manager"
                            element={
                                <ProtectedRoute>
                                    <BecomeManager />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/admin"
                            element={
                                <ProtectedRoute>
                                    <AdminPanel />
                                </ProtectedRoute>
                            }
                        />

                        {/* Public browsing routes */}
                        <Route path="/sport-complexes" element={<SportComplexes />} />
                        <Route path="/sport-complexes/:id" element={<SportComplexDetails />} />
                        <Route path="/facilities" element={<Facilities />} />
                        <Route path="/facilities/:id" element={<FacilityDetails />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;

