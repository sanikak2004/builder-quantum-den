import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import KYCSubmission from "./pages/KYCSubmission";
import KYCVerification from "./pages/KYCVerification";
import KYCHistory from "./pages/KYCHistory";
import Auth from "./pages/Auth";
import AdminKYC from "./pages/AdminKYC";
import AdminDashboard from "./pages/AdminDashboard";
import BlockchainVisualization from "./pages/BlockchainVisualization";
import WorkflowTestingDashboard from "./pages/WorkflowTesting";
import TransactionVerifier from "./pages/TransactionVerifier";
import AdminForgeryDashboard from "./pages/AdminForgeryDashboard";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/submit" element={<KYCSubmission />} />
            <Route path="/verify" element={<KYCVerification />} />
            <Route path="/history" element={<KYCHistory />} />
            <Route path="/blockchain" element={<BlockchainVisualization />} />
            <Route path="/transaction-verifier" element={<TransactionVerifier />} />
            <Route path="/auth/:mode" element={<Auth />} />
            <Route
              path="/admin"
              element={
                <AdminProtectedRoute>
                  <AdminKYC />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminProtectedRoute>
                  <AdminDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route
              path="/admin/forgery"
              element={
                <AdminProtectedRoute>
                  <AdminForgeryDashboard />
                </AdminProtectedRoute>
              }
            />
            <Route path="/workflow-testing" element={<WorkflowTestingDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

createRoot(document.getElementById("root")!).render(<App />);
