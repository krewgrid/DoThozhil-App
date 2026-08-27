import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Typewriter } from "./typewriter-text";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input dark:border-input/50 bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-input dark:border-input/50 bg-background px-3 py-3 text-sm text-foreground shadow-sm shadow-black/5 transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, label, ...props }, ref) => {
    const id = useId();
    const [showPassword, setShowPassword] = useState(false);
    const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
    return (
      <div className="grid w-full items-center gap-2">
        {label && <Label htmlFor={id}>{label}</Label>}
        <div className="relative">
          <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
          <button type="button" onClick={togglePasswordVisibility} className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50" aria-label={showPassword ? "Hide password" : "Show password"}>
            {showPassword ? (<EyeOff className="size-4" aria-hidden="true" />) : (<Eye className="size-4" aria-hidden="true" />)}
          </button>
        </div>
      </div>
    );
  }
);
PasswordInput.displayName = "PasswordInput";

import { supabase } from '@/lib/supabase';

function SignInForm({ onLogin }: { onLogin: (role: "client" | "worker" | "admin") => void }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => { 
    event.preventDefault(); 
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    const userMeta = data.user?.user_metadata || {};
    const storedName = userMeta.username || email.split('@')[0];
    let storedRole = userMeta.role || 'client';
    
    // Always check the actual profile in the database since roles can change (e.g. bans)
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    if (profile && profile.role) {
      storedRole = profile.role;
    }
    
    if (email === 'krewgrid.admin@gmail.com') {
      storedRole = 'admin';
    }

    if (storedRole === 'banned') {
      await supabase.auth.signOut();
      setErrorMsg('Your account has been banned. Please contact support.krewgrid@gmail.com');
      setLoading(false);
      return;
    }

    localStorage.setItem('krewgrid_username', storedName);
    localStorage.setItem('krewgrid_role', storedRole);
    
    onLogin(storedRole as "client" | "worker" | "admin");
  };
  return (
    <form onSubmit={handleSignIn} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-2 text-left">
        <h1 className="text-3xl font-bold">Sign in to your account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your email below to sign in</p>
      </div>
      {errorMsg && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
          {errorMsg}
        </div>
      )}
      <div className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="m@example.com" required autoComplete="email" /></div>
        <PasswordInput name="password" label="Password" required autoComplete="current-password" placeholder="Password" />
        <Button type="submit" className="mt-2 w-full" disabled={loading}>{loading ? 'Signing In...' : 'Sign In'}</Button>
      </div>
    </form>
  );
}

function ClientSignUpForm({ onLogin }: { onLogin: (role: "client" | "worker" | "admin") => void }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => { 
    event.preventDefault(); 
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          role: 'client'
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    let storedRole = 'client';
    if (email === 'krewgrid.admin@gmail.com') {
      storedRole = 'admin';
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user?.id,
        username: username,
        role: storedRole,
        contact: formData.get("contact") as string,
        whatsapp: formData.get("whatsapp") as string
      });
      
    if (profileError) {
      console.error("Failed to create profile:", profileError);
      // Non-blocking error for now
    }

    localStorage.setItem('krewgrid_username', username || email.split('@')[0]);
    localStorage.setItem('krewgrid_role', storedRole);
    
    onLogin(storedRole as "client" | "worker" | "admin");
  };
  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-2 text-left">
        <h1 className="text-3xl font-bold">Create Client account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your details below to sign up</p>
      </div>
      {errorMsg && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
          {errorMsg}
        </div>
      )}
      <div className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="email-client">Email address</Label><Input id="email-client" name="email" type="email" placeholder="m@example.com" required autoComplete="email" /></div>
        <div className="grid gap-2"><Label htmlFor="username-client">Username</Label><Input id="username-client" name="username" type="text" defaultValue="c_" required /></div>
        <div className="grid gap-2"><Label htmlFor="contact-client">Contact number</Label><Input id="contact-client" name="contact" type="tel" defaultValue="+91 " required /></div>
        <div className="grid gap-2"><Label htmlFor="whatsapp-client">WhatsApp number</Label><Input id="whatsapp-client" name="whatsapp" type="tel" defaultValue="+91 " required /></div>
        <PasswordInput name="password" label="Create password" required autoComplete="new-password" placeholder="Password"/>
        <Button type="submit" className="mt-2 w-full" disabled={loading}>{loading ? 'Signing Up...' : 'Sign up'}</Button>
      </div>
    </form>
  );
}

