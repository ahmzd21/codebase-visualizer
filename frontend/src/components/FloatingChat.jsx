import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../api';
import Spinner from './Spinner';

export default function FloatingChat({ repoId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [error, setError] = useState(null);
  
  // Chat Session State
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [activeChatHistory, setActiveChatHistory] = useState([]);
  
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      loadChats();
    }
  }, [isOpen, repoId]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeChatHistory, chatSending, isOpen]);
  
  const loadChats = async () => {
    const res = await api.get(`/ai/chats/${repoId}`);
    if (res.ok) {
      setChats(res.chats);
    }
  };

  const switchChat = (chat) => {
    setActiveChatId(chat._id);
    setActiveChatHistory(chat.messages || []);
    setError(null);
  };

  const startNewChat = () => {
    setActiveChatId(null);
    setActiveChatHistory([]);
    setError(null);
  };

  const deleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    const res = await api.delete(`/ai/chats/${chatId}`);
    if (res.ok) {
      setChats(prev => prev.filter(c => c._id !== chatId));
      if (activeChatId === chatId) {
        startNewChat();
      }
    }
  };

  const sendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim() || chatSending) return;
    
    if (!isOpen) setIsOpen(true);
    
    const newMessage = { role: 'user', text: chatMessage };
    setActiveChatHistory(prev => [...prev, newMessage]);
    setChatMessage('');
    setChatSending(true);
    setError(null);
    
    const payload = {
      message: newMessage.text,
      chatId: activeChatId
    };
    
    const res = await api.post(`/ai/chat/${repoId}`, payload);
    
    if (res.ok) {
      setActiveChatHistory(prev => [...prev, { role: 'model', text: res.response }]);
      if (!activeChatId) {
        setActiveChatId(res.chatId);
        loadChats(); // reload sidebar to get the new chat
      } else {
        // update local chat history in sidebar
        setChats(prev => prev.map(c => c._id === activeChatId ? { ...c, messages: [...activeChatHistory, newMessage, { role: 'model', text: res.response }] } : c));
      }
    } else {
      setError(res.error?.message || 'Failed to send message.');
    }
    setChatSending(false);
  };

  return (
    <>
      {/* Floating Input (Closed State) */}
      {!isOpen && (
        <div className="fixed bottom-lg left-1/2 -translate-x-1/2 w-[800px] max-w-[90vw] z-40">
          <form onSubmit={sendChatMessage} className="relative flex items-center shadow-2xl">
            <input 
              type="text" 
              className="w-full bg-surface-container-high border border-white/[0.1] rounded-full pl-lg pr-[60px] py-[14px] text-on-surface text-body-lg focus:outline-none focus:ring-2 focus:ring-primary-container/50 shadow-2xl placeholder:text-on-surface-variant/50 transition-all"
              placeholder="Ask anything about the codebase..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              onFocus={() => setIsOpen(true)}
            />
            <button type="submit" disabled={!chatMessage.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-container text-white h-[40px] w-[40px] rounded-full flex items-center justify-center disabled:opacity-50 transition-colors hover:bg-primary-container/90">
              <span className="material-symbols-outlined text-[20px]">arrow_upward</span>
            </button>
          </form>
        </div>
      )}

      {/* Expanded Chat Page (Open State) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col animate-in fade-in duration-200">
          <div className="flex-1 flex flex-col m-md rounded-2xl border border-primary-container/30 shadow-2xl overflow-hidden bg-background">
            <header className="flex items-center justify-between px-xl py-md border-b border-primary-container/20 bg-surface-container-lowest/80">
              <div className="flex items-center gap-sm">
                <span className="material-symbols-outlined text-primary-container text-[24px]">auto_awesome</span>
                <h2 className="font-h2 text-h2 text-on-surface">Chat with Codebase</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="btn-ghost flex items-center gap-xs">
                <span className="material-symbols-outlined text-[20px]">close</span>
                Close
              </button>
            </header>
            
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar for Chat History */}
              <aside className="w-72 border-r border-primary-container/20 bg-surface-container/50 flex flex-col">
                <div className="p-md border-b border-white/[0.04]">
                  <button onClick={startNewChat} className="w-full bg-primary-container text-on-primary-container hover:bg-primary-container/90 shadow-md transition-colors py-[10px] px-md rounded-lg flex items-center justify-center gap-sm font-semibold text-body-base">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    New Chat
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto p-sm flex flex-col gap-xs">
                  {chats.map(chat => (
                    <button 
                      key={chat._id} 
                      onClick={() => switchChat(chat)}
                      className={`group relative flex items-center justify-between px-md py-[10px] rounded-lg transition-all text-left truncate border ${
                        activeChatId === chat._id 
                          ? 'bg-primary-container/10 border-primary-container/30 text-primary-container shadow-sm' 
                          : 'bg-transparent border-transparent text-on-surface-variant hover:bg-surface-variant/50 hover:text-on-surface'
                      }`}
                    >
                      <span className="truncate text-body-sm font-body-sm mr-6 font-medium">{chat.title}</span>
                      <span 
                        onClick={(e) => deleteChat(e, chat._id)}
                        className="absolute right-2 opacity-0 group-hover:opacity-100 text-error hover:bg-error-container hover:text-on-error-container rounded-md p-xs flex items-center justify-center transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                      </span>
                    </button>
                  ))}
                </div>
              </aside>

            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col relative">
              <main className="flex-1 overflow-y-auto p-lg w-full flex flex-col items-center">
                <div className="max-w-4xl w-full flex flex-col gap-xl pb-xl">
                  {activeChatHistory.length === 0 ? (
                    <div className="mt-2xl flex flex-col items-center justify-center text-on-surface-variant text-center gap-md">
                      <div className="w-16 h-16 rounded-full bg-primary-container/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[32px] text-primary-container">forum</span>
                      </div>
                      <p className="text-h2 font-h2 text-on-surface">How can I help you today?</p>
                      <p className="text-body-lg font-body-base max-w-lg">I have full access to your repository's files. Ask me to explain architecture, find bugs, or suggest refactors.</p>
                    </div>
                  ) : (
                    activeChatHistory.map((msg, i) => (
                      <div key={i} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-3xl p-lg prose prose-invert prose-p:leading-relaxed prose-pre:bg-surface-container-lowest prose-pre:border prose-pre:border-white/[0.05] prose-pre:p-md prose-pre:rounded-lg ${msg.role === 'user' ? 'bg-surface-container-highest text-on-surface' : 'bg-transparent text-on-surface'}`}>
                          {msg.role === 'model' ? <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown> : <span className="whitespace-pre-wrap text-body-lg">{msg.text}</span>}
                        </div>
                      </div>
                    ))
                  )}
                  {chatSending && (
                    <div className="flex justify-start w-full">
                      <div className="max-w-[85%] p-md flex items-center gap-sm">
                        <Spinner size="sm" /> 
                        <span className="text-body-base text-transparent bg-clip-text bg-gradient-to-r from-primary-container to-tertiary animate-pulse">
                          Analyzing codebase...
                        </span>
                      </div>
                    </div>
                  )}
                  {error && (
                    <div className="text-error text-body-base text-center bg-error-container/20 p-md rounded-xl w-full">
                      {error}
                    </div>
                  )}
                  <div ref={messagesEndRef} className="h-4" />
                </div>
              </main>
              
              <footer className="p-lg w-full flex justify-center bg-gradient-to-t from-background to-transparent pt-xl">
                <div className="max-w-4xl w-full">
                  <form onSubmit={sendChatMessage} className="relative flex items-center shadow-2xl">
                    <input 
                      type="text" 
                      autoFocus
                      className="w-full bg-surface-container border border-primary-container/30 rounded-full pl-xl pr-[64px] py-[16px] text-on-surface text-body-lg focus:outline-none focus:ring-2 focus:ring-primary-container/50 placeholder:text-on-surface-variant/50 transition-all shadow-lg"
                      placeholder="Ask a follow-up question..."
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      disabled={chatSending}
                    />
                    <button type="submit" disabled={chatSending || !chatMessage.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary-container text-on-primary-container h-[44px] w-[44px] rounded-full flex items-center justify-center disabled:opacity-50 transition-colors hover:bg-primary-container/90 shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">arrow_upward</span>
                    </button>
                  </form>
                  <p className="text-center text-label-sm text-on-surface-variant mt-sm">AI can make mistakes. Check important information.</p>
                </div>
              </footer>
            </div>
          </div>
          </div>
        </div>
      )}
    </>
  );
}
