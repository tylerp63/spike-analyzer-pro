import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Download, ArrowRight, Star } from "lucide-react";
import analysisBackground from "@/assets/analysis-background.jpg";

const CTA = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={analysisBackground} 
          alt="Volleyball court analysis" 
          className="w-full h-full object-cover opacity-10"
        />
        <div className="absolute inset-0 bg-gradient-hero opacity-80"></div>
      </div>
      
      <div className="container mx-auto px-6 relative z-10">
        <Card className="max-w-4xl mx-auto p-12 bg-card/95 backdrop-blur-sm border-primary/20 shadow-glow">
          <div className="text-center animate-fade-in">
            <div className="flex justify-center items-center gap-2 mb-6">
              <div className="flex text-primary">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-6 w-6 fill-current" />
                ))}
              </div>
              <span className="text-muted-foreground font-medium">
                4.9/5 from 10,000+ athletes
              </span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Ready to
              <span className="bg-gradient-primary bg-clip-text text-transparent block">
                Elevate Your Game?
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Join thousands of volleyball players who have improved their technique 
              with our AI-powered analysis. Download the app and start your journey today.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button variant="hero" size="lg" className="text-lg px-8 py-6">
                <Download className="mr-2 h-5 w-5" />
                Download for iOS
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 border-2">
                Learn More
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
            
            {/* Trust indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-primary/20">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">50K+</div>
                <div className="text-sm text-muted-foreground">Videos Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">95%</div>
                <div className="text-sm text-muted-foreground">Accuracy Rate</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">200+</div>
                <div className="text-sm text-muted-foreground">Pro Players</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">AI Analysis</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};

export default CTA;