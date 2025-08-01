import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, Target, Zap, Users, Play } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const videoUrl = location.state?.videoUrl;

  const performanceData = [
    { metric: "Approach Speed", value: 85, target: 90 },
    { metric: "Jump Height", value: 92, target: 85 },
    { metric: "Arm Swing", value: 78, target: 88 },
    { metric: "Contact Point", value: 88, target: 90 },
    { metric: "Follow Through", value: 82, target: 85 },
  ];

  const radarData = [
    { skill: "Power", A: 78, B: 95, fullMark: 100 },
    { skill: "Timing", A: 85, B: 88, fullMark: 100 },
    { skill: "Technique", A: 82, B: 92, fullMark: 100 },
    { skill: "Consistency", A: 75, B: 90, fullMark: 100 },
    { skill: "Approach", A: 88, B: 85, fullMark: 100 },
    { skill: "Jump", A: 92, B: 87, fullMark: 100 },
  ];

  const recommendations = [
    {
      category: "Arm Swing",
      issue: "Late arm draw-back during approach",
      drill: "Wall Hitting Drill",
      description: "Practice arm swing motion against a wall to improve timing and muscle memory.",
      priority: "High"
    },
    {
      category: "Approach",
      issue: "Inconsistent foot placement",
      drill: "Cone Approach Training",
      description: "Use cones to mark optimal foot placement positions during approach.",
      priority: "Medium"
    },
    {
      category: "Contact Point",
      issue: "Contact slightly behind optimal position",
      drill: "Box Jumping + Contact",
      description: "Practice jumping from a box to reach optimal contact point consistently.",
      priority: "High"
    }
  ];

  const professionalComparison = {
    name: "Jordan Larson",
    team: "USA National Team",
    matchPercentage: 78,
    similarStrengths: ["Jump height", "Approach speed", "Explosive power"],
    improvementAreas: ["Arm swing timing", "Contact consistency"]
  };

  if (!videoUrl) {
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={() => navigate("/analysis")} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Analysis
          </Button>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Analysis Results
          </h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5 text-primary" />
                Your Spike
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg overflow-hidden mb-4">
                <video
                  src={videoUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              </div>
              <Button 
                onClick={() => navigate("/comparison", { state: { userVideo: videoUrl } })}
                className="w-full gap-2"
              >
                <Users className="w-4 h-4" />
                Compare with Pro
              </Button>
            </CardContent>
          </Card>

          {/* Main Results */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="technique">Technique</TabsTrigger>
                <TabsTrigger value="comparison">Pro Match</TabsTrigger>
                <TabsTrigger value="drills">Drills</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      Performance Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {performanceData.map((item, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{item.metric}</span>
                            <span className="text-sm text-muted-foreground">
                              {item.value}% (Target: {item.target}%)
                            </span>
                          </div>
                          <Progress value={item.value} className="h-2" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Overall Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">85/100</div>
                      <Badge variant="secondary" className="mb-4">Advanced Level</Badge>
                      <p className="text-sm text-muted-foreground">
                        Great power and jump height! Focus on arm swing timing for next level improvement.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="technique" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Skill Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="skill" />
                          <PolarRadiusAxis angle={60} domain={[0, 100]} />
                          <Radar name="Your Performance" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} />
                          <Radar name="Target Level" dataKey="B" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.1} />
                          <Tooltip />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Frame-by-Frame Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Frame 45-50: Approach Phase</p>
                          <p className="text-sm text-muted-foreground">Good acceleration and timing</p>
                        </div>
                        <Badge variant="secondary">Excellent</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Frame 51-55: Take-off</p>
                          <p className="text-sm text-muted-foreground">Vertical jump could be optimized</p>
                        </div>
                        <Badge variant="outline">Good</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Frame 56-60: Contact</p>
                          <p className="text-sm text-muted-foreground">Late arm swing affects power</p>
                        </div>
                        <Badge variant="destructive">Needs Work</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comparison" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Professional Match: {professionalComparison.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {professionalComparison.matchPercentage}% Match
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {professionalComparison.team}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-green-600">Similar Strengths</h4>
                        <div className="space-y-1">
                          {professionalComparison.similarStrengths.map((strength, index) => (
                            <Badge key={index} variant="secondary" className="mr-2">
                              {strength}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-semibold mb-2 text-orange-600">Areas for Improvement</h4>
                        <div className="space-y-1">
                          {professionalComparison.improvementAreas.map((area, index) => (
                            <Badge key={index} variant="outline" className="mr-2">
                              {area}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="drills" className="space-y-4">
                <div className="space-y-4">
                  {recommendations.map((rec, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            {rec.drill}
                          </CardTitle>
                          <Badge variant={rec.priority === "High" ? "destructive" : "secondary"}>
                            {rec.priority} Priority
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="font-medium text-sm">Issue: {rec.issue}</p>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                          <Badge variant="outline">{rec.category}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;