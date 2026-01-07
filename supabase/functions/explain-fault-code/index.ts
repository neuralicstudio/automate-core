import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { faultCode, vehicleInfo } = await req.json();
    
    if (!faultCode) {
      return new Response(
        JSON.stringify({ error: "No fault code provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Explaining fault code:", faultCode);

    const vehicleContext = vehicleInfo 
      ? `The vehicle is a ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}.`
      : "No specific vehicle information provided.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert automotive diagnostic technician AI with deep knowledge of OBD-II diagnostic trouble codes (DTCs). Explain fault codes in a Gen-Z friendly, easy-to-understand way.

When explaining a fault code, provide:
1. **What It Means**: Plain English explanation (no jargon)
2. **The Technical Stuff**: Brief technical explanation for those who want it
3. **Common Causes**: Top 3-5 most likely causes
4. **Symptoms You Might Notice**: What the driver might experience
5. **Severity Level**: How serious is this? (🟢 Low / 🟡 Medium / 🔴 High / ⚫ Critical)
6. **Can You Still Drive?**: Is it safe to drive with this code?
7. **DIY or Mechanic?**: Can this be fixed at home or needs a pro?
8. **Estimated Repair Cost**: Rough range in USD

Keep it casual and conversational! Start with something like "Alright, let's decode this bad boy!" or "Yo, here's what's going on under the hood..."

Use emojis to make it engaging but not excessive.`
          },
          {
            role: "user",
            content: `Explain this OBD-II/DTC fault code: ${faultCode}\n\n${vehicleContext}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI usage limit reached. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices?.[0]?.message?.content;

    console.log("Fault code explanation complete");

    return new Response(
      JSON.stringify({ explanation }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in explain-fault-code function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
