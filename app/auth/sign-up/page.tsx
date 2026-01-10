"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ArrowLeft, ShieldAlert } from "lucide-react"

export default function SignUpPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to login after 3 seconds
    const timer = setTimeout(() => {
      router.push("/auth/login")
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Link href="/">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="h-6 w-6 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Sign Up Disabled</CardTitle>
            <CardDescription className="text-center">
              User registration is restricted to administrators only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                For security reasons, new user accounts can only be created by system administrators.
              </p>
              <p className="text-sm text-muted-foreground">
                If you need an account, please contact your system administrator.
              </p>
              <div className="pt-4">
                <Link href="/auth/login">
                  <Button className="w-full">
                    Go to Login
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground">
                Redirecting to login page in 3 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
