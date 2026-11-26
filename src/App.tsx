import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui/Toast';
import { AuthProvider } from '@/features/auth/AuthContext';
import { RequireAuth } from '@/features/auth/RequireAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import ArticlesPage from '@/features/articles/ArticlesPage';
import ArticleEditorPage from '@/features/articles/ArticleEditorPage';
import AudiologistsPage from '@/features/audiologists/AudiologistsPage';
import AudiologistEditorPage from '@/features/audiologists/AudiologistEditorPage';
import ClinicsPage from '@/features/clinics/ClinicsPage';
import AppointmentsPage from '@/features/appointments/AppointmentsPage';
import PatientsPage from '@/features/patients/PatientsPage';
import { RegionsPage, ServicesPage, TopicsPage } from '@/pages/CatalogPages';
import TeamPage from '@/pages/TeamPage';
import AccountPage from '@/pages/AccountPage';
import HelpPage from '@/pages/HelpPage';
import NotFoundPage from '@/pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: '/articles', element: <ArticlesPage /> },
          { path: '/articles/new', element: <ArticleEditorPage /> },
          { path: '/articles/:id', element: <ArticleEditorPage /> },
          { path: '/audiologists', element: <AudiologistsPage /> },
          { path: '/audiologists/new', element: <AudiologistEditorPage /> },
          { path: '/audiologists/:id', element: <AudiologistEditorPage /> },
          { path: '/clinics', element: <ClinicsPage /> },
          { path: '/clinics/new', element: <ClinicsPage /> },
          { path: '/services', element: <ServicesPage /> },
          { path: '/topics', element: <TopicsPage /> },
          { path: '/regions', element: <RegionsPage /> },
          { path: '/appointments', element: <AppointmentsPage /> },
          { path: '/patients', element: <PatientsPage /> },
          { path: '/team', element: <TeamPage /> },
          { path: '/account', element: <AccountPage /> },
          { path: '/help', element: <HelpPage /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
