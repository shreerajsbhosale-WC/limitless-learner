import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2, Mail, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/Logo";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Limitless" },
      { name: "description", content: "Sign in to Limitless with a one-time code sent to your email, or continue with Google." },
      { property: "og:title", content: "Sign in — Limitless" },
      { property: "og:description", content: "Secure one-time-code sign in for your Limitless study library." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (user) navigate({ to: "/library" });
  }, [user, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleGoogle = async () => {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error(result.error.message || "Google sign in failed");
      setBusy(false);
    }
  };

  const sendCode = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const clean = email.trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clean)) {
      toast.error("Enter a valid email address.");
      return;
    }
    setBusy(true);
    setEmail(clean);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: clean,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/library`,
        },
      });
      if (error) throw error;
      setStep("code");
      setCooldown(45);
      toast.success(`Email sent to ${clean}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Couldn't send the email";
      toast.error(
        /rate|limit/i.test(msg)
          ? "Too many attempts — wait a minute and try again."
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length !== 6) {
      toast.error("Enter the 6-digit code from your email.");
      return;
    }
    setBusy(true);
    try {
      let { error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token,
        type: "email",
      });
      if (error) {
        // Newly created accounts use the "signup" OTP type
        const retry = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token,
          type: "signup",
        });
        error = retry.error ? error : null;
      }
      if (error) throw error;
      toast.success("Signed in");
      navigate({ to: "/library" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "That code didn't work";
      toast.error(
        /expired|invalid/i.test(msg)
          ? "That code is invalid or expired — request a new one."
          : msg,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center px-6 bg-gradient-hero">
      <div className="w-full max-w-md">
        <div className="mb-6 flex items-center justify-between">
          <Logo />
          <Button asChild variant="ghost" size="sm">
            <Link to="/"><ArrowLeft className="size-4 mr-2" />Home</Link>
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-gradient-card p-8 shadow-glow">
          <h1 className="font-display text-3xl font-bold mb-2">
            {step === "email" ? "Sign in to Limitless" : "Check your email"}
          </h1>
          <p className="text-muted-foreground text-sm mb-6">
            {step === "email"
              ? "We'll email you a one-time sign-in code — no password to remember."
              : `We sent an email to ${email}. Enter the 6-digit code below, or just click the sign-in link in that email.`}
          </p>

          {step === "email" ? (
            <>
              <Button type="button" onClick={handleGoogle} disabled={busy} variant="outline" className="w-full h-11">
                <svg className="size-4 mr-2" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
                Continue with Google
              </Button>

              <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                <span>or</span>
                <span className="h-px flex-1 bg-border" />
              </div>

              <form onSubmit={sendCode} className="space-y-3">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                  />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-gradient-primary text-primary-foreground h-11">
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <><Mail className="size-4 mr-2" />Email me a code</>}
                </Button>
              </form>
            </>
          ) : (
            <form onSubmit={verifyCode} className="space-y-3">
              <div>
                <Label htmlFor="code">6-digit code</Label>
                <Input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="123456"
                  className="tracking-[0.5em] text-center text-lg"
                  value={code}
                  onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full bg-gradient-primary text-primary-foreground h-11">
                {busy ? <Loader2 className="size-4 animate-spin" /> : <><ShieldCheck className="size-4 mr-2" />Verify & sign in</>}
              </Button>
              <div className="flex items-center justify-between text-sm">
                <button type="button" onClick={() => { setStep("email"); setCode(""); }} className="text-muted-foreground hover:underline">
                  Use another email
                </button>
                <button
                  type="button"
                  disabled={busy || cooldown > 0}
                  onClick={() => sendCode()}
                  className="text-primary hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground mt-4">
          You can also <Link to="/study" className="text-primary hover:underline">continue as a guest</Link> — study kits work, but nothing is saved.
        </p>
      </div>
    </div>
  );
}
