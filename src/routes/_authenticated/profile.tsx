import { createFileRoute, Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'

export const Route = createFileRoute('/_authenticated/profile')({
  component: ProfilePage,
})

function ProfilePage() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function getProfile() {
      // 1. Get the authenticated user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // 2. Fetch their full details from the custom 'profiles' table
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
          
        setProfile(data)
      }
      setLoading(false)
    }
    getProfile()
  }, [])

  return (
    <div className="container mx-auto p-6">
      {/* Header section with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link to="/dashboard" aria-label="Go back to dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Student Profile</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>My Information</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading your details...</p>
          ) : profile ? (
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <span className="font-semibold">Name: </span> 
                {profile.full_name || 'Not provided'}
              </div>
              
              {/* Student ID */}
              <div>
                <span className="font-semibold">Student ID: </span> 
                {profile.user_code || 'Not provided'}
              </div>

              {/* Department / Program */}
              <div>
                <span className="font-semibold">Department: </span> 
                {profile.program || 'Not provided'}
              </div>

              {/* Session / Batch */}
              <div>
                <span className="font-semibold">Session: </span> 
                {profile.batch || 'Not provided'}
              </div>

              {/* Phone */}
              <div>
                <span className="font-semibold">Phone: </span> 
                {profile.phone || 'Not provided'}
              </div>
              
              {/* Personal Email */}
              <div>
                <span className="font-semibold">Email: </span> 
                {profile.personal_email || 'Not provided'}
              </div>

              {/* Account ID */}
              <div className="pt-4 border-t mt-4">
                <span className="font-semibold text-sm">Account ID: </span> 
                <span className="text-sm text-muted-foreground">{profile.id}</span>
              </div>
            </div>
          ) : (
            <p className="text-red-500">Could not load user data. Are you logged in?</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}