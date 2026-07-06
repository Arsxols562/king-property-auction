import { useState, useEffect } from "react";
import AdminLayout from "../components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { useSocket } from "@/lib/useSocket";
import { toast } from "sonner";
import ConversationList from "../components/inbox/ConversationList";
import MessageThread from "../components/inbox/MessageThread";

export default function Inbox() {
  const queryClient = useQueryClient();
  const { joinConversation, leaveConversation, sendMessage: socketSend, sendTyping, markRead, on } = useSocket();

  const [selectedConv, setSelectedConv] = useState<any>(null);
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [agentRequests, setAgentRequests] = useState<any[]>([]);
  const [showList, setShowList] = useState(true);

  // ─── Fetch conversations ───
  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ["conversations", filter, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (search) params.set("search", search);
      return apiClient.fetch(`/conversations?${params}`);
    },
    refetchInterval: 30000,
  });

  const conversations = conversationsData?.data || [];

  const { data: stats } = useQuery({
    queryKey: ["conversations", "stats"],
    queryFn: () => apiClient.fetch("/conversations/stats"),
    refetchInterval: 15000,
  });

  // ─── Fetch messages for selected conversation ───
  const { data: messagesData } = useQuery({
    queryKey: ["messages", selectedConv?._id],
    queryFn: () => apiClient.fetch(`/conversations/${selectedConv._id}/messages`),
    enabled: !!selectedConv,
  });

  const messages = messagesData?.data || [];

  // ─── Socket events ───
  useEffect(() => {
    const removeNewMsg = on("new_message", ({ conversationId, message }) => {
      queryClient.setQueryData(["messages", conversationId], (old: any) => {
        if (!old) return old;
        const exists = old.data?.some((m: any) => m._id === message._id);
        if (exists) return old;
        return { ...old, data: [...(old.data || []), message] };
      });

      queryClient.setQueryData(["conversations", filter, search], (old: any) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((c: any) =>
            c._id === conversationId
              ? {
                  ...c,
                  lastMessage: message,
                  unreadCount: {
                    ...c.unreadCount,
                    admin: selectedConv?._id === conversationId ? 0 : (c.unreadCount?.admin || 0) + 1,
                  },
                }
              : c
          ),
        };
      });
    });

    const removeTyping = on("user_typing", ({ conversationId, user, isTyping: typing }) => {
      if (conversationId !== selectedConv?._id) return;
      setTypingUsers(prev =>
        typing ? [...prev.filter(n => n !== user.name), user.name] : prev.filter(n => n !== user.name)
      );
    });

    const removeRead = on("messages_read", ({ conversationId }) => {
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    });

    const removeAgentReq = on("agent_requested", (data: any) => {
      setAgentRequests(prev => {
        if (prev.some((r: any) => r.conversationId === data.conversationId)) return prev;
        return [...prev, data];
      });
      toast.info(`🙋 ${data.visitorName} is requesting a human agent`, { duration: 8000 });
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      setTimeout(() => {
        setAgentRequests(prev => prev.filter((r: any) => r.conversationId !== data.conversationId));
      }, 60000);
    });

    return () => {
      removeNewMsg();
      removeTyping();
      removeRead();
      removeAgentReq();
    };
  }, [on, selectedConv?._id, filter, search, queryClient]);

  // ─── Join/leave conversation rooms ───
  useEffect(() => {
    if (selectedConv?._id) {
      joinConversation(selectedConv._id);
      markRead(selectedConv._id);
      return () => leaveConversation(selectedConv._id);
    }
  }, [selectedConv?._id, joinConversation, leaveConversation, markRead]);

  // ─── Send message via socket ───
  const handleSend = async (text: string) => {
    if (!selectedConv || isSending) return;
    setIsSending(true);
    try {
      await socketSend(selectedConv._id, text);
    } catch {
      try {
        await apiClient.fetch(`/conversations/${selectedConv._id}/messages`, {
          method: "POST",
          body: JSON.stringify({ text }),
        });
        queryClient.invalidateQueries({ queryKey: ["messages", selectedConv._id] });
      } catch {
        toast.error("Failed to send message");
      }
    } finally {
      setIsSending(false);
    }
  };

  // ─── Update conversation (status/priority) ───
  const updateConv = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiClient.fetch(`/conversations/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["conversations"] }),
  });

  const handleUpdateConv = (id: string, data: any) => {
    setSelectedConv((prev: any) => ({ ...prev, ...data }));
    updateConv.mutate({ id, data });
  };

  const openConversation = (conv: any) => {
    setSelectedConv(conv);
    setTypingUsers([]);
    setShowList(false);
    setAgentRequests(prev => prev.filter((r: any) => r.conversationId !== conv._id));
  };

  return (
    <AdminLayout activeTab="inbox" onTabChange={() => {}}>
      <div className="flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border-2 border-slate-200 shadow-lg">
        <div className={`${!showList && selectedConv ? 'hidden' : 'flex'} md:flex w-full md:w-80 flex-shrink-0`}>
          <ConversationList
            conversations={conversations}
            selected={selectedConv}
            onSelect={openConversation}
            loading={isLoading}
            search={search}
            onSearch={setSearch}
            filter={filter}
            onFilterChange={setFilter}
            stats={stats}
          />
        </div>
        <div className={`${showList || !selectedConv ? 'hidden' : 'flex'} md:flex flex-1`}>
          <MessageThread
            conversation={selectedConv}
            messages={messages}
            onSend={handleSend}
            isSending={isSending}
            typingUsers={typingUsers}
            onUpdateConv={handleUpdateConv}
            agentRequests={agentRequests}
            onDismissAgentRequest={(convToOpen) => {
              if (convToOpen) openConversation(convToOpen);
              setAgentRequests(prev => prev.slice(1));
            }}
            conversations={conversations}
            sendTyping={sendTyping}
            onBack={() => setShowList(true)}
          />
        </div>
      </div>
    </AdminLayout>
  );
}
