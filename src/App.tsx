import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Context Providers
import { AuthProvider } from "./context/AuthContext";
import { ProviderAuthProvider } from "./context/ProviderAuthContext";
import { ThemeProvider } from "./context/ThemeContext";

// Components
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ProviderProtectedRoute from "./components/provider/ProviderProtectedRoute";
import MainLayout from "./components/layout/MainLayout";
import ProviderLayout from "./components/provider/ProviderLayout";

// Pages
import LoginPage from "./pages/LoginPage";
import ProviderLoginPage from "./pages/provider/ProviderLoginPage";
import DashboardPage from "./pages/DashboardPage";
import NotFound from "./pages/NotFound";

// Providers Pages (create placeholders for now)
import ProvidersPage from "./pages/ProvidersPage";
import CreateProviderPage from "./pages/CreateProviderPage";
import EditProviderPage from "./pages/EditProviderPage";

// Jobs Pages
import JobsPage from "./pages/JobsPage";
import CreateJobPage from "./pages/CreateJobPage";
import EditJobPage from "./pages/EditJobPage";
import JobDetailPage from "./pages/JobDetailPage";

// Categories Pages
import CategoriesPage from "./pages/CategoriesPage";

// Other placeholder pages
import AdminsPage from "./pages/AdminsPage";
import CreateAdminPage from "./pages/CreateAdminPage";
import CustomersPage from "./pages/CustomersPage";
import BlogsPage from "./pages/BlogsPage";
import CreateBlogPage from "./pages/CreateBlogPage";
import EditBlogPage from "./pages/EditBlogPage";
import BlogDetailPage from "./pages/BlogDetailPage";

// Provider Pages
import ProviderDashboard from "./pages/provider/ProviderDashboard";
import ProviderProfilePage from "./pages/provider/ProviderProfilePage";
import ProviderListingsPage from "./pages/provider/ProviderListingsPage";
import ProviderListingCreatePage from "./pages/provider/ProviderListingCreatePage";
import ProviderListingViewPage from "./pages/provider/ProviderListingViewPage";
import ProviderListingEditPage from "./pages/provider/ProviderListingEditPage";
import ProviderListingPhotosPage from "./pages/provider/ProviderListingPhotosPage";
import ProviderPhotosPage from "./pages/provider/ProviderPhotosPage";
import ProviderAnalyticsPage from "./pages/provider/ProviderAnalyticsPage";
import ProviderDocumentsPage from "./pages/provider/ProviderDocumentsPage";
import ProviderSettingsPage from "./pages/provider/ProviderSettingsPage";
import ApprovalsPage from "./pages/ApprovalsPage";
import EmailTemplatesPage from "./pages/EmailTemplatesPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import EnquiriesPage from "./pages/EnquiriesPage";
import NewsletterPage from "./pages/NewsletterPage";
import BookingsPage from "./pages/BookingsPage";
import BookingDetailPage from "./pages/BookingDetailPage";
import CreateBookingPage from "./pages/CreateBookingPage";
import ContractsPage from "./pages/ContractsPage";
import ContractDetailPage from "./pages/ContractDetailPage";
import CreateContractPage from "./pages/CreateContractPage";
import VesselsPage from "./pages/VesselsPage";
import VesselDetailPage from "./pages/VesselDetailPage";
import CreateVesselPage from "./pages/CreateVesselPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import CreateProjectPage from "./pages/CreateProjectPage";
import SocialLinksPage from "./pages/SocialLinksPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ProviderAuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/provider/login" element={<ProviderLoginPage />} />
              
              {/* Protected Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardPage />} />
                
                {/* Admin Management */}
                <Route
                  path="admins"
                  element={
                    <ProtectedRoute roles={['superadmin']}>
                      <AdminsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="admins/create"
                  element={
                    <ProtectedRoute roles={['superadmin']}>
                      <CreateAdminPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Customer Management */}
                <Route
                  path="customers"
                  element={
                    <ProtectedRoute roles={['superadmin']}>
                      <CustomersPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Provider Management */}
                <Route path="providers" element={<ProvidersPage />} />
                <Route path="providers/create" element={<CreateProviderPage />} />
                <Route path="providers/:id/edit" element={<EditProviderPage />} />
                
                {/* Job Management */}
                <Route path="jobs" element={<JobsPage />} />
                <Route path="jobs/create" element={<CreateJobPage />} />
                <Route path="jobs/:id" element={<JobDetailPage />} />
                <Route path="jobs/:id/edit" element={<EditJobPage />} />
                
                {/* Categories */}
                <Route path="categories" element={<CategoriesPage />} />
                
                {/* Blogs */}
                <Route path="blogs" element={<BlogsPage />} />
                <Route path="blogs/create" element={<CreateBlogPage />} />
                <Route path="blogs/:id" element={<BlogDetailPage />} />
                <Route path="blogs/:id/edit" element={<EditBlogPage />} />
                
                {/* Approvals */}
                <Route path="approvals" element={<ApprovalsPage />} />
                
                {/* Enquiries */}
                <Route path="enquiries" element={<EnquiriesPage />} />
                
                {/* Newsletter */}
                <Route path="newsletter" element={<NewsletterPage />} />
                
                {/* Bookings */}
                <Route path="bookings" element={<BookingsPage />} />
                <Route path="bookings/create" element={<CreateBookingPage />} />
                <Route path="bookings/:id" element={<BookingDetailPage />} />
                
                {/* Contracts */}
                <Route path="contracts" element={<ContractsPage />} />
                <Route path="contracts/create" element={<CreateContractPage />} />
                <Route path="contracts/:id" element={<ContractDetailPage />} />
                
                {/* Vessels */}
                <Route path="vessels" element={<VesselsPage />} />
                <Route path="vessels/create" element={<CreateVesselPage />} />
                <Route path="vessels/:id" element={<VesselDetailPage />} />
                
                {/* Projects */}
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="projects/create" element={<CreateProjectPage />} />
                <Route path="projects/:id" element={<ProjectDetailPage />} />
                
                {/* Social Links */}
                <Route path="social-links" element={<SocialLinksPage />} />
                
                {/* Email Templates */}
                <Route path="email-templates" element={<EmailTemplatesPage />} />
                
                {/* Analytics */}
                <Route path="analytics" element={<AnalyticsPage />} />
                
                {/* Settings */}
                <Route
                  path="settings/*"
                  element={
                    <ProtectedRoute roles={['superadmin']}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />
                
                {/* Profile */}
                <Route path="profile" element={<ProfilePage />} />
              </Route>

              {/* Provider Routes */}
              <Route
                path="/provider"
                element={
                  <ProviderProtectedRoute>
                    <ProviderLayout />
                  </ProviderProtectedRoute>
                }
              >
                <Route path="dashboard" element={<ProviderDashboard />} />
                <Route path="profile" element={<ProviderProfilePage />} />
                <Route path="listings" element={<ProviderListingsPage />} />
                <Route path="listings/create" element={<ProviderListingCreatePage />} />
                <Route path="listings/:id" element={<ProviderListingViewPage />} />
                <Route path="listings/:id/edit" element={<ProviderListingEditPage />} />
                <Route path="listings/:id/photos" element={<ProviderListingPhotosPage />} />
                <Route path="photos" element={<ProviderPhotosPage />} />
                <Route path="analytics" element={<ProviderAnalyticsPage />} />
                <Route path="documents" element={<ProviderDocumentsPage />} />
                <Route path="settings" element={<ProviderSettingsPage />} />
              </Route>
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ProviderAuthProvider>
    </AuthProvider>
  </ThemeProvider>
</QueryClientProvider>
);

export default App;
