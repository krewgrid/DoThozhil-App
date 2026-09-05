import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const CompleteProfile = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
      } else {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        if (profile && profile.role) {
          if (profile.role === 'client') navigate('/client/home');
          else if (profile.role === 'admin') navigate('/control-centre/dashboard');
          else navigate('/worker/home');
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username');
    const contact = formData.get('contact');
    const whatsapp = formData.get('whatsapp');
    const referral = formData.get('referral');

    try {
      const { data: isAvailable } = await supabase.rpc('check_username_available', { check_username: username });
      if (!isAvailable) {
        throw new Error('Username is already taken. Please choose another.');
      }

      const initialSlots = (role === 'worker' && referral) ? 10 : (role === 'worker' ? 5 : 0);

      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          username: username,
          role: role,
          contact: contact,
          whatsapp: whatsapp,
          referral_code: role === 'worker' ? Math.random().toString(36).substring(2, 8).toUpperCase() : null,
          slots: initialSlots
        });

      if (profileError) throw profileError;

      if (role === 'worker' && referral) {
        await supabase.rpc('reward_referrer', { ref_code: referral });
      }

      localStorage.setItem('krewgrid_username', username);
      localStorage.setItem('krewgrid_role', role);

      if (role === 'client') navigate('/client/home');
      else navigate('/worker/home');

    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete profile.');
    } finally {
      setLoading(false);
    }
  };

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground font-sans p-6">
        <div className="mx-auto grid w-full max-w-[400px] gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold">Almost there!</h1>
            <p className="text-balance text-sm text-muted-foreground">Select how you want to use krewgrid</p>
          </div>
          <div className="grid gap-4">
            <Button variant="outline" className="h-auto py-4 justify-start px-6" onClick={() => setRole("client")}>
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-lg">I am a Client</span>
                <span className="text-sm font-normal text-muted-foreground mt-1">I want to hire workers for my event</span>
              </div>
            </Button>
            <Button variant="outline" className="h-auto py-4 justify-start px-6" onClick={() => setRole("worker")}>
              <div className="flex flex-col items-start text-left">
                <span className="font-semibold text-lg">I am a Worker</span>
                <span className="text-sm font-normal text-muted-foreground mt-1">I want to find jobs for events</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground font-sans p-6">
      <div className="mx-auto grid w-full max-w-[350px] gap-8">
        <div className="flex flex-col items-start gap-2 text-left">
          <h1 className="text-3xl font-bold">Complete your profile</h1>
          <p className="text-balance text-sm text-muted-foreground">Just a few more details to get started.</p>
        </div>
        {errorMsg && (
          <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 break-words">
            {errorMsg}
          </div>
        )}
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" type="text" placeholder="Choose a unique username" required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact">Contact number</Label>
            <Input id="contact" name="contact" type="tel" defaultValue="+91 " required />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp number</Label>
            <Input id="whatsapp" name="whatsapp" type="tel" defaultValue="+91 " required />
          </div>
          {role === 'worker' && (
            <div className="grid gap-2">
              <Label htmlFor="referral">Referral Code (Optional)</Label>
              <Input id="referral" name="referral" type="text" placeholder="e.g. A9X3F1" />
            </div>
          )}
          <Button type="submit" className="mt-4 w-full" disabled={loading}>
            {loading ? 'Saving...' : 'Finish Setup'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CompleteProfile;
