import React, { useState, useEffect } from 'react';
import { MessageSquare, User, FileText, Activity, ClipboardList } from 'lucide-react';
import { chatAPI } from '../services/api';

const STOP_WORDS = new Set([
  'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your',
  'yours', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself',
  'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
  'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but',
  'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for',
  'with', 'about', 'against', 'between', 'into', 'through', 'during',
  'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in',
  'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
  'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both',
  'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 's', 't',
  'can', 'will', 'just', 'don', 'should', 'now',
]);

export default function LoggedSymptomsPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('logged-symptoms');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`;
  };

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      setError(null);
      const result = await chatAPI.getSessions();
      if (!result.success) {
        setError(result.error || 'Unable to load sessions');
        setSessions([]);
      } else {
        setSessions(result.data.sessions || []);
      }
      setLoading(false);
    };

    fetchSessions();
  }, []);

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);
    if (onNavigate) onNavigate(tabId);
  };

  const tabs = [
    { id: 'ai-assistant', label: 'AI Assistant', icon: MessageSquare },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'medical-history', label: 'Medical History', icon: FileText },
    { id: 'logged-symptoms', label: 'Logged Symptoms', icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* SIDEBAR */}
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
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

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">

          <h2 className="text-3xl text-gray-800 mb-2">Logged Symptoms</h2>
          <p className="text-gray-600 mb-8">
            Chat-based AI diagnoses from your previous symptom checks.
          </p>

          {/* SHOW LOADING / ERROR / EMPTY / LIST */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-500">Loading sessions...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="text-gray-400" size={40} />
              </div>
              <h3 className="text-xl text-gray-700 mb-2">No chat history yet.</h3>
              <p className="text-sm text-gray-500">
                Start a conversation with the AI assistant to see your past diagnoses here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map(entry => (
                <div key={entry.session_id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="text-blue-600" size={18} />
                      <span className="text-sm text-gray-500">{formatDate(entry.started_at)}</span>
                    </div>
                    <div className="text-sm text-gray-600">{entry.status}</div>
                  </div>

                  {/* Diagnosis based on session_state.predicted_department */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Diagnosis</p>
                    <p className="text-sm text-gray-800">
                      {entry.predicted_department
                        ? entry.predicted_department.replace(/_/g, ' ')
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Symptoms that the diagnosis was based on */}
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Based on symptoms</p>
                    {(() => {
                      const rawSymptoms = Array.isArray(entry.symptoms_collected)
                        ? entry.symptoms_collected
                        : [];

                      // Normalize, filter stop-words, and build unique list
                      const seen = new Set();
                      const items = [];

                      rawSymptoms.forEach((symptom) => {
                        const raw = symptom.toString();
                        const normalized = raw
                          .toLowerCase()
                          .replace(/_/g, ' ')
                          .trim();

                        if (!normalized || STOP_WORDS.has(normalized)) {
                          return;
                        }

                        if (seen.has(normalized)) {
                          return;
                        }

                        seen.add(normalized);
                        items.push({ raw, normalized });
                      });

                      if (items.length === 0) {
                        return (
                          <p className="text-xs text-gray-500 mt-1">No specific symptoms recorded.</p>
                        );
                      }

                      // If there are composite symptoms (e.g. "high fever"),
                      // hide their component single-word tokens ("high", "fever").
                      const compositeWords = new Set();
                      items
                        .filter((item) => item.normalized.includes(' '))
                        .forEach((item) => {
                          item.normalized.split(/\s+/).forEach((word) => {
                            if (word) compositeWords.add(word);
                          });
                        });

                      const displayItems = items.filter((item) => {
                        const parts = item.normalized.split(/\s+/);
                        const isSingleWord = parts.length === 1;
                        if (!isSingleWord) return true;
                        return !compositeWords.has(item.normalized);
                      });

                      if (displayItems.length === 0) {
                        return (
                          <p className="text-xs text-gray-500 mt-1">No specific symptoms recorded.</p>
                        );
                      }

                      return (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {displayItems.map((item) => (
                            <span
                              key={item.normalized}
                              className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs border border-gray-200"
                            >
                              {item.normalized}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-xs text-blue-700 font-medium">Recommended Department</p>
                      <p className="text-sm text-gray-800">{entry.final_department || 'N/A'}</p>
                    </div>

                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs text-green-700 font-medium">Urgency</p>
                      <p className="text-sm text-gray-800">{entry.final_urgency || 'N/A'}</p>
                    </div>

                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-xs text-yellow-800 font-medium">Emergency</p>
                      <p className="text-sm text-gray-800">{entry.is_emergency ? 'Yes' : 'No'}</p>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
