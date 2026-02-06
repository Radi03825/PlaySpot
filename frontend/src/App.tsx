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
import EditFacility from "./pages/EditFacility";
import ManageFacilities from "./pages/ManageFacilities";
import BecomeManager from "./pages/BecomeManager";
import AdminPanel from "./pages/AdminPanel";
import MyActivity from "./pages/MyActivity";
import Events from "./pages/Events";
import EventDetails from "./pages/EventDetails";
import CreateEventForm from "./pages/CreateEventForm";
import EditEventForm from "./pages/EditEventForm";
import FacilityBookings from "./pages/FacilityBookings";

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
                            path="/my-activity"
                            element={
                                <ProtectedRoute>
                                    <MyActivity />
                                </ProtectedRoute>
                            }
                        />
                        {/* Legacy route - redirect to new my-activity page */}
                        <Route
                            path="/my-bookings"
                            element={
                                <ProtectedRoute>
                                    <MyActivity />
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

                        {/* Events routes - public viewing */}
                        <Route path="/events" element={<Events />} />
                        <Route path="/events/:id" element={<EventDetails />} />

                        {/* Protected facility edit route */}
                        <Route
                            path="/facilities/:id/edit"
                            element={
                                <ProtectedRoute>
                                    <EditFacility />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected facility bookings route */}
                        <Route
                            path="/facilities/:id/bookings"
                            element={
                                <ProtectedRoute>
                                    <FacilityBookings />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected event routes */}
                        <Route
                            path="/events/create"
                            element={
                                <ProtectedRoute>
                                    <CreateEventForm />
                                </ProtectedRoute>
                            }
                        />
                        <Route
                            path="/events/:id/edit"
                            element={
                                <ProtectedRoute>
                                    <EditEventForm />
                                </ProtectedRoute>
                            }
                        />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
}

export default App;

