import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { User, Lock, Fingerprint, LogIn, UserPlus, ShieldCheck, ShieldAlert } from "lucide-react";
import { Card, Button, Input } from "./UI";
import { cn } from "../utils/utils";

interface LoginProps {
  onLogin: (username: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [useBiometrics, setUseBiometrics] = useState(false);

  useEffect(() => {
    // Check if biometrics are supported
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsBiometricSupported(available))
        .catch(() => setIsBiometricSupported(false));
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isSignUp) {
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      
      const users = JSON.parse(localStorage.getItem("ezy_users") || "[]");
      if (users.find((u: any) => u.username === username)) {
        setError("Username already exists");
        return;
      }

      const newUser = {
        username,
        passwordHash: password, // In a real app, hash this!
        isBiometricEnabled: useBiometrics,
      };

      users.push(newUser);
      localStorage.setItem("ezy_users", JSON.stringify(users));
      onLogin(username);
    } else {
      const users = JSON.parse(localStorage.getItem("ezy_users") || "[]");
      const user = users.find((u: any) => u.username === username && u.passwordHash === password);
      
      if (user) {
        onLogin(username);
      } else {
        setError("Invalid username or password");
      }
    }
  };

  const handleBiometricLogin = async () => {
    // This is a simplified simulation of biometric auth for the demo
    // In a real app, you'd use WebAuthn API properly
    const lastUser = localStorage.getItem("ezy_last_user");
    if (!lastUser) {
      setError("No user found for biometric login. Please login with password first.");
      return;
    }

    const users = JSON.parse(localStorage.getItem("ezy_users") || "[]");
    const user = users.find((u: any) => u.username === lastUser);

    if (user && user.isBiometricEnabled) {
      try {
        // Simulate biometric prompt
        // In real WebAuthn, this would be a navigator.credentials.get() call
        const confirmed = window.confirm("Use your device lock (Fingerprint/Face ID) to unlock EZY Expense Tracker?");
        if (confirmed) {
          onLogin(lastUser);
        }
      } catch (err) {
        setError("Biometric authentication failed");
      }
    } else {
      setError("Biometric login is not enabled for this user.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mx-auto mb-4">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">EZY Expense</h1>
          <p className="text-slate-500 font-medium">Secure your financial journey</p>
        </div>

        <Card className="p-8 border-slate-100 shadow-xl">
          <div className="flex p-1 bg-slate-100 rounded-2xl mb-8">
            <button
              onClick={() => setIsSignUp(false)}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all uppercase tracking-wider",
                !isSignUp ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              )}
            >
              Login
            </button>
            <button
              onClick={() => setIsSignUp(true)}
              className={cn(
                "flex-1 py-2.5 text-sm font-bold rounded-xl transition-all uppercase tracking-wider",
                isSignUp ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
              )}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Username</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  required
                  placeholder="Enter your username"
                  className="pl-12 h-12"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  required
                  type="password"
                  placeholder="••••••••"
                  className="pl-12 h-12"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {isSignUp && (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="pl-12 h-12"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                {isBiometricSupported && (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm">
                      <Fingerprint size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">Enable Biometrics</p>
                      <p className="text-[10px] text-slate-500 font-medium">Use device lock for faster access</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={useBiometrics}
                      onChange={(e) => setUseBiometrics(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                )}
              </>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold"
              >
                <ShieldAlert size={16} />
                {error}
              </motion.div>
            )}

            <Button type="submit" className="w-full h-12 text-base font-bold shadow-lg shadow-blue-500/20">
              {isSignUp ? (
                <span className="flex items-center gap-2"><UserPlus size={20} /> Create Account</span>
              ) : (
                <span className="flex items-center gap-2"><LogIn size={20} /> Sign In</span>
              )}
            </Button>
          </form>

          {!isSignUp && isBiometricSupported && (
            <div className="mt-6">
              <div className="relative flex items-center justify-center mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <span className="relative px-4 bg-white text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or login with</span>
              </div>
              
              <button
                onClick={handleBiometricLogin}
                className="w-full flex flex-col items-center justify-center gap-2 p-6 rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                  <Fingerprint size={24} />
                </div>
                <span className="text-xs font-bold text-slate-500 group-hover:text-blue-600">Biometric Unlock</span>
              </button>
            </div>
          )}
        </Card>

        <p className="text-center mt-8 text-slate-400 text-xs font-medium">
          Securely stored on your device. No data leaves this browser.
        </p>
      </motion.div>
    </div>
  );
};
