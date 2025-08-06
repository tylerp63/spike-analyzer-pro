import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Users, Play, Zap, Target } from "lucide-react";
import baselines from "@/data/pro-baselines.json";
import { evaluateMetrics, BaselineStatus } from "@/lib/baseline";

const metricLabels: Record<string, string> = {
  arm_cock_peak_deg: "Arm Cock (°)",
  elbow_extension_peak_deg: "Elbow Extension (°)",
  torso_lean_deg: "Torso Lean (°)",
  penultimate_last_ratio: "Step Ratio",
  jump_time_s: "Jump Time (s)",
  time_to_contact_s: "Time to Contact (s)",
};

function statusBadge(status: BaselineStatus) {
  switch (status) {
    case "within":
      return <Badge className="bg-green-500 text-white">Within</Badge>;
    case "close":
      return <Badge className="bg-yellow-500 text-black">Close</Badge>;
    default:
      return <Badge className="bg-red-500 text-white">Needs Work</Badge>;
  }
}

const Results = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { videoUrl, report, overlayUrl } = location.state || {};

  const [baselineKey, setBaselineKey] = useState<keyof typeof baselines>(
    "baseline_male_outside"
  );

  const baseline = baselines[baselineKey];
  const metrics = {
    arm_cock_peak_deg: report?.angles?.arm_cock_peak_deg,
    elbow_extension_peak_deg: report?.angles?.elbow_extension_peak_deg,
    torso_lean_deg: report?.angles?.torso_lean_deg,
    penultimate_last_ratio: report?.timing?.penultimate_last_ratio,
    jump_time_s: report?.timing?.jump_time_s,
    time_to_contact_s: report?.timing?.time_to_contact_s,
  } as Record<string, number | undefined>;

  const statuses = evaluateMetrics(metrics, baseline);

  if (!videoUrl && !overlayUrl) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">No video data found</p>
            <Button onClick={() => navigate("/analysis")}>Go to Analysis</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const displayVideo = overlayUrl || videoUrl;

  return (
    <div className="min-h-screen bg-gradient-subtle p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => navigate("/analysis")}
            className="gap-2"
          >
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
                <video src={displayVideo} controls className="w-full h-full object-cover" />
              </div>
              {videoUrl && (
                <Button
                  onClick={() => navigate("/comparison", { state: { userVideo: videoUrl } })}
                  className="w-full gap-2"
                >
                  <Users className="w-4 h-4" />
                  Compare with Pro
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Metrics and Drills */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="drills">Drills</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-primary" />
                      Baseline Comparison
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Select
                      value={baselineKey}
                      onValueChange={(v) => setBaselineKey(v as keyof typeof baselines)}
                    >
                      <SelectTrigger className="w-64 mb-4">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(baselines).map((key) => (
                          <SelectItem key={key} value={key}>
                            {key.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="space-y-2">
                      {Object.entries(metrics).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="font-medium">
                            {metricLabels[key as keyof typeof metricLabels] || key}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>
                              {typeof value === "number" ? value.toFixed(2) : "—"}
                            </span>
                            {statuses[key] && statusBadge(statuses[key])}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="drills" className="space-y-4">
                {report?.recommendations?.length ? (
                  report.recommendations.map((rec: any, index: number) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Zap className="w-5 h-5 text-primary" />
                          {rec.drillId}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">Focus: {rec.focus}</p>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No recommendations available.
                  </p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