function WorkerSignUpForm({ onLogin }: { onLogin: (role: "client" | "worker" | "admin") => void }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => { 
    event.preventDefault(); 
    setLoading(true);
    setErrorMsg('');
    const formData = new FormData(event.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const username = formData.get("username") as string;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username,
          role: 'worker'
        }
      }
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    let storedRole = 'worker';
    if (email === 'krewgrid.admin@gmail.com') {
      storedRole = 'admin';
    }

    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user?.id,
        username: username,
        role: storedRole,
        contact: formData.get("contact") as string,
        whatsapp: formData.get("whatsapp") as string
      });

    if (profileError) {
      console.error("Failed to create profile:", profileError);
    }

    localStorage.setItem('krewgrid_username', username || email.split('@')[0]);
    localStorage.setItem('krewgrid_role', storedRole);
    
    onLogin(storedRole as "client" | "worker" | "admin");
  };
  return (
    <form onSubmit={handleSignUp} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-2 text-left">
        <h1 className="text-3xl font-bold">Create Worker account</h1>
        <p className="text-balance text-sm text-muted-foreground">Enter your details below to sign up</p>
      </div>
      {errorMsg && (
        <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
          {errorMsg}
        </div>
      )}
      <div className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="email-worker">Email address</Label><Input id="email-worker" name="email" type="email" placeholder="m@example.com" required autoComplete="email" /></div>
        <div className="grid gap-2"><Label htmlFor="username-worker">Username</Label><Input id="username-worker" name="username" type="text" defaultValue="w_" required /></div>
        <div className="grid gap-2"><Label htmlFor="contact-worker">Contact number</Label><Input id="contact-worker" name="contact" type="tel" defaultValue="+91 " required /></div>
        <div className="grid gap-2"><Label htmlFor="whatsapp-worker">WhatsApp number</Label><Input id="whatsapp-worker" name="whatsapp" type="tel" defaultValue="+91 " required /></div>
        <PasswordInput name="password" label="Create password" required autoComplete="new-password" placeholder="Password"/>
        <div className="grid gap-2"><Label htmlFor="referral-worker">Referral code <span className="text-muted-foreground font-normal">(optional)</span></Label><Input id="referral-worker" name="referral" type="text" placeholder="Code" /></div>
        <Button type="submit" className="mt-2 w-full" disabled={loading}>{loading ? 'Signing Up...' : 'Sign up'}</Button>
      </div>
    </form>
  );
}

function RoleSelection({ onSelectRole }: { onSelectRole: (role: "client" | "worker") => void }) {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-start gap-2 text-left">
        <h1 className="text-3xl font-bold">Join as a client or worker</h1>
        <p className="text-balance text-sm text-muted-foreground">Select how you want to use the platform</p>
      </div>
      <div className="grid gap-4">
        <Button variant="outline" className="h-auto py-4 justify-start px-6" onClick={() => onSelectRole("client")}>
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-lg">I am a Client</span>
            <span className="text-sm font-normal text-muted-foreground mt-1">I want to hire workers for my event</span>
          </div>
        </Button>
        <Button variant="outline" className="h-auto py-4 justify-start px-6" onClick={() => onSelectRole("worker")}>
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold text-lg">I am a Worker</span>
            <span className="text-sm font-normal text-muted-foreground mt-1">I want to find jobs for events</span>
          </div>
        </Button>
      </div>
    </div>
  );
}

export type AuthMode = "signIn" | "roleSelection" | "signUpClient" | "signUpWorker";

function AuthFormContainer({ mode, setMode, onLogin }: { mode: AuthMode; setMode: (mode: AuthMode) => void; onLogin?: (role: "client" | "worker" | "admin") => void; }) {
    return (
        <div className="mx-auto grid w-[350px] gap-2">
            {mode === "signIn" && <SignInForm onLogin={onLogin || (() => {})} />}
            {mode === "roleSelection" && <RoleSelection onSelectRole={(role) => setMode(role === "client" ? "signUpClient" : "signUpWorker")} />}
            {mode === "signUpClient" && <ClientSignUpForm onLogin={onLogin || (() => {})} />}
            {mode === "signUpWorker" && <WorkerSignUpForm onLogin={onLogin || (() => {})} />}

            <div className="text-center text-sm mt-4">
                {mode === "signIn" ? (
                    <>
                        Don't have an account?{" "}
                        <Button variant="link" className="pl-1 text-foreground" onClick={() => setMode("roleSelection")}>
                            Sign up
                        </Button>
                    </>
                ) : (
                    <>
                        Already have an account?{" "}
                        <Button variant="link" className="pl-1 text-foreground" onClick={() => setMode("signIn")}>
                            Sign in
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

export function AuthUI({ onLogin }: { onLogin?: (role: "client" | "worker" | "admin") => void }) {
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [workerCount, setWorkerCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'worker');
      if (count !== null) {
        setWorkerCount(count);
      }
    }
    fetchCount();
  }, []);

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2 relative font-sans">
      <style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
      
      {/* krewgrid logo text */}
      <div className="absolute top-6 left-8 z-20">
        <span className="text-2xl font-bold tracking-tight">krewgrid</span>
      </div>

      <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12 bg-background">
        <AuthFormContainer mode={mode} setMode={setMode} onLogin={onLogin} />
      </div>

      {/* Right Side Fill Grey */}
      <div className="hidden md:flex relative bg-zinc-100 dark:bg-zinc-900 transition-all duration-500 ease-in-out items-center justify-center flex-col">
        <div className="flex flex-col items-center justify-center space-y-6">
            <div className="flex -space-x-3">
                <img className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-900 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80" alt="User" />
                <img className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-900 object-cover" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80" alt="User" />
                <img className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-900 object-cover" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80" alt="User" />
                <img className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-900 object-cover" src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=150&q=80" alt="User" />
                <div className="w-14 h-14 rounded-full border-2 border-white dark:border-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-sm font-semibold">
                    +{workerCount}
                </div>
            </div>
            <div className="text-center space-y-2">
                <p className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">
                    <Typewriter text={`${workerCount} workers joined`} speed={50} />
                </p>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Be part of the fastest growing marketplace.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
