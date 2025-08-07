# Volleyball CV Worker (RunPod-ready)

This worker polls Supabase for queued videos, runs pose/metrics, uploads an overlay MP4 and a JSON report, and updates DB status.

Quick start
- Create a RunPod image with Python 3.10+ and GPU (optional). Install requirements:
  pip install -r requirements.txt
- Set env vars in RunPod (Secrets):
  - SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - SUPABASE_BUCKET=videos
- Start the worker:
  python -u main.py

Flow
1) Poll public.videos for status='queued' (oldest first)
2) Update -> 'processing'
3) Download raw video from Storage (bucket 'videos') using storage_key
4) Probe fps/size; update videos row
5) Run YOLO pose on frames (downsample to ~30 FPS)
6) Smooth keypoints, detect events, compute metrics
7) Render overlay, upload to Storage
8) Write public.reports row; set videos.status='done'

Notes
- The code expects raw uploads to be WebM (we set storage_key to .webm). OpenCV requires FFmpeg; use opencv-python-headless wheels that include FFmpeg.
- If <80% frames lack keypoints, the worker stores a partial report and sets a helpful error_message.
- Tweak batch size, model, and smoothing for performance.
