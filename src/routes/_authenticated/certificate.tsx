import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { Button } from '@/components/ui/button'
import { Download, Loader2, Printer } from 'lucide-react'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import QRCode from 'qrcode'

export const Route = createFileRoute('/_authenticated/certificate')({
  component: CertificatePage,
})

function CertificatePage() {
  const [profile, setProfile] = useState<any>(null)
  const [application, setApplication] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [certId, setCertId] = useState('')
  const certificateRef = useRef<HTMLDivElement>(null)

  // TODO (Shafin): Replace this local fallback with a fetch to the app_settings table
  const [signatureUrl, setSignatureUrl] = useState('/signature.png')

  useEffect(() => {
    async function loadData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setProfile(profileData)

        // Fetch Application
        const { data: appData } = await supabase
          .from('clearance_applications')
          .select('*')
          .eq('student_id', user.id)
          .maybeSingle()
        setApplication(appData)

        // Fetch Certificate Data (for the QR Code)
        if (appData) {
          const { data: certData } = await supabase
            .from('certificates')
            .select('*')
            .eq('application_id', appData.id)
            .maybeSingle()
          
          if (certData?.id) {
            // Generate QR code pointing to the public verification page (uses certificate UUID)
            const verifyUrl = `${window.location.origin}/verify/${certData.id}`
            setCertId(certData.id)
            try {
              const url = await QRCode.toDataURL(verifyUrl, { width: 100, margin: 0 })
              setQrCodeUrl(url)
            } catch (err) {
              console.error("Failed to generate QR code", err)
            }
          }
        }
      }
      setLoading(false)
    }
    loadData()
  }, [])

  // Unified function for both Downloading and Printing
  const handleGenerateDocument = async (action: 'download' | 'print') => {
    if (!certificateRef.current) return
    setIsGenerating(true)
    
    try {
      // 1. Take a high-res screenshot of the certificate div
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      
      // 2. Create an A4 Landscape PDF
      const pdf = new jsPDF('l', 'mm', 'a4')
      
      // 3. Smart Scaling Math
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const canvasRatio = canvas.width / canvas.height
      
      let finalWidth = pdfWidth
      let finalHeight = pdfWidth / canvasRatio
      
      if (finalHeight > pdfHeight) {
        finalHeight = pdfHeight
        finalWidth = pdfHeight * canvasRatio
      }
      
      const xOffset = (pdfWidth - finalWidth) / 2
      const yOffset = (pdfHeight - finalHeight) / 2
      
      // 4. Inject image
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight)
      
      // 5. Handle Action (Download vs Print)
      if (action === 'download') {
        pdf.save(`Clearance_Certificate_${profile?.user_code || 'NITER'}.pdf`)
      } else if (action === 'print') {
        pdf.autoPrint() // Tells the PDF to open the print dialog immediately
        window.open(pdf.output('bloburl'), '_blank') // Opens in a new safe tab
      }
      
    } catch (error: any) {
      console.error("Error generating document:", error)
      alert(`Generation Failed: ${error.message || "Check the console for details."}`)
    } finally {
      setIsGenerating(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-[#64748b]">Loading your certificate...</div>
  }

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Error loading profile data.</div>
  }

  const isCleared = application?.status === 'cleared'

  return (
    <div className="container mx-auto p-4 sm:p-6 flex flex-col items-center">
      
      {/* Header section with print:hidden so it doesn't show on manual browser prints */}
      <div className="flex flex-col sm:flex-row w-full max-w-[1000px] justify-between items-center mb-6 gap-4 print:hidden">
        <h1 className="text-3xl font-bold">Clearance Certificate</h1>
        
        <div className="flex gap-3 w-full sm:w-auto">
          {/* Print Button */}
          <Button 
            onClick={() => handleGenerateDocument('print')} 
            disabled={!isCleared || isGenerating} 
            variant="outline"
            className="flex-1 sm:flex-none"
          >
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Printer className="mr-2 h-4 w-4" />}
            Print Certificate
          </Button>

          {/* Download Button */}
          <Button 
            onClick={() => handleGenerateDocument('download')} 
            disabled={!isCleared || isGenerating} 
            variant="default"
            className="flex-1 sm:flex-none"
          >
            {isGenerating ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
            ) : (
              <><Download className="mr-2 h-4 w-4" /> Download PDF</>
            )}
          </Button>
        </div>
      </div>

      {/* We wrap the certificate in an A4 aspect-ratio div so it fills the PDF perfectly */}
      <div 
        ref={certificateRef} 
        className="w-full max-w-[1000px] aspect-[1.414] bg-[#ffffff] p-4 sm:p-8 flex flex-col shadow-sm"
      >
        <div className="border-[6px] border-double border-[#cbd5e1] rounded-2xl p-8 sm:p-12 flex-1 flex flex-col justify-between bg-[#ffffff]">
          
          <div className="text-center space-y-2 mt-4">
            <h2 className="text-2xl sm:text-4xl font-serif font-bold uppercase tracking-wider text-[#0f172a]">
              National Institute of Textile Engineering and Research
            </h2>
            <p className="text-[#64748b] uppercase tracking-widest text-sm">Nayarhat, Savar, Dhaka</p>
          </div>

          <div className="text-center">
            <h3 className="text-xl sm:text-3xl font-serif font-semibold text-[#1e293b] italic">
              Digital Clearance Certificate
            </h3>
          </div>

          <div className="text-lg sm:text-xl leading-loose text-[#1e293b] text-center max-w-3xl mx-auto font-serif">
            This is to certify that 
            <span className="relative inline-block font-bold px-2 mx-1 pb-1">
              {profile.full_name}
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#94a3b8]"></span>
            </span>, 
            Student ID 
            <span className="relative inline-block font-bold px-2 mx-1 pb-1">
              {profile.user_code}
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#94a3b8]"></span>
            </span> of the 
            <span className="relative inline-block font-bold px-2 mx-1 pb-1">
              {profile.program}
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#94a3b8]"></span>
            </span> department, 
            Academic year 
            <span className="relative inline-block font-bold px-2 mx-1 pb-1">
              {profile.batch}
              <span className="absolute left-0 bottom-0 w-full h-[2px] bg-[#94a3b8]"></span>
            </span>, 
            has successfully completed all necessary departmental and administrative clearance procedures.
          </div>

          {/* Signature & Verification Area */}
          <div className="flex justify-between items-end px-4 sm:px-12 mb-4">
            
            {/* Left Area: QR Code & Date */}
            <div className="flex flex-col items-center justify-end">
              {isCleared && qrCodeUrl ? (
                <img src={qrCodeUrl} alt="Verification QR Code" className="w-28 h-28 mb-3" />
              ) : (
                <div className="w-28 h-28 mb-3 border-2 border-dashed border-[#e2e8f0] flex items-center justify-center text-[10px] text-[#64748b] text-center p-1">
                  QR Pending
                </div>
              )}
              <div className="text-center">
                <p className="text-xs font-semibold text-[#334155] uppercase tracking-wider">Date Issued</p>
                <p className="text-sm font-medium text-[#0f172a] mt-1">
                  {isCleared ? new Date().toLocaleDateString('en-GB') : 'N/A'}
                </p>
                {certId && (
                  <>
                    <p className="text-xs font-semibold text-[#334155] uppercase tracking-wider mt-3">Certificate ID</p>
                    <p className="text-[10px] font-mono text-[#64748b] mt-1 break-all">{certId}</p>
                  </>
                )}
              </div>
            </div>
            
            {/* Right Area: Registrar Signature */}
            <div className="text-center flex flex-col items-center justify-end">
              {isCleared ? (
                <img 
                  src={signatureUrl}
                  alt="Registrar Signature" 
                  className="h-20 object-contain mb-2 opacity-80"
                />
              ) : (
                <div className="h-20 mb-2 flex items-center text-xs text-[#64748b] italic">
                  Pending Final Approval
                </div>
              )}
              <div className="border-t-[1.5px] border-[#1e293b] w-56 mb-2 mx-auto"></div>
              <p className="text-sm font-bold text-[#1e293b] uppercase tracking-wider">Registrar</p>
              <p className="text-xs text-[#64748b] tracking-widest mt-1">NITER</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}