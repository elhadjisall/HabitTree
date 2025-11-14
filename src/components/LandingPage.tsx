import { Check, Target, TrendingUp, Calendar, Award, Zap, TreePalm, Leaf, Sprout, UserRoundPlus, UserIcon, ThumbsUp } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import AuthDialog from './AuthDialog';
import { useState } from 'react';

interface LandingPageProps {
  onLogin: () => void;
}

export default function LandingPage({ onLogin }: LandingPageProps) {
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  const features = [
    {
      icon: Sprout,
      title: 'Set Goals',
      description: 'Plant your goals today and watch them grow into habits.'
    },
    {
      icon: Leaf,
      title: 'Track Daily',
      description: 'Water your tree daily with consistency. Turn your everyday actions into living growth.'
    },
    {
      icon: TrendingUp,
      title: 'View Progress',
      description: "Progress isn't just numbers — it's a tree that thrives with you."
    },
    {
      icon: Leaf,
      title: 'Earn Leaf Dollars',
      description: 'Consistency turns into currency — earn Leaf Dollars daily! Earn Leaf Dollars with every good habit 🌿'
    },
    {
      icon: UserIcon,
      title: 'Unlock Cool Characters',
      description: 'Grow your tree and meet new characters along the way. Consistency comes with cool companions.'
    },
    {
      icon: ThumbsUp,
      title: 'Stay Motivated',
      description: 'Every day you show up, your roots grow deeper. Even the tallest trees grow slowly.'
    }
  ];

  const handleAuthSuccess = () => {
    setShowAuthDialog(false);
    onLogin();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-black to-purple-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl">HabitTree</span>
          </div>
          <Button onClick={() => setShowAuthDialog(true)}>
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto flex flex-col gap-6">
          <h1 className="text-5xl md:text-6xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Build Better Habits, One Day at a Time
          </h1>
          <p className="text-xl text-white-600 max-w-2xl mx-auto">
            Transform your life with HabitTree. Track your daily habits, visualize your progress, and achieve your goals with our simple yet powerful habit tracker.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" onClick={() => setShowAuthDialog(true)}>
              Start Tracking Now
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl mb-4">Everything You Need to Succeed</h2>
          <p className="text-white-600 max-w-2xl mx-auto">
            Powerful features designed to help you build and maintain positive habits
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 transition-shadow hover:shadow-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl mb-2">{feature.title}</h3>
                <p className="text-white-600">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl mb-4">Ready to Transform Your Life?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of users who are building better habits every day
          </p>
          <Button 
            size="lg" 
            variant="secondary"
            onClick={() => setShowAuthDialog(true)}
          >
            Get Started Free
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white-200 bg-white/80 backdrop-blur-sm py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600">
          <p>&copy; 2025 HabitTree. Build better habits, one day at a time.</p>
        </div>
      </footer>

      {/* Auth Dialog */}
      <AuthDialog 
        open={showAuthDialog} 
        onOpenChange={setShowAuthDialog}
        onSuccess={handleAuthSuccess}
      />
    </div>
  );
}
