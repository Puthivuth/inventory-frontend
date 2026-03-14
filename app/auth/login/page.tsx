// "use client";

// import type React from "react";
// import { login } from "@/lib/api";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { CheckCircle, ArrowLeft } from "lucide-react";

// export default function LoginPage() {
//   const [username, setUsername] = useState("");
//   const [password, setPassword] = useState("");
//   const [rememberMe, setRememberMe] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isLoading, setIsLoading] = useState(false);
//   const [loginSuccess, setLoginSuccess] = useState(false);
//   const router = useRouter();

//   const handleLogin = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsLoading(true);
//     setError(null);

//     try {
//       await login(username, password);

//       // Store remember me preference
//       if (rememberMe) {
//         localStorage.setItem("rememberMe", "true");
//         localStorage.setItem("savedUsername", username);
//       }

//       setLoginSuccess(true);
//       setTimeout(() => {
//         window.location.href = "/";
//       }, 1500);
//     } catch (error: any) {
//       setError(error.message || "Invalid credentials");
//       setIsLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 sm:px-6 py-8">
//       <div className="w-full max-w-sm">
//         {/* Back Button */}
//         <Link href="/">
//           <Button
//             variant="ghost"
//             className="text-sm font-medium mb-4 text-gray-500 hover:text-gray-900 transition-colors -ml-3">
//             <ArrowLeft className="h-4 w-4 mr-1" />
//             Back to Home
//           </Button>
//         </Link>

//         {/* Header Section */}
//         <div className="mb-8">
//           <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 mb-1.5">
//             Log in
//           </h1>
//           <p className="text-sm text-gray-500">
//             Welcome back! Please enter your details.
//           </p>
//         </div>

//         {/* Form Section */}
//         <form onSubmit={handleLogin} className="space-y-5">
//           {/* Email Field */}
//           <div className="space-y-1.5">
//             <Label
//               htmlFor="username"
//               className="text-sm font-medium text-gray-700">
//               Email or username
//             </Label>
//             <Input
//               id="username"
//               type="text"
//               placeholder="Enter your email or username"
//               required
//               value={username}
//               onChange={(e) => setUsername(e.target.value)}
//               className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-shadow"
//             />
//             <p className="text-xs text-gray-500">
//               Use your registered email address or username
//             </p>
//           </div>

//           {/* Password Field */}
//           <div className="space-y-1.5">
//             <div className="flex items-center justify-between">
//               <Label
//                 htmlFor="password"
//                 className="text-sm font-medium text-gray-700">
//                 Password
//               </Label>
//               <Link
//                 href="/auth/forgot-password"
//                 className="text-xs text-gray-500 hover:text-gray-900 transition-colors">
//                 Forgot password?
//               </Link>
//             </div>
//             <Input
//               id="password"
//               type="password"
//               placeholder="Enter your password"
//               required
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full bg-white border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 transition-shadow"
//             />
//             <p className="text-xs text-gray-500">Minimum 8 characters</p>
//           </div>

//           {/* Remember Me */}
//           <label className="flex items-center gap-2 cursor-pointer">
//             <input
//               type="checkbox"
//               checked={rememberMe}
//               onChange={(e) => setRememberMe(e.target.checked)}
//               className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 focus:ring-offset-0 cursor-pointer"
//             />
//             <span className="text-sm text-gray-600">Keep me logged in</span>
//           </label>

//           {/* Error Message */}
//           {error && (
//             <div className="rounded-md bg-red-50 border border-red-200 px-3.5 py-2.5">
//               <p className="text-xs text-red-600">{error}</p>
//             </div>
//           )}

//           {/* Login Button */}
//           <Button
//             type="submit"
//             disabled={isLoading || loginSuccess}
//             className="w-full bg-gray-900 hover:bg-gray-800 active:bg-gray-700 text-white font-medium py-2.5 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
//             {isLoading ? (
//               <span className="flex items-center justify-center gap-2">
//                 <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
//                   <circle
//                     className="opacity-25"
//                     cx="12"
//                     cy="12"
//                     r="10"
//                     stroke="currentColor"
//                     strokeWidth="4"
//                     fill="none"
//                   />
//                   <path
//                     className="opacity-75"
//                     fill="currentColor"
//                     d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                   />
//                 </svg>
//                 Signing in...
//               </span>
//             ) : loginSuccess ? (
//               <span className="flex items-center justify-center gap-2">
//                 <svg
//                   className="h-4 w-4"
//                   fill="none"
//                   stroke="currentColor"
//                   viewBox="0 0 24 24">
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth="2"
//                     d="M5 13l4 4L19 7"
//                   />
//                 </svg>
//                 Success!
//               </span>
//             ) : (
//               "Sign in"
//             )}
//           </Button>

//           {/* Sign up link */}
//           <p className="text-center text-sm text-gray-500">
//             Don't have an account?{" "}
//             <Link
//               href="/auth/signup"
//               className="font-medium text-gray-900 hover:text-gray-700 transition-colors">
//               Sign up
//             </Link>
//           </p>
//         </form>
//       </div>
//     </div>
//   );
// }
