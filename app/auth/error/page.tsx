import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ErrorPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              Sorry, something went wrong.
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {searchParams?.error ? (
              <p className="text-sm text-muted-foreground">
                Error: {searchParams.error}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                An unspecified error occurred.
              </p>
            )}

            <Button asChild className="w-full">
              <Link href="/auth/login">Back to Login</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
