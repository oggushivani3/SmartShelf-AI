import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Sparkles, ShieldCheck } from "lucide-react";
import { useEffect, useCallback } from "react";
import { useAuth, signIn, decodeGoogleJwt } from "@/lib/auth-store";

/**
 * ⚠️  Replace with your real Google OAuth Client ID from:
 *     https://console.cloud.google.com/apis/credentials
 *
 *     Authorized JavaScript origins must include:
 *       - http://localhost:5173  (dev)
 *       - Your deployed URL       (prod)
 */
const GOOGLE_CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [{ title: "Sign In — SmartShelf AI" }],
  }),
  component: Login,
});

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              shape?: string;
              width?: number;
              text?: string;
              logo_alignment?: string;
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

function Login() {
  const navigate = useNavigate();
  const user = useAuth();

  // If already signed in, redirect to dashboard
  useEffect(() => {
    if (user) {
      navigate({ to: "/dashboard" });
    }
  }, [user, navigate]);

  const handleCredentialResponse = useCallback(
    (response: { credential: string }) => {
      const decoded = decodeGoogleJwt(response.credential);
      if (decoded) {
        signIn(decoded);
        navigate({ to: "/dashboard" });
      }
    },
    [navigate],
  );

  // Initialize Google Sign-In
  useEffect(() => {
    if (user) return; // already signed in

    const initGoogle = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: true,
      });

      const btnContainer = document.getElementById("google-signin-btn");
      if (btnContainer) {
        window.google.accounts.id.renderButton(btnContainer, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          width: 320,
          text: "signin_with",
          logo_alignment: "left",
        });
      }

      // Also show One Tap prompt
      window.google.accounts.id.prompt();
    };

    // The GIS script might already be loaded
    if (window.google) {
      initGoogle();
    } else {
      // Wait for it to load
      const interval = setInterval(() => {
        if (window.google) {
          clearInterval(interval);
          initGoogle();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, [user, handleCredentialResponse]);

  if (user) return null; // Redirecting...

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background glow orbs */}
      <div className="absolute -top-40 -left-40 size-[500px] bg-beauty/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 size-[500px] bg-meds/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-grocery/10 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Card */}
        <div className="glass-card rounded-3xl p-8 sm:p-10 text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="size-16 rounded-2xl bg-gradient-to-br from-grocery via-meds to-beauty grid place-items-center mx-auto mb-6 shadow-lg shadow-meds/20"
          >
            <Sparkles className="size-8 text-white/90" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="font-display font-bold text-3xl tracking-tight mb-2"
          >
            SmartShelf{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-grocery via-meds to-beauty">
              AI
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground text-sm mb-8"
          >
            Sign in to track your inventory, scan products,
            <br />
            and never miss an expiry date.
          </motion.p>

          {/* Google Sign-In button container */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex justify-center mb-6"
          >
            <div id="google-signin-btn" />
          </motion.div>

          {/* Fallback if GIS hasn't loaded */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="text-xs text-muted-foreground/60"
          >
            Powered by Google Identity Services
          </motion.p>

          {/* Security note */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground"
          >
            <ShieldCheck className="size-3.5 text-grocery" />
            <span>Your data stays on this device</span>
          </motion.div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          © 2026 SmartShelf AI. Built for zero-waste living.
        </p>
      </motion.div>
    </div>
  );
}
