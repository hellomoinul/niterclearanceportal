import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch pending emails (limit to 10 per invocation)
    const { data: emails, error: fetchError } = await supabase
      .from("email_queue")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(10);

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch email queue" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!emails || emails.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "No pending emails" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];
    for (const email of emails) {
      // Mark as processing
      await supabase
        .from("email_queue")
        .update({ attempts: email.attempts + 1 })
        .eq("id", email.id);

      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "NITER Clearance <onboarding@resend.dev>",
            to: email.recipient_email,
            subject: email.subject,
            html: email.html_body,
          }),
        });

        if (!resendRes.ok) {
          const err = await resendRes.text();
          console.error("Resend error:", err);
          await supabase
            .from("email_queue")
            .update({ status: "failed", last_error: err })
            .eq("id", email.id);
          results.push({ id: email.id, status: "failed", error: err });
          continue;
        }

        const resendData = await resendRes.json();
        await supabase
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString() })
          .eq("id", email.id);
        results.push({ id: email.id, status: "sent", resend_id: resendData.id });
      } catch (e) {
        console.error("Send error:", e);
        await supabase
          .from("email_queue")
          .update({ status: "failed", last_error: String(e) })
          .eq("id", email.id);
        results.push({ id: email.id, status: "failed", error: String(e) });
      }
    }

    return new Response(JSON.stringify({ processed: emails.length, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
