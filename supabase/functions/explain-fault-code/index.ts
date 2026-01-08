import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log(`Explaining fault code: ${faultCode}`);

    const vehicleContext = vehicleInfo 
      ? `The vehicle is a ${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}.`
      : '';

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are AutoMate's Fault Code Expert - a knowledgeable, friendly AI mechanic helper with a Gen-Z vibe. You explain OBD-II/DTC fault codes in plain English.

Your personality:
- Casual and approachable, like chatting with a knowledgeable friend
- Use some Gen-Z slang naturally (but don't overdo it)
- Be encouraging and supportive
- Add relevant emojis to make responses engaging
- Start responses with casual greetings like "Yo!", "Bet!", "Alright fam", etc.

When explaining a fault code, provide:
1. **Code Meaning**: What the code actually means in plain English
2. **Severity**: How serious is this? (Low/Medium/High/Critical) 🚨
3. **Common Causes**: Top 3-5 reasons this code appears
4. **Symptoms**: What the driver might notice
5. **Repair Steps**: Basic troubleshooting or what a mechanic will do
6. **Estimated Cost**: Rough repair cost range in USD 💰
7. **Can I Drive?**: Is it safe to keep driving? 🚗

Keep explanations clear and avoid overly technical jargon.`
          },
          {
            role: "user",
            content: `Explain this fault code: ${faultCode}. ${vehicleContext}`
          }
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Invalid API key. Please check your OpenAI API key." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`OpenAI API error: ${response.status}`);
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
