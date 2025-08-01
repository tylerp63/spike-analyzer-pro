import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Camera, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/volleyball-hero.jpg";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-subtle">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img 
          src={heroImage} 
          alt="Professional volleyball player" 
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-60"></div>
      </div>
      
      {/* Hero Content */}
      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
            Perfect Your
            <span className="bg-gradient-primary bg-clip-text text-transparent block">
              Volleyball Technique
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            AI-powered analysis of your armswing mechanics compared to professional players. 
            Get personalized insights to elevate your game.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 shadow-athletic"
              onClick={() => navigate("/analysis")}
            >
              <Camera className="mr-2 h-5 w-5" />
              Analyze My Technique
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </Button>
          </div>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20 hover:shadow-athletic transition-all duration-300 animate-scale-in">
              <Camera className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Video Analysis</h3>
              <p className="text-muted-foreground">
                Upload or record your armswing for instant AI-powered breakdown
              </p>
            </Card>
            
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20 hover:shadow-athletic transition-all duration-300 animate-scale-in">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Pro Comparison</h3>
              <p className="text-muted-foreground">
                Compare your mechanics against professional volleyball players
              </p>
            </Card>
            
            <Card className="p-6 bg-card/80 backdrop-blur-sm border-primary/20 hover:shadow-athletic transition-all duration-300 animate-scale-in">
              <Play className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Custom Training</h3>
              <p className="text-muted-foreground">
                Get personalized drills and tips to improve your technique
              </p>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;