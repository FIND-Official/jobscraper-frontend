import { Toaster } from "@/components/ui/toaster";
import Cleanup from "./pages/Cleanup";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompanyAuthProvider } from "@/contexts/CompanyAuthContext";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Account from "./pages/Account";
import ResetPassword from "./pages/ResetPassword";
import Auth from "./pages/Auth";
import Partnership from "./pages/Partnership";
import CompanyAuth from "./pages/CompanyAuth";
import CompanyOnboarding from "./pages/CompanyOnboarding";
import CompanyDashboard from "./pages/CompanyDashboard";
import { SavedJobsProvider } from "./contexts/SavedJobsContext";


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CompanyAuthProvider>
        <SavedJobsProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/account" element={<Account />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/cleanup" element={<Cleanup />} />
              <Route path="/partnership" element={<Partnership />} />
              <Route path="/company/auth" element={<CompanyAuth />} />
              <Route path="/company/signup" element={<CompanyAuth initialMode="signup" />} />
              <Route path="/company/signin" element={<CompanyAuth initialMode="signin" />} />
              <Route path="/company/login" element={<CompanyAuth initialMode="signin" />} />
              <Route path="/company/onboarding" element={<CompanyOnboarding />} />
              <Route path="/company/dashboard" element={<CompanyDashboard />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </SavedJobsProvider>
      </CompanyAuthProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
