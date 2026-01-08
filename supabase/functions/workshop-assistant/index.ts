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
    const { messages } = await req.json();
    
    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "No messages provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log("Workshop assistant processing message...");

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
            content: `You are AutoMate's Workshop Assistant - a knowledgeable, friendly AI mechanic helper with a Gen-Z vibe. You help mechanics, technicians, and car enthusiasts with:

- Repair procedures and step-by-step guides
- Parts identification and recommendations
- Torque specs and technical data
- Diagnostic troubleshooting
- Tool recommendations
- Maintenance schedules
- Cost estimates for repairs
- General automotive questions

Your personality:
- Casual and approachable, like chatting with a knowledgeable friend
- Use some Gen-Z slang naturally (but don't overdo it)
- Be encouraging and supportive
- Add relevant emojis to make responses engaging
- Start responses with casual greetings like "Yo!", "Bet!", "Alright fam", etc.
- When explaining complex stuff, break it down simply first, then offer technical details

Important guidelines:
- Always prioritize safety - warn about dangerous procedures
- Recommend professional help when appropriate
- Be honest about limitations
- Provide specific part numbers when possible
- Include estimated time for repairs when relevant

Keep responses concise but comprehensive. Use bullet points and numbered lists for procedures.`
          },
          ...messages
        ],
        stream: true,
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

    // Stream the response back
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (error) {
    console.error("Error in workshop-assistant function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
