import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Video, Camera, Upload, Play, Pause, RotateCcw, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const Analysis = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

  const analyzeVideo = useCallback(async () => {
    if (!recordedVideo) return;
    
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    // Simulate analysis progress
    const interval = setInterval(() => {
      setAnalysisProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsAnalyzing(false);
          toast.success("Analysis completed!");
          navigate("/results", { state: { videoUrl: recordedVideo } });
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  }, [recordedVideo, navigate]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      const url = URL.createObjectURL(file);
      setRecordedVideo(url);
      toast.success("Video uploaded successfully");
    } else {
      toast.error("Please select a valid video file");
    }
  }, []);

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
              </div>

              <div className="flex flex-wrap gap-2">
                {!cameraActive && !recordedVideo && (
                  <Button onClick={startCamera} className="flex-1 gap-2">
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

                {recordedVideo && (
                  <Button onClick={() => {
                    setRecordedVideo(null);
                    startCamera();
                  }} variant="outline" className="flex-1 gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Record Again
                  </Button>
                )}
              </div>

              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Or upload a video</p>
                <label htmlFor="video-upload">
                  <Button variant="outline" className="gap-2 cursor-pointer" asChild>
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

              {recordedVideo && !isAnalyzing && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Analysis Features</h3>
                  <div className="space-y-2">
                    <Badge variant="secondary">Approach Angle Analysis</Badge>
                    <Badge variant="secondary">Jump Timing Assessment</Badge>
                    <Badge variant="secondary">Arm Swing Mechanics</Badge>
                    <Badge variant="secondary">Contact Point Analysis</Badge>
                    <Badge variant="secondary">Professional Comparison</Badge>
                  </div>
                  
                  <Button onClick={analyzeVideo} className="w-full gap-2 shadow-athletic">
                    <Play className="w-4 h-4" />
                    Start Analysis
                  </Button>
                </div>
              )}

              {isAnalyzing && (
                <div className="space-y-4">
                  <h3 className="font-semibold">Analyzing Your Spike...</h3>
                  <Progress value={analysisProgress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {analysisProgress}% Complete
                  </p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      {analysisProgress < 30 && "Processing video frames..."}
                      {analysisProgress >= 30 && analysisProgress < 60 && "Detecting body pose..."}
                      {analysisProgress >= 60 && analysisProgress < 90 && "Analyzing technique..."}
                      {analysisProgress >= 90 && "Generating recommendations..."}
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