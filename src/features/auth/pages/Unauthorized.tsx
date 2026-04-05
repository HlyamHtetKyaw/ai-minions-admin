import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authService } from "../services/auth.service"
import { ShieldX } from "lucide-react"

export function Unauthorized() {
  const navigate = useNavigate()

  const handleSignOut = () => {
    authService.logout()
    navigate("/signin")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-2">
            <div className="p-4 rounded-full bg-destructive/10">
              <ShieldX className="h-12 w-12 text-destructive" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Access denied</CardTitle>
          <CardDescription className="text-center">
            You don&apos;t have permission to access the admin dashboard. Admin role is required.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button onClick={handleSignOut} variant="default">
            Sign out
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
