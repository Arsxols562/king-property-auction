import { useRef, useEffect, useState } from "react";
import {
  Mail, Send, X, User, InboxIcon, CheckCheck, AlertCircle, Paperclip, ArrowLeft
} from "lucide-react";

const priorityColors: Record<string, string> = {
  low: "bg-slate-100 text-slate-600",
  normal: "bg-blue-100 text-blue-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

interface MessageThreadProps {
  conversation: any | null;
  messages: any[];
  onSend: (text: string) => void;
  isSending: boolean;
  onBack?: () => void;
  typingUsers: string[];
  onUpdateConv: (id: string, data: any) => void;
  agentRequests: any[];
  onDismissAgentRequest: (convToOpen?: any) => void;
  conversations: any[];
  sendTyping: (convId: string, isTyping: boolean) => void;
}

export default function MessageThread({
  conversation,
  messages,
  onSend,
  onBack,
  isSending,
  typingUsers,
  onUpdateConv,
  agentRequests,
  onDismissAgentRequest,
  conversations,
  sendTyping,
}: MessageThreadProps) {
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessageCount = useRef(0);

  useEffect(() => {
    prevMessageCount.current = 0;
  }, [conversation?._id]);

  useEffect(() => {
    if (!messagesContainerRef.current || messages.length === 0) return;
    const isFirstLoad = prevMessageCount.current === 0 && messages.length > 0;
    prevMessageCount.current = messages.length;
    const container = messagesContainerRef.current;
    if (isFirstLoad) {
      container.scrollTop = container.scrollHeight;
    } else {
      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  const getSenderName = (msg: any) => {
    if (msg.isAdminMessage) return "You";
    if (msg.senderName) return msg.senderName;
    if (msg.sender?.name) return msg.sender.name;
    return conversation?.lead?.name || "User";
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (!isTyping && conversation) {
      setIsTyping(true);
      sendTyping(conversation._id, true);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (conversation) sendTyping(conversation._id, false);
    }, 1500);
  };

  const doSend = () => {
    if (!messageText.trim() || isSending) return;
    const text = messageText.trim();
    setMessageText("");
    setIsTyping(false);
    if (conversation) sendTyping(conversation._id, false);
    onSend(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); doSend(); }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">

      {/* Agent request banner */}
      {agentRequests.length > 0 && (
        <div className="bg-orange-500 text-white px-4 py-2.5 flex items-center justify-between flex-shrink-0 z-10">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 flex-shrink-0" />
            <span className="text-sm font-bold">
              {agentRequests[0].visitorName} wants help with: {agentRequests[0].department || "General Enquiry"}
            </span>
            <span className="text-xs text-orange-100">
              · {agentRequests[0].visitorEmail}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const conv = conversations.find((c: any) => c._id === agentRequests[0].conversationId);
                onDismissAgentRequest(conv);
              }}
              className="px-3 py-1 bg-white text-orange-600 rounded-lg text-xs font-bold hover:bg-orange-50 transition-colors"
            >
              Open Chat
            </button>
            <button
              onClick={() => onDismissAgentRequest()}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!conversation ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="size-20 rounded-3xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
              <InboxIcon className="size-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-700">Select a conversation</h3>
            <p className="text-sm text-slate-400 mt-1">Choose from the left to start chatting</p>
          </div>
        </div>
      ) : (
        <>
          {/* Conversation header */}
          <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm flex-shrink-0">
                        <div className="flex items-center gap-3">
              {onBack && (
                <button onClick={onBack} className="md:hidden p-1.5 hover:bg-slate-100 rounded-lg">
                  <ArrowLeft className="size-4 text-slate-600" />
                </button>
              )}
              <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
            {conversation.lead?.name?.charAt(0) || "?"}
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">{conversation.subject}</h3>
                <div className="flex items-center gap-3 mt-0.5">
                  {conversation.lead?.name && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <User className="size-3" />{conversation.lead.name}
                    </span>
                  )}
                  {conversation.lead?.email && (
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Mail className="size-3" />{conversation.lead.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={conversation.priority || "normal"}
                onChange={e => onUpdateConv(conversation._id, { priority: e.target.value })}
                className={`px-2 py-1 rounded-lg text-xs font-bold border-0 cursor-pointer ${priorityColors[conversation.priority] || "bg-slate-100"}`}>
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <button
                onClick={() => {
                  const newStatus = conversation.status === "open" ? "closed" : "open";
                  onUpdateConv(conversation._id, { status: newStatus });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  conversation.status === "open"
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}>
                {conversation.status === "open" ? "Close" : "Reopen"}
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 text-slate-400 text-sm">
                No messages yet — start the conversation
              </div>
            )}

            {messages.map((msg: any, idx: number) => {
              const isAdmin = !!msg.isAdminMessage;
              const showDate = idx === 0 || new Date(messages[idx - 1]?.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

              return (
                <div key={msg._id || idx}>
                  {showDate && (
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-slate-200" />
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(msg.createdAt).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                      </span>
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  )}

                  <div className={`flex items-end gap-2 ${isAdmin ? "justify-end" : "justify-start"}`}>
                    {!isAdmin && (
                      <div className="size-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mb-1">
                        {conversation.lead?.name?.charAt(0) || "?"}
                      </div>
                    )}

                    <div className={`max-w-[65%] ${isAdmin ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                        isAdmin
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-md"
                          : "bg-white border border-slate-200 text-slate-800 rounded-bl-md shadow-sm"
                      }`}>
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        {msg.attachments?.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att: any, i: number) =>
                              att.type?.startsWith("image/") ? (
                                <img key={i} src={att.url} alt={att.name} className="max-w-[200px] rounded-lg border border-white/20 mt-1" />
                              ) : (
                                <a key={i} href={att.url} target="_blank" rel="noopener noreferrer"
                                  className={`flex items-center gap-1 text-xs hover:underline mt-1 ${isAdmin ? "text-white/80" : "text-blue-600"}`}>
                                  <Paperclip className="size-3" />{att.name}
                                </a>
                              )
                            )}
                          </div>
                        )}
                      </div>
                      <div className={`flex items-center gap-1 mt-1 ${isAdmin ? "justify-end" : "justify-start"}`}>
                        <span className="text-[10px] text-slate-400">
                          {getSenderName(msg)}
                          {" · "}
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        {isAdmin && msg.read && <CheckCheck className="size-3 text-blue-400" />}
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="size-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mb-1">
                        A
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing indicator */}
            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-full bg-slate-300 flex items-center justify-center">
                  <User className="size-3 text-white" />
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="size-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
                <span className="text-xs text-slate-400">{typingUsers[0]} is typing...</span>
              </div>
            )}
          </div>

          {/* Reply box */}
          <div className="px-6 py-4 bg-white border-t border-slate-200 flex-shrink-0">
            {conversation.status === "closed" ? (
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-sm text-amber-700 font-medium">This conversation is closed</span>
                <button
                  onClick={() => onUpdateConv(conversation._id, { status: "open" })}
                  className="px-3 py-1 bg-amber-500 text-white rounded-lg text-xs font-bold">
                  Reopen
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={messageText}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your reply... (Enter to send)"
                  className="flex-1 px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
                <button
                  onClick={doSend}
                  disabled={!messageText.trim() || isSending}
                  className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2">
                  {isSending ? (
                    <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="size-4" />
                  )}
                </button>
              </div>
            )}
            <p className="text-xs text-slate-400 mt-2">
              🔌 Real-time · User notified via email on reply
            </p>
          </div>
        </>
      )}
    </div>
  );
}
