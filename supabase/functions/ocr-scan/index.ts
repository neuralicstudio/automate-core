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

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("OCR scanning image, type:", scanType);

    let systemPrompt = "";
    let userPrompt = "";

    switch (scanType) {
      case "license_plate":
        systemPrompt = `You are an expert OCR system specialized in reading vehicle license plates from around the world.

Your task is to extract the license plate number from the image with high accuracy.

Provide your response in this exact JSON format:
{
  "plate_number": "THE PLATE NUMBER",
  "confidence": "high/medium/low",
  "country_region": "Detected country or region if identifiable",
  "plate_type": "Standard/Commercial/Motorcycle/Diplomatic/etc",
  "notes": "Any additional observations"
}

If you cannot read the plate clearly, still provide your best guess with a low confidence rating.
Be casual in your notes - use Gen-Z friendly language!`;
        userPrompt = "Read the license plate number from this image. Extract all characters exactly as shown.";
        break;
      
      case "vin":
        systemPrompt = `You are an expert OCR system specialized in reading Vehicle Identification Numbers (VINs).

VINs are exactly 17 characters long and contain only letters (except I, O, Q) and numbers.

Provide your response in this exact JSON format:
{
  "vin": "THE 17 CHARACTER VIN",
  "confidence": "high/medium/low",
  "location": "Where on the vehicle/document the VIN was found",
  "validation": "Valid format/Invalid format",
  "notes": "Any additional observations"
}

If you cannot read the VIN clearly, provide your best guess. Be casual in notes!`;
        userPrompt = "Extract the VIN (Vehicle Identification Number) from this image. It should be exactly 17 characters.";
        break;
      
      case "document":
        systemPrompt = `You are an expert OCR system specialized in reading vehicle-related documents like registration cards, insurance papers, and inspection certificates.

Extract all relevant vehicle and owner information from the document.

Provide your response in this exact JSON format:
{
  "document_type": "Registration/Insurance/Inspection/Title/Other",
  "extracted_data": {
    "vehicle_info": {
      "make": "",
      "model": "",
      "year": "",
      "vin": "",
      "license_plate": "",
      "color": ""
    },
    "owner_info": {
      "name": "",
      "address": ""
    },
    "dates": {
      "issue_date": "",
      "expiry_date": ""
    },
    "other_info": {}
  },
  "confidence": "high/medium/low",
  "notes": "Any additional observations"
}

Only include fields that you can actually read. Be casual in notes!`;
        userPrompt = "Extract all vehicle and owner information from this document.";
        break;
      
      default:
        systemPrompt = `You are an expert OCR system. Extract all text visible in the image, focusing on any vehicle-related information like license plates, VINs, or document details.

Provide your response in this JSON format:
{
  "extracted_text": "All text found in the image",
  "vehicle_data": {
    "license_plate": "",
    "vin": "",
    "make": "",
    "model": "",
    "year": ""
  },
  "confidence": "high/medium/low",
  "notes": "Any observations"
}

Be casual and Gen-Z friendly in your notes!`;
        userPrompt = "Extract all text from this image, especially any vehicle-related information.";
    }

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
    const resultText = data.choices?.[0]?.message?.content;

    // Try to parse JSON from the response
    let result;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = resultText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        result = { raw_text: resultText };
      }
    } catch {
      result = { raw_text: resultText };
    }

    console.log("OCR scan complete");

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
