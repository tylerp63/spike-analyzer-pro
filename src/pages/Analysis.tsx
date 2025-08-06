import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Video, Camera, Upload, Play, Pause, RotateCcw, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Analysis = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const statusPollRef = useRef<NodeJS.Timeout | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<'idle' | 'queued' | 'processing' | 'done' | 'failed'>('idle');
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auth state management
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
      }
      stopCamera();
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast.error("Camera access denied or not available");
      console.error("Camera error:", error);
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(() => {
    if (streamRef.current) {
      const mediaRecorder = new MediaRecorder(streamRef.current);
      const chunks: BlobPart[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setRecordedVideo(url);
        setRecordedBlob(blob);
        stopCamera();
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      toast.success("Recording started");
    }
  }, [stopCamera]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      toast.success("Recording completed");
    }
  }, [isRecording]);

  const toggleFacingMode = useCallback(() => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
    if (cameraActive) {
      stopCamera();
      setTimeout(startCamera, 100);
    }
  }, [cameraActive, stopCamera, startCamera]);

  const uploadVideo = useCallback(async (videoBlob: Blob) => {
    if (!user) {
      toast.error("Please sign in to upload videos");
      return;
    }

    setIsUploading(true);
    setVideoStatus('queued');
    setErrorMessage(null);

    try {
      // Create video record and get upload URL
      const { data, error } = await supabase.functions.invoke('create-video', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        }
      });

      if (error) throw error;

      const { videoId, uploadUrl } = data;

      // Upload the video file
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: videoBlob,
        headers: {
          'Content-Type': 'video/webm',
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload video');
      }

      setUploadedVideoId(videoId);
      toast.success("Video uploaded successfully! Processing started...");

      // Trigger video processing without blocking UI
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      supabase.functions
        .invoke('process-video', {
          body: { videoId },
          headers: { Authorization: `Bearer ${token}` },
        })
        .catch(console.error);

      // Start polling for status
      pollVideoStatus(videoId);

    } catch (error) {
      console.error('Upload error:', error);
      toast.error("Failed to upload video");
      setVideoStatus('failed');
      setErrorMessage(error.message);
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  const pollVideoStatus = useCallback(async (videoId: string) => {
    const poll = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('get-video-status', {
          body: { videoId },
          headers: {
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          }
        });

        if (error) throw error;

        const { video, report } = data;
        setVideoStatus(video.status);
        setErrorMessage(video.error_message);

        if (video.status === 'processing') {
          // Simulate progress for processing status
          setAnalysisProgress(prev => Math.min(prev + 5, 95));
        } else if (video.status === 'done') {
          setAnalysisProgress(100);
          if (statusPollRef.current) {
            clearInterval(statusPollRef.current);
          }
          toast.success("Analysis completed!");
          
          // Navigate to results with the report data
          setTimeout(() => {
            navigate("/results", { 
              state: { 
                videoId,
                videoUrl: recordedVideo,
                report: report?.summary_data,
                overlayUrl: report?.overlay_signed_url
              } 
            });
          }, 1000);
        } else if (video.status === 'failed') {
          if (statusPollRef.current) {
            clearInterval(statusPollRef.current);
          }
          toast.error("Analysis failed: " + (video.error_message || "Unknown error"));
        }
      } catch (error) {
        console.error('Status poll error:', error);
      }
    };

    // Initial poll
    await poll();

    // Set up polling interval
    statusPollRef.current = setInterval(poll, 3000);
  }, [navigate, recordedVideo]);

  const analyzeVideo = useCallback(async () => {
    if (!recordedBlob) {
      toast.error("No video to analyze");
      return;
    }

    setAnalysisProgress(0);
    await uploadVideo(recordedBlob);
  }, [recordedBlob, uploadVideo]);

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setRecordedVideo(url);
      setRecordedBlob(file);
      toast.success("Video uploaded successfully");
    } else {
      toast.error("Please select a valid video file");
    }
  }, []);

  const resetAnalysis = useCallback(() => {
    setRecordedVideo(null);
    setRecordedBlob(null);
    setUploadedVideoId(null);
    setVideoStatus('idle');
    setAnalysisProgress(0);
    setErrorMessage(null);
    if (statusPollRef.current) {
      clearInterval(statusPollRef.current);
    }
  }, []);

  const getStatusDisplay = () => {
    switch (videoStatus) {
      case 'queued':
        return { icon: <Upload className="w-4 h-4" />, text: "Queued for processing", color: "bg-blue-500" };
      case 'processing':
        return { icon: <Play className="w-4 h-4" />, text: "Processing video", color: "bg-yellow-500" };
      case 'done':
        return { icon: <CheckCircle className="w-4 h-4" />, text: "Analysis complete", color: "bg-green-500" };
      case 'failed':
        return { icon: <AlertCircle className="w-4 h-4" />, text: "Analysis failed", color: "bg-red-500" };
      default:
        return null;
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Spike Analysis
          </h1>
        </div>

        {!user && (
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">Sign in to analyze your volleyball spikes</p>
                <Button onClick={() => navigate('/auth')}>Sign In</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Camera/Video Section */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Record Your Spike
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                {recordedVideo ? (
                  <video
                    src={recordedVideo}
                    controls
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                )}
                
                {!cameraActive && !recordedVideo && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Start camera to begin recording</p>
                    </div>
                  </div>
                )}

                {isRecording && (
                  <div className="absolute top-4 left-4">
                    <Badge variant="destructive" className="animate-pulse">
                      REC
                    </Badge>
                  </div>
                )}

                {statusDisplay && (
                  <div className="absolute bottom-4 left-4">
                    <Badge className={`${statusDisplay.color} text-white gap-2`}>
                      {statusDisplay.icon}
                      {statusDisplay.text}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {!cameraActive && !recordedVideo && videoStatus === 'idle' && (
                  <Button onClick={startCamera} className="flex-1 gap-2" disabled={!user}>
                    <Camera className="w-4 h-4" />
                    Start Camera
                  </Button>
                )}

                {cameraActive && !isRecording && (
                  <>
                    <Button onClick={startRecording} className="flex-1 gap-2">
                      <Play className="w-4 h-4" />
                      Start Recording
                    </Button>
                    <Button variant="outline" onClick={toggleFacingMode} className="gap-2">
                      <RotateCcw className="w-4 h-4" />
                      Flip Camera
                    </Button>
                  </>
                )}

                {isRecording && (
                  <Button onClick={stopRecording} variant="destructive" className="flex-1 gap-2">
                    <Pause className="w-4 h-4" />
                    Stop Recording
                  </Button>
                )}

                {recordedVideo && videoStatus === 'idle' && (
                  <Button onClick={resetAnalysis} variant="outline" className="flex-1 gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Record Again
                  </Button>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Or upload a video</p>
                <label htmlFor="video-upload">
                  <Button 
                    variant="outline" 
                    className="gap-2 cursor-pointer" 
                    asChild 
                    disabled={!user || videoStatus !== 'idle'}
                  >
                    <span>
                      <Upload className="w-4 h-4" />
                      Upload Video
                    </span>
                  </Button>
                </label>
                <input
                  id="video-upload"
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={!user || videoStatus !== 'idle'}
                />
              </div>
            </CardContent>
          </Card>

          {/* Analysis Controls */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>Analysis Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!recordedVideo && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Record or upload a video to begin analysis</p>
                </div>
              )}

              {recordedVideo && videoStatus === 'idle' && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Analysis Features</h3>
                  <div className="space-y-2">
                    <Badge variant="secondary">Step Ratio Analysis</Badge>
                    <Badge variant="secondary">Knee Flex Assessment</Badge>
                    <Badge variant="secondary">Trunk Angle Analysis</Badge>
                    <Badge variant="secondary">Approach Speed</Badge>
                    <Badge variant="secondary">Jump Timing</Badge>
                  </div>
                  
                  <Button 
                    onClick={analyzeVideo} 
                    className="w-full gap-2 shadow-athletic"
                    disabled={!user || isUploading}
                  >
                    <Play className="w-4 h-4" />
                    {isUploading ? "Uploading..." : "Start Analysis"}
                  </Button>
                </div>
              )}

              {['queued', 'processing'].includes(videoStatus) && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Analyzing Your Spike...</h3>
                  <Progress value={analysisProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {analysisProgress}% Complete
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      {videoStatus === 'queued' && "Queued for processing..."}
                      {videoStatus === 'processing' && analysisProgress < 30 && "Processing video frames..."}
                      {videoStatus === 'processing' && analysisProgress >= 30 && analysisProgress < 60 && "Detecting body pose..."}
                      {videoStatus === 'processing' && analysisProgress >= 60 && analysisProgress < 90 && "Analyzing technique..."}
                      {videoStatus === 'processing' && analysisProgress >= 90 && "Generating recommendations..."}
                    </p>
                  </div>
                </div>
              )}

              {videoStatus === 'failed' && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-red-600">Analysis Failed</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      {errorMessage || "An error occurred during analysis"}
                    </p>
                  </div>
                  <Button onClick={resetAnalysis} variant="outline" className="w-full">
                    Try Again
                  </Button>
                </div>
              )}

              {videoStatus === 'done' && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-green-600">Analysis Complete!</h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Redirecting to results...
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Analysis;