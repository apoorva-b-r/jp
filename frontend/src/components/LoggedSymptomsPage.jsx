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
    <div className="flex h-screen bg-black text-secondary">
      {/* SIDEBAR */}
      <aside className="w-64 bg-[#0A0F1F] backdrop-blur-md border-r border-transparent flex flex-col">
        <div className="p-6 border-b border-transparent">
            <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center">
              <span className="text-primary">JP</span>
            </div>
            <div>
              <h1 className="text-lg text-highlight">Jiggly Puffs</h1>
              <p className="text-xs text-secondary/80">Healthcare Assistant</p>
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 ${activeTab === tab.id ? 'bg-surface text-secondary' : 'text-secondary/80 hover:bg-surface'
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
            className="w-full px-4 py-2 text-sm text-secondary bg-transparent hover:bg-surface rounded-2xl transition-all duration-300"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-4xl mx-auto">

          <h2 className="text-3xl text-highlight mb-2">Logged Symptoms</h2>
          <p className="text-secondary/90 mb-8">
            Chat-based AI diagnoses from your previous symptom checks.
          </p>

          {/* SHOW LOADING / ERROR / EMPTY / LIST */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-secondary/80">Loading sessions...</div>
            </div>
          ) : error ? (
            <div className="p-4 bg-[#2f0f0f] border border-transparent text-highlight rounded-2xl">
              {error}
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="text-secondary" size={40} />
              </div>
              <h3 className="text-xl text-secondary/90 mb-2">No chat history yet.</h3>
              <p className="text-sm text-secondary/80">
                Start a conversation with the AI assistant to see your past diagnoses here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map(entry => (
                <div key={entry.session_id} className="card rounded-2xl p-5 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Activity className="text-secondary" size={18} />
                        <span className="text-sm text-secondary/80">{formatDate(entry.started_at)}</span>
                      </div>
                      <div className="text-sm text-secondary/80">{entry.status}</div>
                  </div>

                  {/* Diagnosis based on session_state.predicted_department */}
                  <div className="mb-3">
                    <p className="text-xs text-secondary/80 uppercase tracking-wide">Diagnosis</p>
                    <p className="text-sm text-secondary">
                      {entry.predicted_department
                        ? entry.predicted_department.replace(/_/g, ' ')
                        : 'N/A'}
                    </p>
                  </div>

                  {/* Symptoms that the diagnosis was based on */}
                  <div className="mb-3">
                    <p className="text-xs text-secondary/80 uppercase tracking-wide">Based on symptoms</p>
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
                          <p className="text-xs text-secondary/80 mt-1">No specific symptoms recorded.</p>
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
                          <p className="text-xs text-secondary/80 mt-1">No specific symptoms recorded.</p>
                        );
                      }

                      return (
                        <div className="flex flex-wrap gap-2 mt-1">
                          {displayItems.map((item) => (
                            <span
                              key={item.normalized}
                              className="px-2 py-1 rounded-full bg-surface text-secondary text-xs border border-transparent"
                            >
                              {item.normalized}
                            </span>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center gap-4 mb-3">
                    <div className="p-3 bg-surface rounded-2xl">
                        <p className="text-xs text-secondary font-medium">Recommended Department</p>
                        <p className="text-sm text-secondary">{entry.final_department || 'N/A'}</p>
                    </div>

                    <div className="p-3 bg-surface rounded-2xl">
                      <p className="text-xs text-secondary font-medium">Urgency</p>
                      <p className="text-sm text-secondary">{entry.final_urgency || 'N/A'}</p>
                    </div>

                    <div className="p-3 bg-surface rounded-2xl">
                      <p className="text-xs text-secondary font-medium">Emergency</p>
                      <p className="text-sm text-secondary">{entry.is_emergency ? 'Yes' : 'No'}</p>
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
