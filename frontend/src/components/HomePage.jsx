import { Activity, Heart, MapPin, Shield, Stethoscope, Users } from 'lucide-react';

export function HomePage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-black text-secondary">
      {/* Hero Section */}
      <section className="relative bg-[#0A0F1F] backdrop-blur-md py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Activity className="w-20 h-20 text-secondary" />
          </div>
          <h1 className="text-5xl md:text-6xl text-highlight mb-6 tracking-tight font-bold" style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
            Jiggly Puffs
          </h1>
          <p className="text-xl text-secondary/90 mb-10 max-w-2xl mx-auto">
            Your smart companion for symptom awareness and healthcare guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => onNavigate('signin')}
              className="px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-[0_8px_24px_rgba(22,34,102,0.12)] min-w-[160px]"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--text-primary)' }}
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-3 rounded-2xl hover:brightness-95 transition-all duration-300 transform hover:scale-105 shadow-sm min-w-[160px]"
              style={{ backgroundColor: 'var(--color-highlight)', color: '#111' }}
            >
              Sign Up
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-secondary mb-12">How We Help You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card p-8 rounded-2xl hover:shadow-lg transition-shadow backdrop-blur-md">
              <div className="flex justify-center mb-4">
                <Stethoscope className="w-12 h-12 text-secondary" />
              </div>
              <h3 className="text-center text-highlight mb-3">Symptom Analysis</h3>
              <p className="text-secondary/90 text-center">
                Categorize and understand your symptoms with our intelligent assessment system.
              </p>
            </div>

            <div className="card p-8 rounded-2xl hover:shadow-lg transition-shadow backdrop-blur-md">
              <div className="flex justify-center mb-4">
                <MapPin className="w-12 h-12 text-highlight" />
              </div>
              <h3 className="text-center text-highlight mb-3">Find Specialists</h3>
              <p className="text-secondary/90 text-center">
                Get recommendations for nearby hospitals and medical specialists based on your needs.
              </p>
            </div>

            <div className="card p-8 rounded-2xl hover:shadow-lg transition-shadow backdrop-blur-md">
              <div className="flex justify-center mb-4">
                <Heart className="w-12 h-12 text-secondary" />
              </div>
              <h3 className="text-center text-highlight mb-3">Early Awareness</h3>
              <p className="text-secondary/90 text-center">
                Promote early detection and awareness while emphasizing professional care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-secondary mb-8">About Us</h2>
          
          <div className="space-y-6 text-muted">
            <div className="card p-8 rounded-2xl backdrop-blur-md">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-highlight flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-highlight mb-3">Our Mission</h3>
                  <p className="text-secondary/90">
                    Jiggly Puffs is an intelligent healthcare assistance system designed to help users categorize symptoms, 
                    understand potential health concerns, and guide them to appropriate medical experts or hospitals. We believe 
                    in empowering individuals with information while promoting early health awareness.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-8 rounded-2xl backdrop-blur-md">
              <div className="flex items-start gap-4">
                <Activity className="w-8 h-8 text-secondary flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-highlight mb-3">How It Works</h3>
                  <p className="text-secondary/90">
                    Our system analyzes the symptoms you provide and identifies potential areas of concern. Based on this analysis, 
                    we suggest relevant medical specialists or nearby healthcare facilities that can provide appropriate care. 
                    Our goal is to streamline your journey to professional medical help.
                  </p>
                </div>
              </div>
            </div>

            <div className="card p-8 rounded-2xl backdrop-blur-md">
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-highlight flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-highlight mb-3">Important Notice</h3>
                  <p className="mb-3">
                    <strong className="text-highlight">Jiggly Puffs is NOT a replacement for professional medical advice, diagnosis, or treatment.</strong> 
                  </p>
                  <p>
                    Always consult with qualified healthcare providers regarding any medical conditions or symptoms. Our platform 
                    is designed to complement professional healthcare by providing preliminary information and guidance, not to 
                    replace the expertise of trained medical professionals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-secondary mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-secondary/90 mb-8">
            Join Jiggly Puffs today and take the first step towards better health awareness.
          </p>
          <button
            onClick={() => onNavigate('signup')}
            className="px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-[0_8px_24px_rgba(22,34,102,0.12)]"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--text-primary)' }}
          >
            Create Your Account
          </button>
        </div>
      </section>
    </div>
  );
}