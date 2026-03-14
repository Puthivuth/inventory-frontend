// "use client";

// import { Button } from "@/components/ui/button";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useEffect } from "react";
// import { ShieldAlert } from "lucide-react";

// export default function SignUpPage() {
//   const router = useRouter();

//   useEffect(() => {
//     // Redirect to login after 3 seconds
//     const timer = setTimeout(() => {
//       router.push("/auth/login");
//     }, 3000);

//     return () => clearTimeout(timer);
//   }, [router]);

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4 sm:px-6 py-8">
//       <div className="w-full max-w-sm">
//         {/* Header Section */}
//         <div className="text-center mb-8 sm:mb-12">
//           <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
//             Sign Up
//           </h1>
//           <p className="text-sm sm:text-base text-gray-600">
//             Create your account
//           </p>
//         </div>

//         {/* Content Card */}
//         <div className="bg-white border border-blue-200 rounded-xl sm:rounded-2xl p-6 sm:p-8 text-center shadow-sm">
//           {/* Icon */}
//           <div className="flex items-center justify-center mb-6">
//             <div className="h-16 w-16 rounded-full bg-red-100 border border-red-300 flex items-center justify-center">
//               <ShieldAlert className="h-8 w-8 text-red-600" />
//             </div>
//           </div>

//           {/* Title and Description */}
//           <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
//             Sign Up Disabled
//           </h2>
//           <p className="text-gray-700 text-sm sm:text-base mb-6">
//             User registration is restricted to administrators only
//           </p>

//           {/* Info Messages */}
//           <div className="space-y-4 mb-8">
//             <p className="text-sm text-gray-600">
//               For security reasons, new user accounts can only be created by
//               system administrators.
//             </p>
//             <p className="text-sm text-gray-600">
//               If you need an account, please contact your system administrator.
//             </p>
//           </div>

//           {/* Login Button */}
//           <Link href="/auth/login">
//             <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 sm:py-5 rounded-lg sm:rounded-xl text-base sm:text-lg transition-colors">
//               Go to Login
//             </Button>
//           </Link>

//           {/* Auto-redirect message */}
//           <p className="text-xs text-gray-500 mt-6">
//             Redirecting to login page in 3 seconds...
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
