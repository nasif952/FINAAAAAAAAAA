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
    // Initialize Supabase client with service role key (admin privileges)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Missing environment variables" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Check if the bucket already exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      return new Response(
        JSON.stringify({ error: "Failed to list buckets", details: bucketsError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const dataRoomBucket = buckets?.find(b => b.name === 'data_room');
    
    // If bucket already exists, return success
    if (dataRoomBucket) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "data_room bucket already exists",
          bucket: dataRoomBucket 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create the data_room bucket with public = false (private bucket)
    const { data: newBucket, error: createError } = await supabase.storage.createBucket('data_room', {
      public: false,
      fileSizeLimit: 52428800, // 50MB limit
      allowedMimeTypes: [
        'application/pdf', 
        'image/png', 
        'image/jpeg', 
        'application/vnd.ms-excel', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ]
    });
    
    if (createError) {
      return new Response(
        JSON.stringify({ error: "Failed to create bucket", details: createError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Create RLS policy to allow authenticated users to upload files
    const { error: policyError } = await supabase
      .rpc('create_storage_policy', { 
        bucket_name: 'data_room',
        policy_name: 'authenticated_users_can_upload',
        policy_definition: '(auth.role() = \'authenticated\')::boolean'
      });
    
    if (policyError) {
      console.error("Policy creation error:", policyError);
      // Continue execution - not failing because the bucket was created
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "data_room bucket created successfully",
        bucket: newBucket
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}); 