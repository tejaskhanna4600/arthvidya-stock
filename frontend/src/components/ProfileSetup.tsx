import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

interface ProfileSetupProps {
  panelType: 'admin' | 'screen' | 'team' | null;
}

export default function ProfileSetup({ panelType }: ProfileSetupProps) {
  const [name, setName] = useState('');
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  const teamName = panelType === 'team' ? identity?.teamName ?? '' : undefined;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveProfile.mutateAsync({
        name,
        teamName: teamName ? teamName : null
      });
      toast.success('Profile saved');
    } catch (error) {
      toast.error('Failed to save profile');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Setup Your Profile</CardTitle>
          <CardDescription>Please provide your name to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Your Name</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>
            {panelType === 'team' && teamName && (
              <div className="space-y-2">
                <Label>Team</Label>
                <div className="px-3 py-2 rounded-md bg-muted text-sm font-medium">{teamName}</div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
              {saveProfile.isPending ? 'Saving...' : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
