import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface LoginPageProps {
  panelType: 'admin' | 'screen' | 'team';
  onBack: () => void;
  onSuccess: () => void;
}

const CREDENTIALS = {
  admin: { id: 'Tejas10', password: '4600' },
  screen: { id: 'Tejas10', password: '4600' },
  team: { id: 'Team1', password: 'Team1' }
};

export default function LoginPage({ panelType, onBack, onSuccess }: LoginPageProps) {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const { login, loginStatus } = useInternetIdentity();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (panelType === 'team') {
      const teamName = id.trim();
      if (!teamName) {
        toast.error('Enter your team name');
        return;
      }
      const pw = (password || 'Team1').trim();
      try {
        await login(panelType, teamName, pw || 'Team1', teamName);
        toast.success('Login successful');
        onSuccess();
      } catch (err: any) {
        const msg = err?.message || '';
        toast.error(msg.includes('Team not found') ? 'Team not found. Ask admin to create your team first (Admin → Teams).' : (msg || 'Invalid credentials. Password: Team1 (or your team name).'));
      }
      return;
    }

    const credentials = CREDENTIALS[panelType];
    if (id !== credentials.id || password !== credentials.password) {
      toast.error('Invalid credentials');
      return;
    }

    try {
      await login(panelType, id, password);
      toast.success('Login successful');
      onSuccess();
    } catch (err: any) {
      toast.error(err?.message || 'Login failed');
    }
  };

  const isLoading = loginStatus === 'logging-in';

  const panelTitles = {
    admin: 'Admin Control Panel',
    screen: 'Screen Panel',
    team: 'Team Panel'
  };

  const panelDescriptions = {
    admin: 'Enter admin credentials to continue',
    screen: 'Enter screen credentials to continue',
    team: 'Enter your exact team name (created by Admin → Teams). Password: Team1 (or your team name).'
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0c0f1a] via-[#0e1220] to-[#080b14] p-4 font-sans">
      <div className="absolute inset-0 bg-[url('/assets/generated/stock-chart-bg.dim_800x600.png')] bg-cover bg-center opacity-[0.06]" />
      
      <Card className="w-full max-w-md relative z-10 border-2 border-chart-1/30 bg-card/95 shadow-xl shadow-chart-1/10">
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute top-4 left-4 w-8 h-8 p-0 hover:bg-chart-1/10"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="text-2xl font-display font-bold text-center text-chart-1">{panelTitles[panelType]}</CardTitle>
          <CardDescription className="text-center font-sans">{panelDescriptions[panelType]}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="id">{panelType === 'team' ? 'Team Name' : 'ID'}</Label>
              <Input
                id="id"
                type="text"
                value={id}
                onChange={(e) => setId(e.target.value)}
                placeholder={panelType === 'team' ? 'e.g. Team Alpha' : 'Enter your ID'}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required={panelType !== 'team'}
              />
            </div>
            <Button type="submit" className="w-full font-display font-semibold bg-chart-1 hover:bg-chart-1/90" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
