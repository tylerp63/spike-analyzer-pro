-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', false);

-- Create videos table
CREATE TABLE public.videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'done', 'failed')),
  error_message TEXT,
  storage_key TEXT NOT NULL,
  fps INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  overlay_url TEXT,
  summary_json_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for videos
CREATE POLICY "Users can view their own videos" 
ON public.videos 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own videos" 
ON public.videos 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own videos" 
ON public.videos 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create RLS policies for reports
CREATE POLICY "Users can view their own reports" 
ON public.reports 
FOR SELECT 
USING (auth.uid() = (SELECT user_id FROM public.videos WHERE id = video_id));

CREATE POLICY "Users can insert reports for their videos" 
ON public.reports 
FOR INSERT 
WITH CHECK (auth.uid() = (SELECT user_id FROM public.videos WHERE id = video_id));

-- Create storage policies for videos bucket
CREATE POLICY "Users can view their own video files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own video files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Service role can manage all video files" 
ON storage.objects 
FOR ALL 
USING (bucket_id = 'videos');

-- Create indexes for better performance
CREATE INDEX idx_videos_user_id ON public.videos(user_id);
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_reports_video_id ON public.reports(video_id);