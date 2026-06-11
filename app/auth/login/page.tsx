"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle } from "lucide-react";

import { login } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  useEffect(() => {
    const savedUsername = localStorage.getItem("savedUsername");
    const savedRememberMe = localStorage.getItem("rememberMe") === "true";
    if (savedRememberMe && savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(username, password);

      if (rememberMe) {
        localStorage.setItem("rememberMe", "true");
        localStorage.setItem("savedUsername", username);
      } else {
        localStorage.removeItem("rememberMe");
        localStorage.removeItem("savedUsername");
      }

      setLoginSuccess(true);
      setTimeout(() => {
        router.push("/");
      }, 800);
    } catch (loginError: any) {
      setError(loginError?.message || "Invalid credentials");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/95 shadow-2xl backdrop-blur-sm p-6 sm:p-8">
        <Link href="/">
          <Button
            variant="ghost"
            className="mb-4 -ml-2 text-sm font-medium text-slate-500 hover:text-slate-900">
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <div className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-orange-600">
            Inventory System
          </p>
          <h1 className="text-3xl font-bold text-slate-900">Log in</h1>
          <p className="text-sm text-slate-500">
            Use your account to continue to the dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="username"
              className="text-sm font-medium text-slate-700">
              Email or username
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your email or username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900"
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
            />
            <span className="text-sm text-slate-600">Keep me logged in</span>
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={isLoading || loginSuccess}
            className="w-full rounded-xl bg-slate-900 py-2.5 font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50">
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Signing in...
              </span>
            ) : loginSuccess ? (
              <span className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Success!
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
