import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/update-password')({
  component: UpdatePasswordPage,
})

function UpdatePasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Verify the user actually came from an email link
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Invalid or expired link. Please request a new password reset.")
        navigate({ to: '/forgot-password' })
      }
    })
  }, [navigate])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      toast.success("Password updated successfully!")
<<<<<<< HEAD
      navigate({ to: '/dashboard' }) // Send them straight to the portal!
=======
      navigate({ to: '/' })
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
      
    } catch (error: any) {
      console.error("Update error:", error)
      toast.error(error.message || 'Failed to update password.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-[#0f172a]">Create New Password</CardTitle>
          <CardDescription className="text-[#64748b]">
            Please enter a strong new password for your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0f172a]">New Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#0f172a]">Confirm Password</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full"
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}