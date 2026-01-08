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
    const { imageBase64, scanType } = await req.json();
    
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      console.error("OPENAI_API_KEY is not configured");
      throw new Error("OPENAI_API_KEY is not configured");
    }

    console.log(`Processing OCR scan of type: ${scanType || 'general'}`);

    let systemPrompt = "";
    let userPrompt = "";

    switch (scanType) {
      case "license_plate":
        systemPrompt = `You are an expert OCR system specialized in reading license plates. 
Extract the license plate number from the image with high accuracy.
Return your response in this exact JSON format:
{
  "plate_number": "THE LICENSE PLATE TEXT",
  "confidence": "high/medium/low",
  "state_or_region": "if identifiable",
  "notes": "any additional observations"
}
Only return valid JSON, no other text.`;
        userPrompt = "Extract the license plate number from this image. Return only JSON.";
        break;

      case "vin":
        systemPrompt = `You are an expert OCR system specialized in reading Vehicle Identification Numbers (VINs).
VINs are exactly 17 characters long and contain only letters (except I, O, Q) and numbers.
Extract the VIN from the image with high accuracy.
Return your response in this exact JSON format:
{
  "vin": "THE 17 CHARACTER VIN",
  "confidence": "high/medium/low",
  "location": "where on the vehicle/document the VIN was found",
  "notes": "any additional observations"
}
Only return valid JSON, no other text.`;
        userPrompt = "Extract the Vehicle Identification Number (VIN) from this image. Return only JSON.";
        break;

      case "document":
        systemPrompt = `You are an expert OCR system for automotive documents.
Extract all relevant text and data from vehicle-related documents (registration, insurance cards, titles, etc.).
Return your response in this exact JSON format:
{
  "document_type": "type of document identified",
  "extracted_data": {
    "key fields": "extracted values"
  },
  "raw_text": "all text found in the document",
  "confidence": "high/medium/low"
}
Only return valid JSON, no other text.`;
        userPrompt = "Extract all text and data from this vehicle document. Return only JSON.";
        break;

      default:
        systemPrompt = `You are an expert OCR system. Extract all visible text from the image.
Return your response in this exact JSON format:
{
  "text": "all extracted text",
  "confidence": "high/medium/low",
  "notes": "any observations about the image"
}
Only return valid JSON, no other text.`;
        userPrompt = "Extract all text from this image. Return only JSON.";
    }

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
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: userPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
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
    const resultText = data.choices?.[0]?.message?.content;

    console.log("OCR scan complete, parsing result...");

    // Try to parse as JSON
    let result;
    try {
      // Clean up the response - remove markdown code blocks if present
      let cleanedText = resultText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.slice(7);
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.slice(3);
      }
      if (cleanedText.endsWith("```")) {
        cleanedText = cleanedText.slice(0, -3);
      }
      cleanedText = cleanedText.trim();
      
      result = JSON.parse(cleanedText);
    } catch {
      // If JSON parsing fails, return the raw text
      console.log("Could not parse as JSON, returning raw text");
      result = { 
        raw_text: resultText,
        error: "Could not parse structured data" 
      };
    }

    return new Response(
      JSON.stringify({ result, scanType }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ocr-scan function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
