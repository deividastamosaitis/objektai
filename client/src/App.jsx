import { Routes, Route, Navigate } from "react-router-dom";
import AuthPage from "./pages/AuthPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Account from "./pages/Account.jsx";
import JobsCreate from "./pages/JobsCreate.jsx";
import JobsEdit from "./pages/JobsEdit.jsx";
import JobsList from "./pages/JobsList.jsx";
import JobDetails from "./pages/JobDetails.jsx";
//SUTARTYS
import SutartysList from "./pages/SutartysList.jsx";
import SutartysCreate from "./pages/SutartysCreate.jsx";
import SutartisSign from "./pages/SutartisSign.jsx";
import SutartisSuccess from "./pages/SutartisSuccess.jsx";

import ProtectedRoute from "./routes/ProtectedRoute.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <ProtectedRoute>
              <JobDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/create"
          element={
            <ProtectedRoute>
              <JobsCreate />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs/:id/edit"
          element={
            <ProtectedRoute>
              <JobsEdit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sutartys"
          element={
            <ProtectedRoute>
              <SutartysList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sutartys/create"
          element={
            <ProtectedRoute>
              <SutartysCreate />
            </ProtectedRoute>
          }
        />
        <Route path="/sutartis/:id" element={<SutartisSign />} />
        <Route path="/sutartys/success/:id" element={<SutartisSuccess />} />
        <Route path="*" element={<div className="p-6">404</div>} />
      </Routes>
    </AuthProvider>
  );
}
