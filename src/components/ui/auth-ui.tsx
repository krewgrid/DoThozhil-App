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

// Sign-in: Google for everyone (workers and clients), plus email + password.
// After signing in, new people choose worker or client on /complete-profile.

function GoogleLoginButton({ label = "Continue with Google", divider = true }: { label?: string; divider?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const handleGoogle = async () => {
    setLoading(true);
    setErr('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/login' },
    });
    if (error) { setErr(error.message); setLoading(false); }
  };
  return (
    <div className="grid gap-2 w-full mt-2">
      {divider && (
        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
      )}
      <Button
        type="button"
        className="w-full font-semibold bg-white text-zinc-900 hover:bg-gray-100 border border-gray-300 transition-colors"
        onClick={handleGoogle}
        disabled={loading}
      >
        <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        {loading ? "Opening Google…" : label}
      </Button>
      {err && <p className="text-sm text-red-400">{err}</p>}
    </div>
  );
}

function EmailForm({ mode }: { mode: "signIn" | "signUp" }) {
  const [errorMsg, setErrorMsg] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(''); setInfo('');
    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!supabase) { setErrorMsg('Database connection error. Missing configuration.'); return; }
    setLoading(true);
    if (mode === "signIn") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setErrorMsg(error.message);
      // On success the session listener sends the person to their dashboard.
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + '/login' } });
      if (error) setErrorMsg(error.message);
      else if (!data.session) setInfo('Check your email to confirm your account, then sign in.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col gap-6">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" />
        </div>
        <PasswordInput name="password" label={mode === "signIn" ? "Password" : "Create password"} required minLength={6}
          autoComplete={mode === "signIn" ? "current-password" : "new-password"} placeholder="Password" />
        {errorMsg && <p className="text-sm text-red-500">{errorMsg}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}
        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>
          {loading ? 'Please wait…' : mode === "signIn" ? 'Sign In' : 'Create account'}
        </Button>
      </div>
    </form>
  );
}

export type AuthMode = "signIn" | "signUp";

function AuthFormContainer({ mode, setMode }: { mode: AuthMode; setMode: (mode: AuthMode) => void }) {
  return (
    <div className="mx-auto grid w-full max-w-[350px] gap-2">
      <div className="flex flex-col items-center gap-2 text-center mb-4">
        <h1 className="text-2xl font-bold">{mode === "signIn" ? "Sign in to your account" : "Join krewgrid"}</h1>
        <p className="text-balance text-sm text-muted-foreground">
          {mode === "signIn"
            ? "Event work in Kochi, paid in full."
            : "Workers and clients both start here, then choose. New workers get 5 free slots."}
        </p>
      </div>
      {mode === "signUp" && <GoogleLoginButton label="Sign up with Google" divider={false} />}
      {mode === "signUp" && (
        <div className="relative my-3">
          <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
          <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">Or with email</span></div>
        </div>
      )}
      <EmailForm mode={mode} />
      {mode === "signIn" && <GoogleLoginButton />}
      <div className="text-center text-sm mt-4">
        {mode === "signIn" ? (
          <>Don't have an account?{" "}
            <Button variant="link" className="pl-1 text-foreground" onClick={() => setMode("signUp")}>Sign up</Button></>
        ) : (
          <>Already have an account?{" "}
            <Button variant="link" className="pl-1 text-foreground" onClick={() => setMode("signIn")}>Sign in</Button></>
        )}
      </div>
    </div>
  );
}

type Stats = { city?: string; workers?: number | null; today?: number | null; by_skill?: Record<string, number> | null };

export function AuthUI({ initialMode = "signIn", error }: { initialMode?: AuthMode; error?: string | null }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!supabase) { setStats({}); return; }
    supabase.rpc('public_stats').then(({ data }: { data: Stats | null }) => setStats(data ?? {}));
  }, []);

  const city = stats?.city ?? "Kochi";
  const skills = Object.entries(stats?.by_skill ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

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

      <div className="flex flex-col min-h-screen items-center justify-center p-6 md:p-0 md:py-12 bg-background">
        {error && <p className="mb-4 max-w-[350px] text-sm text-red-400 text-center">{error}</p>}
        <AuthFormContainer mode={mode} setMode={setMode} />
      </div>

      {/* Right Side Fill Green Gradient */}
      <div className="hidden md:flex relative bg-gradient-to-br from-emerald-400 to-emerald-900 transition-all duration-500 ease-in-out items-center justify-center flex-col p-12">
        {stats && (stats.workers != null ? (
          <div className="flex flex-col items-center justify-center space-y-6 w-full max-w-sm">
            <div className="text-center space-y-2">
              <p className="text-xs uppercase tracking-widest text-white/80 font-semibold">Live in {city}</p>
              <p className="text-3xl font-bold text-white drop-shadow-sm">
                <Typewriter key={stats.workers} text={`${stats.workers.toLocaleString("en-IN")} workers joined`} speed={50} />
              </p>
              <p className="text-lg text-white/80 font-medium">{stats.today} joined today. Be part of the fastest growing marketplace.</p>
            </div>
            <div className="w-full space-y-2">
              {skills.map(([n, v]) => (
                <div key={n} className="grid grid-cols-[1fr_2fr_auto] items-center gap-3 text-sm text-white/90">
                  <span>{n}</span>
                  <div className="h-1.5 rounded-full bg-black/20 overflow-hidden"><div className="h-full bg-white/90" style={{ width: `${(v / (skills[0]?.[1] || 1)) * 100}%` }} /></div>
                  <span className="tabular-nums">{v}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-sm text-white space-y-5">
            <p className="text-xs uppercase tracking-widest text-white/80 font-semibold">How it works · {city}</p>
            <p className="text-3xl font-bold leading-tight drop-shadow-sm">Event work, paid in full.</p>
            <ol className="space-y-3 list-decimal pl-5 text-white/90">
              <li><b>Client posts work</b> with date, pay, hours and the payment date.</li>
              <li><b>Workers apply</b> using a slot. Rejected or cancelled? The slot comes back.</li>
              <li><b>Check in with an OTP</b> at the venue, check out with a photo.</li>
              <li><b>Both sides rate</b> each other. Reliable workers level up: Blue, Silver, Gold.</li>
            </ol>
            <p className="text-sm text-white/75">No agents, no commission. ₹550 through a contractor becomes ₹1,000+ paid straight to you.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
