import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { videoId } = await req.json();
    if (!videoId) {
      return new Response(JSON.stringify({ error: 'videoId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: video, error: videoError } = await supabaseAdmin
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError || !video) {
      return new Response(JSON.stringify({ error: 'Video not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    await supabaseAdmin.from('videos').update({ status: 'processing', error_message: null }).eq('id', videoId);

    try {
      const { data: videoFile, error: downloadError } = await supabaseAdmin.storage
        .from('videos')
        .download(video.storage_key);

      if (downloadError || !videoFile) {
        throw downloadError || new Error('Failed to download video');
      }

      // Placeholder analysis: simply re-upload the original video as overlay and a basic summary JSON
      const overlayPath = `processed/${videoId}/overlay.mp4`;
      const summaryPath = `processed/${videoId}/summary.json`;

      await supabaseAdmin.storage
        .from('videos')
        .upload(overlayPath, videoFile, { upsert: true, contentType: 'video/mp4' });

      const summaryBlob = new Blob([JSON.stringify({ message: 'Analysis complete' })], {
        type: 'application/json',
      });

      await supabaseAdmin.storage
        .from('videos')
        .upload(summaryPath, summaryBlob, { upsert: true, contentType: 'application/json' });

      await supabaseAdmin.from('reports').insert({
        video_id: videoId,
        overlay_url: overlayPath,
        summary_json_url: summaryPath,
      });

      await supabaseAdmin.from('videos').update({ status: 'done' }).eq('id', videoId);

      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (processingError) {
      console.error('Processing error:', processingError);
      await supabaseAdmin
        .from('videos')
        .update({ status: 'failed', error_message: processingError.message })
        .eq('id', videoId);

      return new Response(JSON.stringify({ error: processingError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error) {
    console.error('Error in process-video function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
