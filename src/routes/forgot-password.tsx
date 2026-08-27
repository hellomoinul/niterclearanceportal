import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export const Route = createFileRoute('/forgot-password')({
  component: ForgotPasswordPage,
})

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      // Tell Supabase to send the email, and where to redirect them after they click the link
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`, 
      })

      if (error) throw error

      setMessage({ type: 'success', text: 'Check your email for the password reset link!' })
      setEmail('') // Clear the input on success
    } catch (error: any) {
      console.error("Reset error:", error)
      setMessage({ type: 'error', text: error.message || 'Failed to send reset email.' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4">
      <Card className="w-full max-w-md shadow-lg border-0">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-[#0f172a]">Reset Password</CardTitle>
          <CardDescription className="text-[#64748b]">
<<<<<<< HEAD
            Enter your NITER student email to receive a secure password reset link.
=======
            Enter your email to receive a secure password reset link.
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
<<<<<<< HEAD
                placeholder="e.g. cs2200000@niter.edu.bd"
=======
                placeholder="you@email.com"
>>>>>>> 6e23aac45333d379a1516e174f619d5fa23b414c
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            
            {message && (
              <div className={`p-3 rounded-md text-sm font-medium ${
                message.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' 
                  : 'bg-red-50 text-red-600 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Send Reset Link
            </Button>
            
            <div className="text-center mt-6">
              {/* Assuming your login page is at the root '/' */}
              <Link to="/" className="text-sm font-medium text-[#3b82f6] hover:text-[#2563eb] hover:underline underline-offset-4">
                Back to Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}