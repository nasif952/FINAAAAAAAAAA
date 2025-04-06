
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse the request body or handle empty body
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: "Invalid request body" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { fileId } = body;
    
    if (!fileId) {
      return new Response(
        JSON.stringify({ error: "File ID is required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch file information
    const { data: fileData, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .single();

    if (fileError || !fileData) {
      return new Response(
        JSON.stringify({ error: "File not found", details: fileError?.message }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Download file from storage
    const { data: fileContent, error: downloadError } = await supabase
      .storage
      .from('pitch-decks')
      .download(fileData.storage_path);

    if (downloadError || !fileContent) {
      return new Response(
        JSON.stringify({ error: "Failed to download file", details: downloadError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract text from PDF (simplified - in a real implementation you'd use a PDF parsing library)
    // For this example, we'll simulate extracted content
    const extractedText = `This is simulated text extraction from the pitch deck: ${fileData.name}.
    Common pitch deck sections include:
    - Company Overview
    - Problem Statement
    - Solution Description
    - Market Opportunity
    - Business Model
    - Competition Analysis
    - Team Background
    - Financial Projections
    - Funding Request`;

    // Create a new analysis record
    const { data: analysis, error: analysisError } = await supabase
      .from('pitch_deck_analyses')
      .insert({
        file_id: fileId,
        title: fileData.name,
        status: 'processing'
      })
      .select()
      .single();

    if (analysisError || !analysis) {
      return new Response(
        JSON.stringify({ error: "Failed to create analysis record", details: analysisError?.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use OpenAI to analyze the pitch deck
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const prompt = `
    You are a venture capital expert analyzing a startup pitch deck. 
    The extracted text from the pitch deck is:
    
    ${extractedText}
    
    Please analyze this pitch deck and provide the following:
    1. An overall score from 1-10
    2. Strengths of the pitch deck
    3. Weaknesses that need improvement
    4. Specific scores (1-10) for the following categories:
       - Problem Definition
       - Solution Clarity
       - Market Analysis
       - Business Model
       - Team Qualifications
       - Financial Projections
       - Visual Design and Clarity
    5. Specific improvement recommendations
    
    Format your response as valid JSON with the following structure:
    {
      "overallScore": number,
      "strengths": [string, string, ...],
      "weaknesses": [string, string, ...],
      "metrics": {
        "problemDefinition": { "score": number, "feedback": string },
        "solutionClarity": { "score": number, "feedback": string },
        "marketAnalysis": { "score": number, "feedback": string },
        "businessModel": { "score": number, "feedback": string },
        "teamQualifications": { "score": number, "feedback": string },
        "financialProjections": { "score": number, "feedback": string },
        "visualDesign": { "score": number, "feedback": string }
      },
      "recommendations": [string, string, ...]
    }
    `;

    try {
      const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You are a venture capital expert who analyzes startup pitch decks. Respond with JSON only, no markdown.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });

      if (!openAIResponse.ok) {
        const errorData = await openAIResponse.text();
        console.error("OpenAI API error:", errorData);
        
        // Update analysis status to failed
        await supabase
          .from('pitch_deck_analyses')
          .update({ status: 'failed' })
          .eq('id', analysis.id);
          
        return new Response(
          JSON.stringify({ error: "AI analysis failed", details: errorData }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const openAIData = await openAIResponse.json();
      console.log("OpenAI response received:", openAIData);
      
      if (openAIData.error) {
        console.error("OpenAI API error:", openAIData.error);
        // Update analysis status to failed
        await supabase
          .from('pitch_deck_analyses')
          .update({ status: 'failed' })
          .eq('id', analysis.id);
          
        return new Response(
          JSON.stringify({ error: "AI analysis failed", details: openAIData.error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Get the raw content from OpenAI response
      let responseContent = openAIData.choices[0].message.content;
      
      // Extract JSON from the content if wrapped in markdown code blocks
      if (responseContent.includes('```json')) {
        responseContent = responseContent.replace(/```json\n|\n```/g, '');
      } else if (responseContent.includes('```')) {
        responseContent = responseContent.replace(/```\n|\n```/g, '');
      }
      
      // Parse the JSON response
      let analysisResult;
      try {
        analysisResult = JSON.parse(responseContent);
      } catch (jsonError) {
        console.error("Error parsing JSON from OpenAI response:", jsonError);
        console.log("Raw response content:", responseContent);
        
        // Update analysis status to failed
        await supabase
          .from('pitch_deck_analyses')
          .update({ status: 'failed' })
          .eq('id', analysis.id);
          
        return new Response(
          JSON.stringify({ error: "Failed to parse AI analysis result", details: jsonError.message, rawResponse: responseContent }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update the analysis record with the results
      await supabase
        .from('pitch_deck_analyses')
        .update({ 
          analysis: analysisResult,
          status: 'completed'
        })
        .eq('id', analysis.id);

      // Add metrics to the pitch_deck_metrics table
      const metricsToInsert = Object.entries(analysisResult.metrics).map(([key, value]) => ({
        analysis_id: analysis.id,
        metric_name: key,
        score: value.score,
        feedback: value.feedback
      }));

      await supabase.from('pitch_deck_metrics').insert(metricsToInsert);

      return new Response(
        JSON.stringify({ 
          success: true,
          analysis: {
            id: analysis.id,
            result: analysisResult
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      
      // Update analysis status to failed
      await supabase
        .from('pitch_deck_analyses')
        .update({ status: 'failed' })
        .eq('id', analysis.id);
        
      return new Response(
        JSON.stringify({ error: "Failed to analyze with AI", details: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error("Error in analyze-pitch-deck function:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
