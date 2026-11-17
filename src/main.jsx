import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import './styles.css';
import { ProfilesProvider } from './lib/store.jsx';
import { AuthProvider } from './lib/auth.jsx';
import ChatPage from './pages/ChatPage.jsx';
import AccountPage from './pages/AccountPage.jsx';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Profiles from './pages/Profiles.jsx';
import ChartPage from './pages/ChartPage.jsx';
import DashaPage from './pages/DashaPage.jsx';
import PanchangPage from './pages/PanchangPage.jsx';
import DoshaPage from './pages/DoshaPage.jsx';
import MatchingPage from './pages/MatchingPage.jsx';
import NotFound from './pages/NotFound.jsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'profiles', element: <Profiles /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'account', element: <AccountPage /> },
      { path: 'chart', element: <ChartPage /> },
      { path: 'dasha', element: <DashaPage /> },
      { path: 'panchang', element: <PanchangPage /> },
      { path: 'doshas', element: <DoshaPage /> },
      { path: 'matching', element: <MatchingPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
], { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProfilesProvider>
        <RouterProvider router={router} />
      </ProfilesProvider>
    </AuthProvider>
  </StrictMode>,
);
