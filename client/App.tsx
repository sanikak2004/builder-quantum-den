import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import KYCSubmission from "./pages/KYCSubmission";
import KYCVerification from "./pages/KYCVerification";
import KYCHistory from "./pages/KYCHistory";
import Auth from "./pages/Auth";
import AdminKYC from "./pages/AdminKYC";
import AdminProtectedRoute from "./components/AdminProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
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
          <Route path="/auth/:mode" element={<Auth />} />
          <Route path="/admin" element={
            <AdminProtectedRoute>
              <AdminKYC />
            </AdminProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
