import React, { useState } from 'react';
import { MessageSquare, User, FileText, Activity, ClipboardList } from 'lucide-react';

export default function LoggedSymptomsPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('logged-symptoms');

  // Dummy data - will be replaced with API calls later
  const symptoms = [
    { id: 1, date: "2025-02-15", text: "Fever, mild headache, fatigue." },
    { id: 2, date: "2025-02-17", text: "Sore throat and runny nose." },
    { id: 3, date: "2025-02-20", text: "Persistent cough, chest tightness, slight difficulty breathing." },
    { id: 4, date: "2025-03-01", text: "Nausea and stomach discomfort after meals." }
  ];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

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
        <button
  onClick={() => onNavigate("home")} 
  className="w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
>
          Logout
        </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl text-gray-800 mb-2">Logged Symptoms</h2>
            <p className="text-gray-600">
              View your symptom history and track your health journey over time.
            </p>
          </div>

          {symptoms.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="text-gray-400" size={40} />
              </div>
              <h3 className="text-xl text-gray-700 mb-2">No symptoms logged yet.</h3>
              <p className="text-gray-500 text-sm">
                Start chatting with the AI Assistant to log your first symptom.
              </p>
            </div>
          ) : (
            // Symptoms List
            <div className="space-y-4">
              {symptoms.map(symptom => (
                <div
                  key={symptom.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Activity className="text-blue-600" size={18} />
                      <span className="text-sm text-gray-500">{formatDate(symptom.date)}</span>
                    </div>
                  </div>
                  <p className="text-gray-800">{symptom.text}</p>
                </div>
              ))}
            </div>
          )}

          {symptoms.length > 0 && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Keep logging your symptoms regularly to help healthcare 
                providers better understand your condition and track patterns over time.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}