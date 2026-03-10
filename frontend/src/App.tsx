import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import ScreenPanel from './pages/ScreenPanel';
import TeamPanel from './pages/TeamPanel';
import ProfileSetup from './components/ProfileSetup';
import { useState, useEffect } from 'react';

type PanelType = 'landing' | 'admin-login' | 'screen-login' | 'team-login' | 'admin' | 'screen' | 'team';

export default function App() {
  const { identity } = useInternetIdentity();
  const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();
  const [currentPanel, setCurrentPanel] = useState<PanelType>('landing');
  const [authenticatedAs, setAuthenticatedAs] = useState<'admin' | 'screen' | 'team' | null>(null);

  const isAuthenticated = !!identity;
  const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;

  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentPanel('landing');
      setAuthenticatedAs(null);
    }
  }, [isAuthenticated]);

  const handleNavigate = (panel: PanelType) => {
    setCurrentPanel(panel);
  };

  const handleLoginSuccess = (panelType: 'admin' | 'screen' | 'team') => {
    setAuthenticatedAs(panelType);
    setCurrentPanel(panelType);
  };

  if (showProfileSetup) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
        <ProfileSetup panelType={authenticatedAs} />
        <Toaster />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <div className="min-h-screen bg-background">
        {currentPanel === 'landing' && <LandingPage onNavigate={handleNavigate} />}
        {currentPanel === 'admin-login' && (
          <LoginPage panelType="admin" onBack={() => handleNavigate('landing')} onSuccess={() => handleLoginSuccess('admin')} />
        )}
        {currentPanel === 'screen-login' && (
          <LoginPage panelType="screen" onBack={() => handleNavigate('landing')} onSuccess={() => handleLoginSuccess('screen')} />
        )}
        {currentPanel === 'team-login' && (
          <LoginPage panelType="team" onBack={() => handleNavigate('landing')} onSuccess={() => handleLoginSuccess('team')} />
        )}
        {currentPanel === 'admin' && isAuthenticated && <AdminPanel onLogout={() => handleNavigate('landing')} />}
        {currentPanel === 'screen' && isAuthenticated && <ScreenPanel onLogout={() => handleNavigate('landing')} />}
        {currentPanel === 'team' && isAuthenticated && <TeamPanel onLogout={() => handleNavigate('landing')} />}
      </div>
      <Toaster />
    </ThemeProvider>
  );
}
