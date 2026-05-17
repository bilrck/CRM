"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
    Search, 
    MoreVertical, 
    Paperclip, 
    Send, 
    CheckCheck,
    Phone,
    Tag,
    User,
    Clock,
    RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { socket } from "@/lib/socket";
import { useUser, useSystemConfig } from "@/app/api/userProvider";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


import debounce from "lodash.debounce";

// Interfaces
interface Message {
    id: number;
    body: string;
    fromMe: boolean;
    createdAt: string;
    senderName: string;
    type: string;
    mediaUrl?: string;
    mediaMimeType?: string;
}

interface Conversation {
    id: number;
    remoteJid: string;
    name: string;
    profilePicUrl: string | null;
    status: "OPEN" | "PENDING" | "CLOSED";
    unreadCount: number;
    user?: { name: string };
    lastMessage?: string;
    lastMessageAt?: string;
    updatedAt: string;
    isTracked?: boolean;
}

interface Funnel {
    id: number;
    name: string;
    stages: { id: number; name: string }[];
}

export default function Whatsapp() {
    const user = useUser();
    const { modules } = useSystemConfig();
    const [activeTab, setActiveTab] = useState("OPEN");
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);

    if (modules.whatsapp === false) {
        return (
            <div className="p-8 max-w-4xl mx-auto flex h-[calc(100vh-theme(spacing.16))] items-center justify-center">
                <div className="bg-red-50 border border-red-200 rounded-3xl p-16 text-center max-w-md w-full shadow-lg shadow-red-50">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                        <Phone className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-red-800 mb-2">Módulo Desativado</h3>
                    <p className="text-red-700">
                        O módulo de WhatsApp está desativado temporariamente pelo administrador do sistema.
                    </p>
                </div>
            </div>
        );
    }
    const [messagesCache, setMessagesCache] = useState<Record<number, Message[]>>({});
    const [newMessage, setNewMessage] = useState("");
    const [filterAll, setFilterAll] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activeChatRef = useRef<Conversation | null>(null);
    const conversationsRef = useRef<Conversation[]>([]);
    
    // Create Lead States
    const [createLeadOpen, setCreateLeadOpen] = useState(false);
    const [funnels, setFunnels] = useState<Funnel[]>([]);
    const [selectedFunnelId, setSelectedFunnelId] = useState("");
    const [selectedStageId, setSelectedStageId] = useState("");

    // Keep ref in sync for socket callback
    useEffect(() => {
        activeChatRef.current = selectedChat;
    }, [selectedChat]);

    // Track active conversations in a ref to usage in socket callback
    useEffect(() => {
        conversationsRef.current = conversations;
    }, [conversations]);

    // Multi-instance support
    const [activeConnection, setActiveConnection] = useState("all");
    const [connectionsList, setConnectionsList] = useState<{ id: number, name: string, provider: string }[]>([]);

    useEffect(() => {
        // Load Connections
        async function loadConnections() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/connections`, { credentials: 'include' });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setConnectionsList(data.filter((c: { provider: string }) => c.provider === 'evolution'));
                } else {
                    setConnectionsList([]);
                }
            } catch (error) {
                console.error("Erro ao carregar conexões:", error);
                setConnectionsList([]);
            }
        }
        loadConnections();
        
        // Initialize Audio for notifications
        audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3");
    }, []);

    // Load Funnels
    useEffect(() => {
        async function loadFunnels() {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/funnel`, { credentials: 'include' });
                const data = await res.json();
                if (Array.isArray(data)) {
                    setFunnels(data);
                    if (data.length > 0) {
                        setSelectedFunnelId(data[0].id.toString());
                    }
                }
            } catch {
                console.error("Erro ao carregar funis");
            }
        }
        loadFunnels();
    }, []);

    // Debounce search
    const debouncedSetSearch = useRef(
        debounce((nextValue: string) => {
            setDebouncedSearch(nextValue);
        }, 500)
    ).current;

    useEffect(() => {
        debouncedSetSearch(searchTerm);
    }, [searchTerm, debouncedSetSearch]);

    const scrollToBottom = useCallback(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 100);
        }
    }, []);

    // Fetch Conversas
    const fetchConversations = useCallback(async (status: string) => {
        try {
            const params = new URLSearchParams({
                status: status,
                connectionId: activeConnection,
                filter: filterAll ? 'all' : 'tracked'
            });
            if (debouncedSearch) params.append("search", debouncedSearch);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/what/conversations?${params.toString()}`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setConversations(data);
            } else {
                setConversations([]);
                if (data.error) toast.error(data.error);
            }
        } catch (error) {
            console.error("Erro ao buscar conversas:", error);
            setConversations([]);
            toast.error("Erro ao carregar conversas do servidor");
        }
    }, [activeConnection, debouncedSearch, filterAll]);

    // Fetch Mensagens
    const fetchMessages = useCallback(async (id: number) => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/what/conversations/${id}/messages`, {
                credentials: 'include'
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setMessagesCache(prev => ({ ...prev, [id]: data }));
                scrollToBottom();
            } else {
                setMessagesCache(prev => ({ ...prev, [id]: [] }));
                if (data.error) toast.error(data.error);
            }
        } catch (error) {
            console.error("Erro ao buscar mensagens:", error);
            setMessagesCache(prev => ({ ...prev, [id]: [] }));
        }
    }, [scrollToBottom]);

    useEffect(() => {
        fetchConversations(activeTab);
        const interval = setInterval(() => fetchConversations(activeTab), 15000); // Increased interval as we have sockets
        return () => clearInterval(interval);
    }, [activeTab, fetchConversations]);

    // Socket.IO Singleton Connection & Listeners
    useEffect(() => {
        const onMessageNew = (data: { conversationId: number; message: Message; fromMe: boolean; [key: string]: unknown }) => {
            console.log("📩 Socket -> Nova Mensagem:", data);
            const { conversationId, message } = data;

             // 0. Sound Notification Logic (Tracked Only)
             if (!message.fromMe && audioRef.current) {
                // Check if the conversation is known and tracked
                const conv = conversationsRef.current.find(c => String(c.id) === String(conversationId));
                if (conv && conv.isTracked) {
                     audioRef.current.play().catch(e => console.error("Audio Play Error:", e));
                     toast.info(`Nova mensagem de ${conv.name || 'Cliente Rastreado'}`);
                }
            }

            // 1. Atualizar Cache de Mensagens
            setMessagesCache((prev) => {
                const currentMsgs = prev[conversationId] || [];
                if (currentMsgs.some(m => m.id === message.id)) return prev;
                return {
                    ...prev,
                    [conversationId]: [...currentMsgs, message]
                };
            });

            // 2. Rolagem se for o chat ativo
            if (activeChatRef.current && String(activeChatRef.current.id) === String(conversationId)) {
                scrollToBottom();
            }

            // 3. Atualizar lista de conversas
            setConversations((prev) => {
                const existing = prev.find(c => String(c.id) === String(conversationId));
                if (!existing) return prev;

                return prev.map(conv => {
                    if (String(conv.id) === String(conversationId)) {
                        return {
                            ...conv,
                            lastMessage: message.body,
                            lastMessageAt: message.createdAt,
                            unreadCount: (activeChatRef.current && String(activeChatRef.current.id) === String(conversationId)) 
                                ? conv.unreadCount 
                                : conv.unreadCount + 1
                        };
                    }
                    return conv;
                }).sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
            });
        };

        socket.on("message:new", onMessageNew);

        // Cleanup: Apenas remover o listener
        return () => {
            socket.off("message:new", onMessageNew);
        };
    }, [scrollToBottom]); // Add scrollToBottom as it is used inside

    // Join room when user/workspace is available
    useEffect(() => {
        if (user?.workspaceId) {
            socket.emit("join:workspace", user.workspaceId);
        }
    }, [user?.workspaceId]);



    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id);
        }
    }, [selectedChat, fetchMessages, scrollToBottom]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedChat) return;

        const body = newMessage;
        setNewMessage(""); // Clear immediately for UX

        try {
            const tempId = Date.now();
            const tempMsg: Message = {
                id: tempId,
                body: body,
                fromMe: true,
                createdAt: new Date().toISOString(),
                type: 'text',
                senderName: "Eu"
            };
            setMessagesCache((prev) => {
                const currentMsgs = prev[selectedChat.id] || [];
                return {
                    ...prev,
                    [selectedChat.id]: [...currentMsgs, tempMsg]
                };
            });
            scrollToBottom();

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/what/messages/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ conversationId: selectedChat.id, body: body }),
                credentials: 'include'
            });

            if (!res.ok) throw new Error("Falha no envio");
            
        } catch {
            toast.error("Erro ao enviar mensagem");
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!selectedChat) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/what/conversations/${selectedChat.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
                credentials: 'include'
            });
            toast.success(`Conversa movida para ${newStatus}`);
            setConversations(conversations.filter(c => c.id !== selectedChat.id));
            setSelectedChat(null);
        } catch {
            toast.error("Erro ao atualizar status");
        }
    };

    const handleCreateLead = async () => {
        if (!selectedChat) return;
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/what/conversations/${selectedChat.id}/create-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    funnelId: selectedFunnelId ? Number(selectedFunnelId) : undefined,
                    stageId: selectedStageId ? Number(selectedStageId) : undefined
                }),
                credentials: 'include'
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            toast.success(`Lead "${data.name}" criado com sucesso!`);
            setCreateLeadOpen(false);
            // Reset fields
            if (funnels.length > 0) setSelectedFunnelId(funnels[0].id.toString());
            setSelectedStageId("");
        } catch {
            toast.error("Erro ao criar lead");
        }
    };

    const activeFunnel = funnels.find(f => f.id.toString() === selectedFunnelId);

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] bg-background overflow-hidden text-foreground">
            
            {/* Coluna 1: Lista de Conversas */}
            <div className="w-80 border-r border-border flex flex-col bg-muted/20">
                <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-lg">Conversas</h2>
                        <div className="flex gap-1">
                            <Button size="icon" variant="ghost" title="Sincronizar Conversas" onClick={async () => {
                                if(activeConnection === 'all') return toast.error("Selecione uma conexão específica para importar");
                                setLoading(true);
                                try {
                                    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/what/import`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ connectionId: Number(activeConnection) }),
                                        credentials: 'include'
                                    });
                                    const data = await res.json();
                                    toast.success(`${data.imported} conversas importadas!`);
                                    fetchConversations(activeTab);
                                 } catch {
                                    toast.error("Erro ao importar");
                                } finally {
                                    setLoading(false);
                                }
                            }} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Pesquisa */}
                    <div className="relative">
                        <Input 
                            placeholder="Buscar contato..." 
                            className="text-sm pl-8 bg-card"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    </div>

                    {/* Select Instance & Filter Toggle */}
                     <div className="space-y-2">
                        <select 
                            className="w-full p-2 border border-border rounded bg-background text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                            onChange={(e) => setActiveConnection(e.target.value)}
                            value={activeConnection}
                        >
                            <option value="all">Todas as Conexões</option>
                            {connectionsList.map((c) => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                        <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                             <Button 
                                variant={!filterAll ? "secondary" : "ghost"} 
                                size="sm" 
                                className="flex-1 text-xs h-7 shadow-none"
                                onClick={() => setFilterAll(false)}
                             >
                                 Rastreados
                             </Button>
                             <Button 
                                variant={filterAll ? "secondary" : "ghost"} 
                                size="sm" 
                                className="flex-1 text-xs h-7 shadow-none"
                                onClick={() => setFilterAll(true)}
                             >
                                 Todos
                             </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 bg-gray-100">
                            <TabsTrigger value="OPEN" className="text-xs">Abertos</TabsTrigger>
                            <TabsTrigger value="PENDING" className="text-xs">Pendentes</TabsTrigger>
                            <TabsTrigger value="CLOSED" className="text-xs">Fechados</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col divide-y">
                        {conversations.map((chat) => (
                            <button
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors text-left border-l-4 ${selectedChat?.id === chat.id ? 'bg-background border-primary shadow-sm' : 'border-transparent'}`}
                            >
                                <Avatar className="h-12 w-12 flex-shrink-0">
                                    <AvatarImage src={chat.profilePicUrl || ""} />
                                    <AvatarFallback>{chat.name?.substring(0, 2).toUpperCase() || "CN"}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-semibold truncate text-sm text-foreground">
                                            {(chat.name && chat.name.toLowerCase() !== "você") ? chat.name : (chat.remoteJid.split('@')[0])}
                                        </span>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                                            {chat.lastMessageAt ? new Date(chat.lastMessageAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs text-muted-foreground truncate flex-1 pr-2">
                                            {chat.lastMessage || (chat.user ? `Att: ${chat.user.name}` : 'Sem mensagens')}
                                        </p>
                                        {chat.unreadCount > 0 && (
                                            <Badge className="bg-primary hover:bg-primary/90 h-5 min-w-[20px] rounded-full p-0 flex items-center justify-center text-[10px] border-none text-primary-foreground">
                                                {chat.unreadCount}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))}
                        {conversations.length === 0 && (
                            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                                <Search className="h-8 w-8 opacity-20" />
                                <p>Nenhuma conversa encontrada</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Coluna 2: Chat Principal */}
            {selectedChat ? (
                <div className="flex-1 flex flex-col min-w-0 bg-muted/10">
                    {/* Header */}
                    <div className="h-16 border-b border-border bg-background flex items-center justify-between px-6 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <Avatar>
                                <AvatarImage src={selectedChat.profilePicUrl || ""} />
                                <AvatarFallback>{selectedChat.name?.substring(0, 2).toUpperCase() || "CN"}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-medium text-foreground">{selectedChat.name || selectedChat.remoteJid}</h3>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <span className="w-2 h-2 bg-primary rounded-full inline-block animate-pulse"></span>
                                    Online via WhatsApp
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setCreateLeadOpen(true)}
                                className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/20"
                            >
                                <User className="h-4 w-4 mr-2" />
                                Criar Lead
                            </Button>
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => handleStatusChange("CLOSED")}>
                                        Fechar Conversa
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange("PENDING")}>
                                        Mover para Pendentes
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleStatusChange("OPEN")}>
                                        Mover para Abertos
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Create Lead Dialog */}
                    <Dialog open={createLeadOpen} onOpenChange={setCreateLeadOpen}>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Criar Lead</DialogTitle>
                                <DialogDescription>
                                    Criar um novo lead a partir desta conversa e inserir no funil.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label>Nome do Contato</Label>
                                    <Input value={selectedChat?.name || selectedChat?.remoteJid || ""} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Funil</Label>
                                    <Select value={selectedFunnelId} onValueChange={v => { setSelectedFunnelId(v); setSelectedStageId(""); }}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione um funil" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {funnels.map(f => (
                                                <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Estágio</Label>
                                    <Select value={selectedStageId} onValueChange={setSelectedStageId} disabled={!selectedFunnelId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecione o estágio" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {activeFunnel?.stages.map(s => (
                                                <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setCreateLeadOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button onClick={handleCreateLead} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                                    Criar Lead
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-[url('/whatsapp-bg.png')] bg-repeat">
                        <div className="space-y-4">
                            {(messagesCache[selectedChat.id] || []).map((msg: Message) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                                        msg.fromMe ? 'bg-primary/20 text-foreground rounded-tr-none' : 'bg-card text-foreground rounded-tl-none'
                                    }`}>
                                        <p className="no-underline hover:underline font-bold text-[12px] opacity-70">{selectedChat?.remoteJid.endsWith("@g.us") && !msg.fromMe && (msg.senderName || "")}</p>
                                        
                                        {/* Media Rendering */}
                                        {(msg.mediaUrl || ["image", "video", "audio", "document", "sticker"].includes(msg.type)) ? (
                                            <div className="mb-2">
                                                {msg.type === "image" && (
                                                    <img 
                                                        src={msg.mediaUrl ? (msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${process.env.NEXT_PUBLIC_API_URL}${msg.mediaUrl}`) : `${process.env.NEXT_PUBLIC_API_URL}/what/messages/${msg.id}/media`} 
                                                        alt="Imagem Recebida" 
                                                        className="rounded-md max-w-full max-h-64 object-cover cursor-pointer" 
                                                        onClick={() => window.open(msg.mediaUrl ? (msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${process.env.NEXT_PUBLIC_API_URL}${msg.mediaUrl}`) : `${process.env.NEXT_PUBLIC_API_URL}/what/messages/${msg.id}/media`, '_blank')}
                                                    />
                                                )}
                                                {msg.type === "video" && (
                                                    <video 
                                                        src={msg.mediaUrl ? (msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${process.env.NEXT_PUBLIC_API_URL}${msg.mediaUrl}`) : `${process.env.NEXT_PUBLIC_API_URL}/what/messages/${msg.id}/media`} 
                                                        controls 
                                                        className="rounded-md max-w-full max-h-64" 
                                                    />
                                                )}
                                                {msg.type === "audio" && (
                                                    <audio 
                                                        src={msg.mediaUrl ? (msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${process.env.NEXT_PUBLIC_API_URL}${msg.mediaUrl}`) : `${process.env.NEXT_PUBLIC_API_URL}/what/messages/${msg.id}/media`} 
                                                        controls 
                                                        className="w-full mt-2" 
                                                    />
                                                )}
                                                {msg.type === "document" && (
                                                    <a 
                                                        href={msg.mediaUrl ? (msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${process.env.NEXT_PUBLIC_API_URL}${msg.mediaUrl}`) : `${process.env.NEXT_PUBLIC_API_URL}/what/messages/${msg.id}/media`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="flex items-center gap-2 text-blue-600 underline text-sm p-2 bg-blue-50 rounded"
                                                    >
                                                        📄 Ver Documento
                                                    </a>
                                                )}
                                                {msg.type === "sticker" && (
                                                    <img 
                                                        src={msg.mediaUrl ? (msg.mediaUrl.startsWith('http') ? msg.mediaUrl : `${process.env.NEXT_PUBLIC_API_URL}${msg.mediaUrl}`) : `${process.env.NEXT_PUBLIC_API_URL}/what/messages/${msg.id}/media`} 
                                                        alt="Figurinha" 
                                                        className="w-32 h-32 object-contain" 
                                                    />
                                                )}
                                            </div>
                                        ) : null}

                                        {msg.body && !["[Foto]", "[Áudio]", "[Vídeo]", "[Figurinha]", "[Documento]"].includes(msg.body) && (
                                            <p className="text-sm break-words">{msg.body}</p>
                                        )}
                                        
                                        <div className={`flex items-center justify-end gap-1 mt-1 ${msg.fromMe ? 'text-primary' : 'text-muted-foreground'}`}>
                                            <span className="text-[10px]">
                                                {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                            {msg.fromMe && <CheckCheck className="h-3 w-3" />}
                                        </div>
                                    </div>
                                </div>
                            ))}
                             <div ref={scrollRef} />
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-background border-t border-border">
                        <div className="flex items-end gap-2">
                            <Button variant="ghost" size="icon" className="mb-0.5">
                                <Paperclip className="h-5 w-5 text-muted-foreground" />
                            </Button>
                            <Input 
                                placeholder="Digite uma mensagem..." 
                                className="flex-1 min-h-[44px] bg-muted/30"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage();
                                    }
                                }}
                            />
                            <Button 
                                className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                onClick={handleSendMessage}
                            >
                                <Send className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center bg-muted/10 text-muted-foreground">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <Phone className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p>Selecione uma conversa para começar</p>
                </div>
            )}

            {/* Coluna 3: Info (Opcional, visível se chat selecionado) */}
            {selectedChat && (
                <div className="w-80 border-l border-border bg-background hidden xl:flex flex-col">
                    <div className="p-6 flex flex-col items-center border-b border-border">
                         <Avatar className="h-20 w-20 mb-3">
                            <AvatarImage src={selectedChat.profilePicUrl || ""} />
                            <AvatarFallback className="text-xl">{selectedChat.name?.substring(0, 2).toUpperCase() || "CN"}</AvatarFallback>
                        </Avatar>
                        <h3 className="font-semibold text-lg text-foreground">{selectedChat.name || "Contato Desconhecido"}</h3>
                        <p className="text-muted-foreground text-sm">{selectedChat.remoteJid}</p>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Informações</h4>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-foreground/80">
                                    <Tag className="h-4 w-4" />
                                    <span>Lead Novo</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-foreground/80">
                                    <Clock className="h-4 w-4" />
                                    <span>{selectedChat.status === 'OPEN' ? 'Em aberto' : selectedChat.status === 'PENDING' ? 'Pendente' : 'Fechado'}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm text-foreground/80">
                                    <User className="h-4 w-4" />
                                    <span>{selectedChat.user ? selectedChat.user.name : 'Sem dono'}</span>
                                </div>
                            </div>
                        </div>

                         <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Ações</h4>
                            <div className="space-y-2">
                                <Button variant="outline" className="w-full justify-start">
                                    <User className="mr-2 h-4 w-4" />
                                    Atribuir a mim
                                </Button>
                                <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                                    Bloquear Contato
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}