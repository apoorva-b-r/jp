import { Activity, Heart, MapPin, Shield, Stethoscope, Users } from 'lucide-react';

export function HomePage({ onNavigate }) {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#BAE6FD] via-[#D1FAE5] to-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Activity className="w-20 h-20 text-[#0EA5E9]" />
          </div>
          <h1 className="text-5xl md:text-6xl text-gray-900 mb-6 tracking-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
            Jiggly Pugffs
          </h1>
          <p className="text-xl text-gray-700 mb-10 max-w-2xl mx-auto">
            Your smart companion for symptom awareness and healthcare guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={() => onNavigate('signin')}
              className="px-8 py-3 bg-[#0EA5E9] text-white rounded-lg hover:bg-[#0369A1] transition-all transform hover:scale-105 shadow-lg min-w-[160px]"
            >
              Sign In
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="px-8 py-3 bg-[#10B981] text-white rounded-lg hover:bg-[#059669] transition-all transform hover:scale-105 shadow-lg min-w-[160px]"
            >
              Sign Up
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-center text-gray-900 mb-12">How We Help You</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#F0F9FF] p-8 rounded-xl border border-[#BAE6FD] hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <Stethoscope className="w-12 h-12 text-[#0EA5E9]" />
              </div>
              <h3 className="text-center text-gray-900 mb-3">Symptom Analysis</h3>
              <p className="text-gray-600 text-center">
                Categorize and understand your symptoms with our intelligent assessment system.
              </p>
            </div>

            <div className="bg-[#ECFDF5] p-8 rounded-xl border border-[#D1FAE5] hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <MapPin className="w-12 h-12 text-[#10B981]" />
              </div>
              <h3 className="text-center text-gray-900 mb-3">Find Specialists</h3>
              <p className="text-gray-600 text-center">
                Get recommendations for nearby hospitals and medical specialists based on your needs.
              </p>
            </div>

            <div className="bg-[#F0F9FF] p-8 rounded-xl border border-[#BAE6FD] hover:shadow-lg transition-shadow">
              <div className="flex justify-center mb-4">
                <Heart className="w-12 h-12 text-[#0EA5E9]" />
              </div>
              <h3 className="text-center text-gray-900 mb-3">Early Awareness</h3>
              <p className="text-gray-600 text-center">
                Promote early detection and awareness while emphasizing professional care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about-section" className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-[#F0F9FF]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center text-gray-900 mb-8">About Us</h2>
          
          <div className="space-y-6 text-gray-700">
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-start gap-4">
                <Shield className="w-8 h-8 text-[#10B981] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-gray-900 mb-3">Our Mission</h3>
                  <p>
                    Jiggly Pugffs is an intelligent healthcare assistance system designed to help users categorize symptoms, 
                    understand potential health concerns, and guide them to appropriate medical experts or hospitals. We believe 
                    in empowering individuals with information while promoting early health awareness.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-start gap-4">
                <Activity className="w-8 h-8 text-[#0EA5E9] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-gray-900 mb-3">How It Works</h3>
                  <p>
                    Our system analyzes the symptoms you provide and identifies potential areas of concern. Based on this analysis, 
                    we suggest relevant medical specialists or nearby healthcare facilities that can provide appropriate care. 
                    Our goal is to streamline your journey to professional medical help.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200">
              <div className="flex items-start gap-4">
                <Users className="w-8 h-8 text-[#10B981] flex-shrink-0 mt-1" />
                <div>
                  <h3 className="text-gray-900 mb-3">Important Notice</h3>
                  <p className="mb-3">
                    <strong>Jiggly Pugffs is NOT a replacement for professional medical advice, diagnosis, or treatment.</strong> 
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
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-[#0EA5E9] to-[#10B981]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-white mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-white/90 mb-8">
            Join Jiggly Pugffs today and take the first step towards better health awareness.
          </p>
          <button
            onClick={() => onNavigate('signup')}
            className="px-8 py-3 bg-white text-[#0EA5E9] rounded-lg hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
          >
            Create Your Account
          </button>
        </div>
      </section>
    </div>
  );
}