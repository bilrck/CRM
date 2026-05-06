"use client";
import { useState, useEffect, useCallback } from "react";
import { Bell, Info, AlertTriangle, XCircle, CheckCircle2 } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { socket } from "@/lib/socket";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Notification {
  id: number;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "ERROR";
  read: boolean;
  createdAt: string;
}

export function Notifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
                credentials: "include"
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setNotifications(data);
                setUnreadCount(data.filter(n => !n.read).length);
            }
        } catch (err) {
            console.error("Erro ao carregar notificações");
        }
    }, []);

    useEffect(() => {
        fetchNotifications();

        const onNotificationUpdate = () => {
             fetchNotifications(); // Recarregar quando receber evento de notificação
        };

        const onMessageNew = (data: any) => {
            if (!data.fromMe) {
                fetchNotifications();
            }
        };

        socket.on("notification:new", onNotificationUpdate);
        socket.on("message:new", onMessageNew);
        
        return () => {
            socket.off("notification:new", onNotificationUpdate);
            socket.off("message:new", onMessageNew);
        };
    }, [fetchNotifications]);

    const markAllAsRead = async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/mark-all-read`, {
                method: "PUT",
                credentials: "include"
            });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (err) {
            toast.error("Erro ao marcar notificações como lidas");
        }
    };

    const getTypeStyles = (type: Notification["type"]) => {
        switch (type) {
            case "WARNING": return { color: "text-amber-500", bg: "bg-amber-50", icon: AlertTriangle };
            case "ERROR": return { color: "text-red-500", bg: "bg-red-50", icon: XCircle };
            default: return { color: "text-blue-500", bg: "bg-blue-50", icon: Info };
        }
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <DropdownMenu onOpenChange={(open) => open && unreadCount > 0 && markAllAsRead()}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5 text-gray-500" />
                    {unreadCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600 border-2 border-white">
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden">
                <div className="p-3 font-semibold border-b bg-gray-50 flex justify-between items-center">
                    <span>Notificações</span>
                    {unreadCount > 0 && (
                        <span className="text-[10px] text-emerald-600 font-normal">Sincronizado</span>
                    )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm italic">
                            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                            Nenhuma notificação por enquanto
                        </div>
                    ) : (
                        notifications.map(n => {
                            const styles = getTypeStyles(n.type);
                            const Icon = styles.icon;
                            return (
                                <DropdownMenuItem key={n.id} className={cn(
                                    "flex items-start gap-3 p-3 border-b last:border-0 cursor-default focus:bg-gray-50 transition-colors",
                                    !n.read && "bg-blue-50/20"
                                )}>
                                    <div className={cn("p-1.5 rounded-full shrink-0", styles.bg, styles.color)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                                        <div className="flex justify-between items-center w-full">
                                            <span className="font-semibold text-xs truncate max-w-[170px]">{n.title}</span>
                                            <span className="text-[9px] text-gray-400 shrink-0">{formatTime(n.createdAt)}</span>
                                        </div>
                                        <p className="text-[11px] text-gray-600 line-clamp-2">{n.message}</p>
                                    </div>
                                </DropdownMenuItem>
                            );
                        })
                    )}
                </div>
                {notifications.length > 0 && (
                    <div className="p-2 border-top bg-gray-50 text-center">
                        <Button variant="ghost" size="sm" className="text-[10px] h-6" onClick={fetchNotifications}>
                            Atualizar lista
                        </Button>
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

