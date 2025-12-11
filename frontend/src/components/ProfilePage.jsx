import React, { useState } from 'react';
import { MessageSquare, User, FileText, Activity, Mail, Calendar, Hash, Heart, Dna, AlertCircle } from 'lucide-react';

export default function ProfilePage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('profile');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onNavigate) onNavigate(tabId);
  };

  const tabs = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'medical-history', label: 'Medical History', icon: FileText },
    { id: 'logged-symptoms', label: 'Logged Symptoms', icon: Activity }
  ];

  // user coming from DB or signup
  const userData = {
    // prefer backend's `full_name`, fall back to camelCase or username
    fullName: user?.full_name || user?.fullName || user?.fullName || user?.username || "Unknown User",
    username: user?.username || user?.user_name || "unknown",
    email: user?.email || "not provided",
    age: user?.age ?? "N/A",
    gender: user?.gender ?? "N/A",
    allergies: user?.allergies || "",
    majorIllnesses: user?.majorIllnesses || user?.major_illnesses || "",
    chronicDiseases: user?.selectedDiseases || user?.chronic_diseases || [],
    geneticDiseases: user?.geneticDiseases || user?.genetic_diseases || [],
  };

  return (
    <div className="flex h-screen bg-bg text-primary">
      {/* Sidebar */}
      <aside className="w-64 bg-bg border-r border-transparent flex flex-col">
        <div className="p-6 border-b border-transparent">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center">
              <span className="text-primary font-semibold">JP</span>
            </div>
            <div>
              <h1 className="text-lg text-primary">Jiggly Puffs</h1>
              <p className="text-xs text-muted">Healthcare Assistant</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <li key={tab.id}>
                  <button
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      activeTab === tab.id ? 'bg-bg text-secondary' : 'text-muted hover:bg-surface'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="text-sm">{tab.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="p-4 border-t border-transparent">
          <button
            onClick={() => onNavigate("home")}
            className="w-full px-4 py-2 text-sm text-primary bg-transparent hover:bg-surface rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Title */}
          <h2 className="text-3xl text-primary mb-2">Profile</h2>
          <p className="text-muted mb-8">Your personal and medical details.</p>

          {/* Profile Card */}
          <div className="card rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-transparent">
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center">
                <User className="text-primary" size={32} />
              </div>
              <div>
                <h3 className="text-2xl text-primary">{userData.fullName}</h3>
                <p className="text-sm text-muted">@{userData.username}</p>
              </div>
            </div>

            {/* Basic Information */}
            <h4 className="text-lg text-primary mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-surface rounded-lg">
                <Mail size={18} className="text-secondary mt-1" />
                <div>
                  <p className="text-xs text-muted mb-1">Email</p>
                  <p className="text-primary">{userData.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-surface rounded-lg">
                <Calendar size={18} className="text-secondary mt-1" />
                <div>
                  <p className="text-xs text-muted mb-1">Age</p>
                  <p className="text-primary">{userData.age}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-surface rounded-lg">
                <Hash size={18} className="text-secondary mt-1" />
                <div>
                  <p className="text-xs text-muted mb-1">Gender</p>
                  <p className="text-primary">{userData.gender}</p>
                </div>
              </div>
            </div>

            {/* Medical Info Sections */}
            {userData.allergies && (
              <div className="p-4 bg-surface border border-transparent rounded-lg mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle size={18} className="text-highlight" />
                  <p className="text-sm text-highlight">Allergies</p>
                </div>
                <p className="text-primary">{userData.allergies}</p>
              </div>
            )}

            {userData.majorIllnesses && (
              <div className="p-4 bg-surface border border-transparent rounded-lg mb-4">
                <p className="text-sm text-secondary font-medium">Major Illnesses</p>
                <p className="text-primary">{userData.majorIllnesses}</p>
              </div>
            )}

            {/* Chronic Diseases */}
            {userData.chronicDiseases?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Heart size={18} className="text-secondary" />
                  <p className="text-sm text-primary">Chronic Diseases</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userData.chronicDiseases.map((d, i) => (
                    <span key={i} className="px-3 py-1 badge-primary text-sm">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Genetic Diseases */}
            {userData.geneticDiseases?.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Dna size={18} className="text-highlight" />
                  <p className="text-sm text-primary">Genetic Diseases</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {userData.geneticDiseases.map((d, i) => (
                    <span key={i} className="px-3 py-1 badge-secondary text-sm">
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Note */}
          <div className="bg-surface border border-transparent rounded-lg p-4">
            <p className="text-sm text-secondary">
              Keeping your information updated helps the AI assistant provide better guidance.
            </p>
          </div>

        </div>
      </main>
    </div>
  );
}