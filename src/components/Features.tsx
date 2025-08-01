import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  BarChart3, 
  Users, 
  Brain, 
  Trophy, 
  Smartphone 
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Video,
      title: "Video Upload & Recording",
      description: "Capture your armswing from any angle. Our AI works with any smartphone camera quality.",
      badge: "Core Feature"
    },
    {
      icon: Brain,
      title: "AI Motion Analysis",
      description: "Advanced computer vision analyzes 50+ biomechanical markers in your technique.",
      badge: "AI Powered"
    },
    {
      icon: Users,
      title: "Pro Player Database",
      description: "Compare against elite volleyball players' techniques from around the world.",
      badge: "Premium"
    },
    {
      icon: BarChart3,
      title: "Detailed Metrics",
      description: "Get precise measurements on arm swing speed, angle, timing, and approach pattern.",
      badge: "Analytics"
    },
    {
      icon: Trophy,
      title: "Improvement Plans",
      description: "Receive personalized training recommendations based on your analysis results.",
      badge: "Coaching"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Designed specifically for iOS with seamless performance and intuitive interface.",
      badge: "iOS Native"
    }
  ];

  return (
    <section className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16 animate-fade-in">
          <Badge variant="secondary" className="mb-4 text-sm font-medium">
            Complete Solution
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Everything You Need to
            <span className="bg-gradient-hero bg-clip-text text-transparent block">
              Master Your Technique
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From video capture to professional analysis, we provide comprehensive tools 
            to transform your volleyball performance.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="p-8 hover:shadow-athletic transition-all duration-300 group border-primary/10 hover:border-primary/30 animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="mb-6 relative">
                <div className="bg-gradient-primary p-4 rounded-xl shadow-athletic w-fit group-hover:shadow-glow transition-all duration-300">
                  <feature.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <Badge 
                  variant="outline" 
                  className="absolute -top-2 -right-2 text-xs border-primary/30 bg-background"
                >
                  {feature.badge}
                </Badge>
              </div>
              
              <h3 className="text-xl font-semibold mb-4 text-foreground group-hover:text-primary transition-colors">
                {feature.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;