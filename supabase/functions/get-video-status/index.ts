import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const url = new URL(req.url);
    const videoId = url.searchParams.get('videoId');

    if (!videoId) {
      return new Response(JSON.stringify({ error: 'videoId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Require auth and create client with user's token so RLS applies
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get video status
    const { data: video, error: videoError } = await supabaseClient
      .from('videos')
      .select(`
        *,
        reports (
          overlay_url,
          summary_json_url
        )
      `)
      .eq('id', videoId)
      .single();

    if (videoError) {
      console.error('Error fetching video:', videoError);
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If video is done and has reports, get signed URLs for the files
    let reportData = null;
    if (video.status === 'done' && video.reports && video.reports.length > 0) {
      const report = video.reports[0];
      
      if (report.overlay_url) {
        const { data: overlayUrl } = await supabaseClient.storage
          .from('videos')
          .createSignedUrl(report.overlay_url, 3600);
        
        report.overlay_signed_url = overlayUrl?.signedUrl;
      }

      if (report.summary_json_url) {
        const { data: summaryData } = await supabaseClient.storage
          .from('videos')
          .download(report.summary_json_url);
        
        if (summaryData) {
          const summaryText = await summaryData.text();
          report.summary_data = JSON.parse(summaryText);
        }
      }

      reportData = report;
    }

    return new Response(JSON.stringify({
      video: {
        id: video.id,
        status: video.status,
        error_message: video.error_message,
        fps: video.fps,
        width: video.width,
        height: video.height,
        created_at: video.created_at
      },
      report: reportData
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in get-video-status function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});