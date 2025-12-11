import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, User, FileText, Activity, Send, Sparkles } from 'lucide-react';
import { chatAPI } from '../services/api';

export default function AiAssistantPage({ onNavigate }) {
  const [activeTab, setActiveTab] = useState('ai-assistant');
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [pendingQuestion, setPendingQuestion] = useState(null);
  const [isFinal, setIsFinal] = useState(false);
  const [apiError, setApiError] = useState('');
  const [mapsUrl, setMapsUrl] = useState(null);                 // NEW
  const [recommendedDepartment, setRecommendedDepartment] = useState(null); // NEW
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // If a session is already active and we're waiting for a follow-up answer,
    // force the user to use the quick answer buttons.
    if (sessionId && pendingQuestion && !isFinal) {
      return;
    }

    const userMessage = {
      id: Date.now(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    setApiError('');

    try {
      const result = await chatAPI.start(userMessage.text);

      if (!result.success) {
        setApiError(result.error || 'Something went wrong while starting the chat.');
        setIsLoading(false);
        return;
      }

      const data = result.data;
      setSessionId(data.session_id || null);

      // Emergency or final response
      if (data.is_final) {
        const finalText =
          data.message || 'This session has been completed based on your symptoms.';

        const aiMessage = {
          id: Date.now() + 1,
          text: finalText,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, aiMessage]);
        setPendingQuestion(null);
        setIsFinal(true);
        setMapsUrl(data.maps_url || null);                       // NEW
        setRecommendedDepartment(data.recommended_department || null); // NEW
        setIsLoading(false);
        return;
      }

      const infoMessages = [];

      if (data.medical_history_note) {
        infoMessages.push({
          id: Date.now() + 1,
          text: data.medical_history_note,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }

      if (data.next_question) {
        infoMessages.push({
          id: Date.now() + 2,
          text: data.next_question.text,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
        setPendingQuestion(data.next_question);
      } else {
        setPendingQuestion(null);
      }

      // Clear any previous final/maps info when receiving intermediate responses
      setMapsUrl(null);
      setRecommendedDepartment(null);
      setMessages(prev => [...prev, ...infoMessages]);
      setIsFinal(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Chat start error:', err);
      setApiError('Unexpected error while contacting the assistant.');
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleAnswerQuestion = async (answerType) => {
    if (!sessionId || !pendingQuestion || isLoading) return;

    setIsLoading(true);
    setApiError('');

    let has_symptom = false;
    let severity = null;

    // Map button answer to has_symptom + severity
    switch (answerType) {
      case 'yes-mild':
        has_symptom = true;
        severity = 1;
        break;
      case 'yes-moderate':
        has_symptom = true;
        severity = 2;
        break;
      case 'yes-severe':
        has_symptom = true;
        severity = 3;
        break;
      case 'no':
      default:
        has_symptom = false;
        severity = null;
        break;
    }

    const answerText =
      answerType === 'no'
        ? `No, I am not experiencing "${pendingQuestion.token.replace(/_/g, ' ')}".`
        : `Yes (${answerType.split('-')[1]}), I am experiencing "${pendingQuestion.token.replace(
          /_/g,
          ' '
        )}".`;

    const userMessage = {
      id: Date.now(),
      text: answerText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await chatAPI.continue({
        session_id: sessionId,
        symptom_token: pendingQuestion.token,
        has_symptom,
        severity,
      });

      if (!result.success) {
        setApiError(result.error || 'Something went wrong while continuing the chat.');
        setIsLoading(false);
        return;
      }

      const data = result.data;

      if (data.is_final) {
        const finalText =
          data.message || 'This session has been completed based on your answers.';

        const aiMessage = {
          id: Date.now() + 1,
          text: finalText,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages(prev => [...prev, aiMessage]);
        setPendingQuestion(null);
        setIsFinal(true);
        setMapsUrl(data.maps_url || null);                          // NEW
        setRecommendedDepartment(data.recommended_department || null); // NEW
        setIsLoading(false);
        return;
      }

      const infoMessages = [];

      if (data.medical_history_note) {
        infoMessages.push({
          id: Date.now() + 2,
          text: data.medical_history_note,
          sender: 'ai',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      }

      if (data.next_question) {
        const isSameQuestion =
          pendingQuestion && data.next_question.token === pendingQuestion.token;

        if (!isSameQuestion) {
          infoMessages.push({
            id: Date.now() + 3,
            text: data.next_question.text,
            sender: 'ai',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          });
        }

        setPendingQuestion(data.next_question);
      } else {
        setPendingQuestion(null);
      }

      // Clear any previous final/maps info when receiving intermediate responses
      setMapsUrl(null);
      setRecommendedDepartment(null);
      setMessages(prev => [...prev, ...infoMessages]);
      setIsFinal(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Chat continue error:', err);
      setApiError('Unexpected error while continuing the assistant session.');
      setIsLoading(false);
    }
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
    { id: 'logged-symptoms', label: 'Logged Symptoms', icon: Activity },
  ];

  return (
    <div className="flex h-screen bg-bg text-primary">
      {/* Left Sidebar */}
      <aside className="w-64 bg-bg border-r border-transparent flex flex-col">
        <div className="p-6 border-b border-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface rounded-lg flex items-center justify-center">
              <span className="text-white">JP</span>
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
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === tab.id
                        ? 'bg-surface text-secondary'
                        : 'text-muted hover:bg-surface'
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
            onClick={() => onNavigate('home')}
            className="w-full px-4 py-2 text-sm text-primary bg-transparent hover:bg-surface rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          // Welcome Screen
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-2xl">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-surface rounded-2xl mb-6">
                <Sparkles className="text-white" size={40} />
              </div>
              <h2 className="text-3xl mb-3 text-primary">Your AI Healthcare Assistant</h2>
              <p className="text-muted mb-8">
                I&apos;m here to help you understand your symptoms and provide preliminary
                guidance. Ask me anything about your health concerns, and I&apos;ll do my best to
                assist you.
              </p>
              {/* ...existing cards content... */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                <div className="card bg-surface p-4 rounded-lg">
                  <h3 className="text-sm text-secondary mb-1">Symptom Assessment</h3>
                  <p className="text-xs text-muted">
                    Describe your symptoms and get preliminary information
                  </p>
                </div>
                <div className="card p-4 rounded-lg">
                  <h3 className="text-sm text-secondary mb-1">Find Specialists</h3>
                  <p className="text-xs text-muted">
                    Get recommendations for nearby healthcare providers
                  </p>
                </div>
                <div className="card p-4 rounded-lg">
                  <h3 className="text-sm text-secondary mb-1">Health Guidance</h3>
                  <p className="text-xs text-muted">
                    Receive general wellness and health information
                  </p>
                </div>
                <div className="card p-4 rounded-lg">
                  <h3 className="text-sm text-secondary mb-1">Track Progress</h3>
                  <p className="text-xs text-muted">
                    Log your symptoms and monitor your health journey
                  </p>
                </div>
              </div>
              <div className="mt-8 p-4 bg-[#2f1f07] border border-transparent rounded-lg">
                <p className="text-xs text-highlight">
                  <strong>Important:</strong> This AI assistant is not a replacement for
                  professional medical advice, diagnosis, or treatment. Always consult with
                  qualified healthcare providers for medical concerns.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Chat Interface
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-4xl mx-auto space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${message.sender === 'user'
                        ? 'bg-surface text-white'
                        : 'card text-primary'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p
                      className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-muted'
                        }`}
                    >
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-2xl px-4 py-3 card">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce delay-100" />
                      <span className="w-2 h-2 bg-muted rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />

              {/* NEW: Maps button after final recommendation */}
              {isFinal && mapsUrl && (
                <div className="max-w-4xl mx-auto mt-4 p-4">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                  >
                    Find Nearby Hospitals
                  </a>
                  {recommendedDepartment && (
                    <p className="text-xs text-gray-500 mt-2">
                      Department: {recommendedDepartment}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-transparent bg-black p-4">
          <div className="max-w-4xl mx-auto">
            {apiError && (
              <div className="mb-3 text-xs text-red-400 bg-[#2f0f0f] border border-transparent rounded-md px-3 py-2">
                {apiError}
              </div>
            )}

            {pendingQuestion && !isFinal && (
              <div className="mb-3 p-3 card rounded-md text-xs text-primary">
                <p className="mb-2 text-muted">
                  Please answer the follow-up question above using these quick options:
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleAnswerQuestion('no')}
                    className="px-3 py-1 badge-neutral text-xs disabled:opacity-50"
                    disabled={isLoading}
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswerQuestion('yes-mild')}
                    className="px-3 py-1 badge-primary text-xs disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Yes - Mild
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswerQuestion('yes-moderate')}
                    className="px-3 py-1 badge-primary text-xs disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Yes - Moderate
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAnswerQuestion('yes-severe')}
                    className="px-3 py-1 badge-primary text-xs disabled:opacity-50"
                    disabled={isLoading}
                  >
                    Yes - Severe
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  sessionId && pendingQuestion && !isFinal
                    ? 'Answer the follow-up question using the buttons above.'
                    : 'Describe your symptoms or ask a health question to start a new analysis...'
                }
                className="flex-1 px-4 py-3 rounded-lg bg-black text-primary border border-transparent focus:outline-none focus:ring-2 focus:ring-secondary"
                disabled={isLoading || (sessionId && pendingQuestion && !isFinal)}
              />
              <button
                onClick={handleSendMessage}
                disabled={
                  !inputValue.trim() || isLoading || (sessionId && pendingQuestion && !isFinal)
                }
                className="px-6 py-3 bg-primary text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={18} />
                <span>Send</span>
              </button>
            </div>
            <p className="text-xs text-muted mt-2 text-center">
              Remember: This is an AI assistant and not a substitute for professional medical
              advice
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}