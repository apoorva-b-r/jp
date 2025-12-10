import { useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { SignUpPage } from './components/SignUpPage';
import { SignInPage } from './components/SignInPage';
import { MedicalHistoryPage } from './components/MedicalHistoryPage';
import AiAssistantPage from './components/AiAssistantPage';
import LoggedSymptomsPage from './components/LoggedSymptomsPage';
import ProfilePage from './components/ProfilePage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  const handleSignUp = (username, email, password) => {
    console.log('Sign up:', { username, email, password });
    setUserData({ username, email });
    setIsLoggedIn(true);
    setCurrentPage('medical-history');
  };

  const handleSignIn = (username, password) => {
    console.log('Sign in:', { username, password });
    setUserData({ username, email: `${username}@example.com` });
    setIsLoggedIn(true);
    setCurrentPage('medical-history');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    setCurrentPage('home');
  };

  const handleMedicalHistorySubmit = (data) => {
    console.log('Medical history submitted:', data);
    setCurrentPage('ai-assistant');
  };

  const handleMedicalHistorySkip = () => {
    console.log('Medical history skipped');
    setCurrentPage('ai-assistant');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'signup':
        return <SignUpPage onNavigate={setCurrentPage} onSignUp={handleSignUp} />;
      case 'signin':
        return <SignInPage onNavigate={setCurrentPage} onSignIn={handleSignIn} />;
      case 'medical-history':
        return (
          <MedicalHistoryPage
            onSkip={handleMedicalHistorySkip}
            onSubmit={handleMedicalHistorySubmit}
          />
        );
      case 'ai-assistant':
        return <AiAssistantPage onNavigate={setCurrentPage} />;
      case 'profile':
        return <ProfilePage user={userData} onNavigate={setCurrentPage} />;
      case 'logged-symptoms':
        return <LoggedSymptomsPage onNavigate={setCurrentPage} />;
      case 'dashboard':
        return <DashboardPlaceholder username={userData?.username || 'User'} />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  const shouldShowHeaderFooter = currentPage !== 'signup' && currentPage !== 'signin' && currentPage !== 'medical-history' && currentPage !== 'ai-assistant' && currentPage !== 'logged-symptoms' && currentPage !== 'profile';

  return (
    <div className="flex flex-col h-screen w-screen">
      {shouldShowHeaderFooter && (
        <Header
          currentPage={currentPage}
          isLoggedIn={isLoggedIn}
          onNavigate={setCurrentPage}
          onLogout={handleLogout}
        />
      )}
      
      <main className="flex-grow">
        {renderPage()}
      </main>
      
      {shouldShowHeaderFooter && <Footer />}
    </div>
  );
}

// Placeholder component for the dashboard (not part of the 4 requested pages)
function DashboardPlaceholder({ username }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F0F9FF] to-[#ECFDF5] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200 text-center">
          <h2 className="text-gray-900 mb-4">Welcome, {username}!</h2>
          <p className="text-gray-600 mb-6">
            You have successfully completed the onboarding process. The symptom input dashboard 
            would appear here where you can start analyzing your symptoms and getting healthcare guidance.
          </p>
          <div className="bg-[#F0F9FF] border border-[#BAE6FD] rounded-lg p-6">
            <p className="text-gray-700">
              This is a placeholder for the main symptom analysis dashboard. Features would include:
            </p>
            <ul className="mt-4 space-y-2 text-left max-w-md mx-auto text-gray-700">
              <li>• Symptom input and categorization</li>
              <li>• AI-powered preliminary assessments</li>
              <li>• Nearby hospital and specialist recommendations</li>
              <li>• Health tracking and history</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;