import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, Zap, Target, TrendingUp } from "lucide-react";
import appMockup from "@/assets/app-mockup.jpg";
const AnalysisPreview = () => {
  return <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="animate-fade-in">
            <Badge variant="secondary" className="mb-4 text-sm font-medium">
              AI-Powered Analysis
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Get Instant
              <span className="bg-gradient-secondary bg-clip-text text-transparent block">
                Performance Insights
              </span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Our advanced AI analyzes over 50 key points in your armswing mechanics, 
              comparing them to professional techniques to identify areas for improvement.
            </p>
            
            {/* Features List */}
            <div className="space-y-6 mb-8">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-primary p-3 rounded-lg shadow-athletic">
                  <Zap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Real-time Analysis</h3>
                  <p className="text-muted-foreground">Get instant feedback on your technique with frame-by-frame breakdown</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-gradient-secondary p-3 rounded-lg shadow-secondary">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Precision Tracking</h3>
                  <p className="text-muted-foreground">Track arm angle, approach timing, and jump mechanics with surgical precision</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-gradient-primary p-3 rounded-lg shadow-athletic">
                  <TrendingUp className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Progress Tracking</h3>
                  <p className="text-muted-foreground">Monitor improvement over time with detailed analytics and metrics</p>
                </div>
              </div>
            </div>
            
            <Button variant="athletic" size="lg" className="text-lg px-8 py-6">
              <Upload className="mr-2 h-5 w-5" />
              Start Analysis
            </Button>
          </div>
          
          {/* Right Content - App Mockup */}
          <div className="relative animate-scale-in">
            <div className="relative">
              <img src={appMockup} alt="Volleyball analysis app interface" className="w-full max-w-lg mx-auto rounded-2xl shadow-glow" />
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 animate-bounce-gentle">
                <Card className="p-3 bg-gradient-primary text-primary-foreground shadow-athletic">
                  <div className="text-center">
                    <div className="text-2xl font-bold">94%</div>
                    <div className="text-xs opacity-90">Accuracy</div>
                  </div>
                </Card>
              </div>
              
              <div className="absolute -bottom-4 -left-4 animate-bounce-gentle delay-100">
                <Card className="p-3 bg-gradient-secondary text-primary-foreground shadow-secondary">
                  <div className="text-center">
                    <div className="text-2xl font-bold">15%</div>
                    <div className="text-xs opacity-90">Improvement</div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default AnalysisPreview;