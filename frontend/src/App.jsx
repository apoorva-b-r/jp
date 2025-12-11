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
import { authAPI, historyAPI } from './services/api';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userData, setUserData] = useState(null);

  // Called by SignUpPage after a successful backend signup
  const handleSignUp = (user, token) => {
    console.log('Sign up (from backend):', user);
    if (token) {
      localStorage.setItem('token', token);
    }
    localStorage.setItem('user', JSON.stringify(user));
    setUserData(user);
    setIsLoggedIn(true);
    setCurrentPage('ai-assistant');
  };

  // Called by SignInPage with credentials; talks to backend login
  const handleSignIn = async (username, password) => {
    console.log('Sign in attempt:', { username });

    const result = await authAPI.login({ username, password });

    if (!result.success) {
      // Let the SignInPage display a friendly error
      return {
        success: false,
        error: result.error || 'Invalid username or password.',
      };
    }

    const { token, user, redirect_to } = result.data;

    if (token) {
      localStorage.setItem('token', token);
    }
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
      setUserData(user);
    }

    setIsLoggedIn(true);

    // Always take users to the main app; medical history is optional
    // and accessible via the Medical History tab when clicked.
    setCurrentPage('ai-assistant');

    return { success: true };
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserData(null);
    setCurrentPage('home');
  };

  const handleMedicalHistorySubmit = async (data) => {
    console.log('Medical history submitted:', data);

    const payload = {
      chronic_diseases: data.chronicDiseases || [],
      genetic_diseases: data.geneticDiseases || [],
      is_skipped: false,
    };

    const result = await historyAPI.save(payload);

    if (!result.success) {
      alert(result.error || 'Failed to save medical history.');
      return;
    }

    setCurrentPage('ai-assistant');
  };

  const handleMedicalHistorySkip = async () => {
    console.log('Medical history skipped');

    // Mark history as skipped for this user; we don't
    // send other fields so existing values (if any) are
    // not unintentionally modified by the backend logic.
    await historyAPI.save({ is_skipped: true });

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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-surface text-primary">
      <div className="max-w-4xl mx-auto">
        <div className="card rounded-2xl shadow-xl p-8 border text-center">
          <h2 className="text-primary mb-4">Welcome, {username}!</h2>
          <p className="text-muted mb-6">
            You have successfully completed the onboarding process. The symptom input dashboard
            would appear here where you can start analyzing your symptoms and getting healthcare guidance.
          </p>
          <div className="bg-surface border border-[rgba(241,228,209,0.03)] rounded-lg p-6">
            <p className="text-muted">
              This is a placeholder for the main symptom analysis dashboard. Features would include:
            </p>
            <ul className="mt-4 space-y-2 text-left max-w-md mx-auto text-muted">
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