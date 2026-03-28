"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, X, CheckCircle } from "lucide-react";
import Link from "next/link";
import { getCurrentUser, login } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      const user = getCurrentUser();

      if (user) {
        router.push("/inventory");
        return;
      }

      setIsLoggedIn(false);
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setIsLoginLoading(true);

    try {
      const response = await login(loginUsername, loginPassword);
      if (response.token) {
        localStorage.setItem("token", response.token);
        if (rememberMe) {
          localStorage.setItem("savedUsername", loginUsername);
          localStorage.setItem("rememberMe", "true");
        }
        setLoginSuccess(true);
        setTimeout(() => {
          router.push("/inventory");
        }, 1500);
      }
    } catch (err: any) {
      setLoginError(err.message || "Login failed. Please try again.");
    } finally {
      setIsLoginLoading(false);
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            <span className="font-bold text-base sm:text-lg md:text-xl">
              InvoiceBI
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Button
              size="sm"
              variant="outline"
              className="text-xs sm:text-sm"
              onClick={() => {
                setAuthMode("login");
                setShowAuthModal(true);
                setLoginError("");
                setLoginSuccess(false);
                setLoginUsername("");
                setLoginPassword("");
              }}>
              Login
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto py-8 sm:py-12 md:py-16 px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-3 sm:mb-4 px-2">
            Inventory & Invoice Management
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Complete business solution for inventory tracking, invoice
            generation, and intelligent analytics
          </p>
        </div>

        <div className="bg-blue-600 text-white rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
            Ready to streamline your business?
          </h2>
          <p className="text-sm sm:text-base text-blue-100 mb-4 sm:mb-6 max-w-2xl mx-auto px-2">
            Start managing your inventory, creating invoices, and analyzing your
            business performance all in one place.
          </p>
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-blue-50 text-sm sm:text-base"
            onClick={() => {
              setAuthMode("login");
              setShowAuthModal(true);
              setLoginError("");
              setLoginSuccess(false);
              setLoginUsername("");
              setLoginPassword("");
            }}>
            Get Started
          </Button>
        </div>
      </div>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 w-full max-w-sm relative max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 p-1 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-6 w-6 text-gray-600" />
            </button>

            {authMode === "login" ? (
              <>
                {/* Login Form */}
                <div className="mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                    Login
                  </h2>
                  <p className="text-sm sm:text-base text-gray-600 mt-1">
                    See your growth and get support!
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                  {/* Email Field */}
                  <div>
                    <Label
                      htmlFor="login-username"
                      className="block text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                      Email or Username *
                    </Label>
                    <p className="text-xs text-gray-600 italic mb-2">
                      use your registered username
                    </p>
                    <Input
                      id="login-username"
                      type="text"
                      placeholder="Enter your email"
                      required
                      value={loginUsername}
                      onChange={(e) => setLoginUsername(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-lg sm:rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Password Field */}
                  <div>
                    <Label
                      htmlFor="login-password"
                      className="block text-xs sm:text-sm font-medium text-gray-700 uppercase tracking-wider mb-1">
                      Password *
                    </Label>
                    <p className="text-xs text-gray-600 italic mb-2">
                      minimum 8 characters
                    </p>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full bg-white border border-blue-200 rounded-lg sm:rounded-xl px-4 py-4 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  {/* Remember Me */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="remember"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-5 h-5 rounded border border-gray-300 bg-white text-blue-600 cursor-pointer"
                    />
                    <label
                      htmlFor="remember"
                      className="ml-3 text-sm text-gray-900">
                      Remember me
                    </label>
                  </div>

                  {/* Error Message */}
                  {loginError && (
                    <div className="rounded-lg bg-red-50 border border-red-300 px-4 py-3 text-sm text-red-800">
                      {loginError}
                    </div>
                  )}

                  {/* Login Button */}
                  <Button
                    type="submit"
                    disabled={isLoginLoading || loginSuccess}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 sm:py-5 rounded-2xl text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed">
                    {isLoginLoading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24">
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                        </svg>
                        Logging in...
                      </>
                    ) : loginSuccess ? (
                      "Success!"
                    ) : (
                      "Login"
                    )}
                  </Button>
                </form>

                {/* Switch to Sign Up */}
                <div className="text-center mt-6">
                  <p className="text-sm text-gray-600">
                    Not registered yet?{" "}
                    <button
                      onClick={() => {
                        setAuthMode("signup");
                        setLoginError("");
                        setLoginSuccess(false);
                      }}
                      className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                      Create a new account
                    </button>
                  </p>
                </div>
              </>
            ) : (
              <>
                {/* Sign Up Message */}
                <div className="text-center">
                  <div className="mb-6">
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                      Sign Up Disabled
                    </h2>
                    <p className="text-sm sm:text-base text-gray-600 mt-2">
                      User registration is restricted to administrators only
                    </p>
                  </div>

                  <div className="space-y-4 mb-8">
                    <p className="text-sm text-gray-600">
                      For security reasons, new user accounts can only be
                      created by system administrators.
                    </p>
                    <p className="text-sm text-gray-600">
                      If you need an account, please contact your system
                      administrator.
                    </p>
                  </div>

                  {/* Back to Login Button */}
                  <Button
                    onClick={() => {
                      setAuthMode("login");
                      setLoginError("");
                      setLoginSuccess(false);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 sm:py-5 rounded-lg sm:rounded-xl text-base sm:text-lg transition-colors">
                    Back to Login
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
