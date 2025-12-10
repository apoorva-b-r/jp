import React, { useState } from 'react';
import { MessageSquare, User, FileText, Activity, Mail, Hash, Calendar, AlertCircle, Heart, Dna } from 'lucide-react';

export default function ProfilePage({ user, onNavigate }) {
  const [activeTab, setActiveTab] = useState('profile');

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onNavigate) {
      onNavigate(tabId);
    }
  };

  const tabs = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'medical-history', label: 'Medical History', icon: FileText },
    { id: 'logged-symptoms', label: 'Logged Symptoms', icon: Activity }
  ];

  // Default user data if not provided
  const userData = user || {
    name: "John Doe",
    userId: "USR10293",
    email: "john@example.com",
    age: 22,
    allergies: "Peanuts, dust",
    majorIllnesses: "Appendicitis surgery",
    selectedDiseases: ["Diabetes", "Hypertension"]
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-green-400 rounded-lg flex items-center justify-center">
              <span className="text-white">JP</span>
            </div>
            <div>
              <h1 className="text-lg">Jiggly Pugffs</h1>
              <p className="text-xs text-gray-500">Healthcare Assistant</p>
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
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
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

        <div className="p-4 border-t border-gray-200">
          <button className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-3xl text-gray-800 mb-2">Profile</h2>
            <p className="text-gray-600">
              View and manage your personal and medical information.
            </p>
          </div>

          {/* Profile Card */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-green-400 rounded-full flex items-center justify-center">
                <User className="text-white" size={32} />
              </div>
              <div>
                <h3 className="text-2xl text-gray-800">{userData.name}</h3>
                <p className="text-sm text-gray-500">User ID: {userData.userId}</p>
              </div>
            </div>

            {/* Basic Information Section */}
            <div className="mb-6">
              <h4 className="text-lg text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} className="text-blue-600" />
                Basic Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Mail size={18} className="text-blue-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Email Address</p>
                    <p className="text-gray-800">{userData.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar size={18} className="text-green-600 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Age</p>
                    <p className="text-gray-800">{userData.age} years</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Medical Background Section */}
            <div>
              <h4 className="text-lg text-gray-800 mb-4 flex items-center gap-2">
                <Heart size={20} className="text-red-500" />
                Medical Background
              </h4>
              
              {/* Allergies */}
              {userData.allergies && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <AlertCircle size={18} className="text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">Allergies</p>
                  </div>
                  <p className="text-gray-800 ml-6">{userData.allergies}</p>
                </div>
              )}

              {/* Chronic Diseases */}
              {userData.selectedDiseases && userData.selectedDiseases.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Dna size={18} className="text-blue-600" />
                    <p className="text-sm text-gray-700">Chronic Diseases</p>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-6">
                    {userData.selectedDiseases.map((disease, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm"
                      >
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Genetic Diseases */}
              {userData.geneticDiseases && userData.geneticDiseases.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Dna size={18} className="text-purple-600" />
                    <p className="text-sm text-gray-700">Genetic Diseases</p>
                  </div>
                  <div className="flex flex-wrap gap-2 ml-6">
                    {userData.geneticDiseases.map((disease, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm"
                      >
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Major Illnesses */}
              {userData.majorIllnesses && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Activity size={18} className="text-yellow-600 mt-0.5" />
                    <p className="text-sm text-yellow-800">Major Illnesses & Surgeries</p>
                  </div>
                  <p className="text-gray-800 ml-6">{userData.majorIllnesses}</p>
                </div>
              )}
            </div>
          </div>

          {/* Additional Information Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Keep your profile information up to date to receive more accurate 
              health guidance and recommendations from the AI assistant.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}