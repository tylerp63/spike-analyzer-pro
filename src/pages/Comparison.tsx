import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Play, Pause, RotateCcw, Users, Target } from "lucide-react";

const Comparison = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userVideo = location.state?.userVideo;
  
  const [selectedPro, setSelectedPro] = useState("jordan-larson");
  const [syncedPlayback, setSyncedPlayback] = useState(true);
  const [currentFrame, setCurrentFrame] = useState(0);

  const professionalPlayers = [
    {
      id: "jordan-larson",
      name: "Jordan Larson",
      team: "USA National Team",
      position: "Outside Hitter",
      video: "/api/placeholder/400/300", // In real app, this would be actual video URLs
      matchPercentage: 78,
      strengths: ["Power", "Consistency", "Approach"],
    },
    {
      id: "zhu-ting",
      name: "Zhu Ting",
      team: "China National Team", 
      position: "Outside Hitter",
      video: "/api/placeholder/400/300",
      matchPercentage: 72,
      strengths: ["Technique", "Precision", "Jump Height"],
    },
    {
      id: "paola-egonu",
      name: "Paola Egonu",
      team: "Italy National Team",
      position: "Opposite",
      video: "/api/placeholder/400/300", 
      matchPercentage: 85,
      strengths: ["Explosive Power", "Arm Swing", "Attack Speed"],
    }
  ];

  const currentPro = professionalPlayers.find(p => p.id === selectedPro);

  const comparisonPoints = [
    {
      frame: 15,
      title: "Approach Start",
      userNote: "Good initial positioning",
      proNote: "Optimal angle and speed",
      difference: "Your approach could be 0.2s faster"
    },
    {
      frame: 35,
      title: "Jump Phase",
      userNote: "Excellent vertical jump",
      proNote: "Efficient energy transfer",
      difference: "Similar jump height achieved"
    },
    {
      frame: 45,
      title: "Arm Draw",
      userNote: "Slightly late arm preparation",
      proNote: "Perfect timing and extension",
      difference: "Arm draw 0.1s behind optimal timing"
    },
    {
      frame: 52,
      title: "Contact Point",
      userNote: "Contact behind ideal position",
      proNote: "Optimal contact at peak",
      difference: "Move contact point 6 inches forward"
    },
    {
      frame: 60,
      title: "Follow Through",
      userNote: "Good snap and direction",
      proNote: "Complete extension and snap",
      difference: "Follow through technique is comparable"
    }
  ];

  if (!userVideo) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No video data found</p>
            <Button onClick={() => navigate("/analysis")}>
              Go to Analysis
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/results", { state: { videoUrl: userVideo } })} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Results
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Professional Comparison
          </h1>
        </div>

        {/* Professional Player Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Compare with Professional
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Select value={selectedPro} onValueChange={setSelectedPro}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {professionalPlayers.map(player => (
                    <SelectItem key={player.id} value={player.id}>
                      {player.name} - {player.team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {currentPro && (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{currentPro.matchPercentage}% Match</Badge>
                  <Badge variant="outline">{currentPro.position}</Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* User Video */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Your Spike</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                <video
                  src={userVideo}
                  controls={!syncedPlayback}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2">
                <Badge variant="outline">Analysis Subject</Badge>
                <p className="text-sm text-muted-foreground">
                  Your recorded spike for comparison analysis
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Professional Video */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {currentPro?.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                {/* Placeholder for professional video */}
                <div className="w-full h-full bg-gradient-secondary flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="w-16 h-16 mx-auto mb-2 opacity-80" />
                    <p className="text-sm opacity-80">Professional Spike Video</p>
                    <p className="text-xs opacity-60">{currentPro?.name}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Badge variant="secondary">{currentPro?.team}</Badge>
                  <Badge variant="outline">{currentPro?.position}</Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {currentPro?.strengths.map((strength, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {strength}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Synchronized Playback Controls */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Synchronized Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Button variant="outline" className="gap-2">
                <Play className="w-4 h-4" />
                Play Both
              </Button>
              <Button variant="outline" className="gap-2">
                <Pause className="w-4 h-4" />
                Pause
              </Button>
              <Button variant="outline" className="gap-2">
                <RotateCcw className="w-4 h-4" />
                Restart
              </Button>
              <div className="text-sm text-muted-foreground">
                Frame: {currentFrame}/60
              </div>
            </div>
            
            {/* Frame scrubber */}
            <div className="w-full bg-muted rounded-full h-2 mb-4">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-200"
                style={{ width: `${(currentFrame / 60) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Frame-by-Frame Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Frame-by-Frame Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {comparisonPoints.map((point, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs">
                          {point.frame}
                        </span>
                        {point.title}
                      </h4>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Your Technique:</p>
                        <p className="text-sm text-muted-foreground">{point.userNote}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-green-600">Pro Technique:</p>
                        <p className="text-sm text-muted-foreground">{point.proNote}</p>
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-sm font-medium text-orange-600">Key Difference:</p>
                      <p className="text-sm text-muted-foreground">{point.difference}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Comparison;