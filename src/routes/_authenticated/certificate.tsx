import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/certificate')({
  component: CertificatePage,
})

function CertificatePage() {
  const [profile, setProfile] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)

        // 2. Fetch Application to check clearance status
        const { data: appData } = await supabase
          .from('clearance_applications')
          .select('*')
          .eq('student_id', user.id)
          .maybeSingle()
        setApplication(appData)
      }
      setLoading(false)
    }
    loadData()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading your certificate...</div>
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Error loading profile data.</div>
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Clearance Certificate</h1>
        <Button disabled variant="default">
          <Download className="mr-2 h-4 w-4" /> Download PDF
        </Button>
      </div>

      {/* Formal Certificate Layout */}
      <Card className="border-4 border-double border-slate-300 p-8 sm:p-12 mt-8 bg-white">
        <CardContent className="text-center space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold uppercase tracking-wider text-slate-900">
              National Institute of Textile Engineering and Research
            </h2>
            <p className="text-muted-foreground uppercase tracking-widest text-sm">Nayarhat, Savar, Dhaka</p>
          </div>

          <div className="py-8">
            <h3 className="text-xl sm:text-2xl font-serif font-semibold text-slate-800 italic">
              Digital Clearance Certificate
            </h3>
          </div>

          <div className="text-lg leading-relaxed text-slate-800 text-left sm:text-center max-w-2xl mx-auto font-serif">
            This is to certify that <span className="font-bold border-b border-slate-400 px-2">{profile.full_name}</span>, 
            Student ID <span className="font-bold border-b border-slate-400 px-2">{profile.user_code}</span> of the 
            <span className="font-bold border-b border-slate-400 px-2"> {profile.program} </span> department, 
            Batch <span className="font-bold border-b border-slate-400 px-2">{profile.batch}</span>, has successfully completed all necessary departmental and administrative clearance procedures.
          </div>

          {/* Signature Areas */}
          <div className="pt-16 flex justify-between items-end px-4 sm:px-12">
            {/* Date Area */}
            <div className="text-center flex flex-col justify-end h-24">
              <div className="border-t border-slate-800 w-32 mb-2 mx-auto"></div>
              <p className="text-sm font-semibold text-slate-700">Date Issued</p>
              <p className="text-xs text-muted-foreground">
                {application?.status === 'cleared' ? new Date().toLocaleDateString('en-GB') : 'N/A'}
              </p>
            </div>
            
            {/* Registrar Signature Area */}
            <div className="text-center flex flex-col items-center justify-end h-24">
              {application?.status === 'cleared' ? (
                // This is a placeholder signature URL that Shafin will eventually replace with the real database URL
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/f/f4/John_Hancock_Signature.svg" 
                  alt="Registrar Signature" 
                  className="h-12 object-contain mb-2 opacity-80"
                />
              ) : (
                <div className="h-12 mb-2 flex items-center text-xs text-muted-foreground italic">
                  Pending Final Approval
                </div>
              )}
              <div className="border-t border-slate-800 w-40 mb-2 mx-auto"></div>
              <p className="text-sm font-semibold text-slate-700">Registrar</p>
              <p className="text-xs text-muted-foreground">NITER</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}