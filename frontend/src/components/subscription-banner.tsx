"use client";

import { useUser } from "@/app/api/userProvider";
import { AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./ui/button";
import Link from "next/link";

export function SubscriptionBanner() {
  const user = useUser();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (user?.trialEndsAt) {
      const end = new Date(user.trialEndsAt);
      const now = new Date();
      const diff = end.getTime() - now.getTime();
      setDaysRemaining(Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))));
    }
  }, [user]);

  if (!user || user.role === 'ADMIN') return null;

  // Trial Status
  if (user.subscriptionStatus === 'TRIAL' && daysRemaining !== null) {
    if (daysRemaining <= 3) {
      return (
        <div className="bg-amber-600 text-white px-4 py-2 flex items-center justify-between text-sm animate-pulse">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Seu período de teste termina em <strong>{daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</strong>. Assine agora para não perder o acesso!</span>
          </div>
          <Button size="sm" variant="secondary" asChild>
            <Link href="/assinatura">Assinar Agora</Link>
          </Button>
        </div>
      );
    }
    return (
      <div className="bg-blue-600 text-white px-4 py-2 flex items-center justify-center text-sm gap-2">
        <ActivityIcon className="w-4 h-4" />
        <span>Você está no <strong>Período de Teste</strong>: {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}.</span>
      </div>
    );
  }

  // Expired or Canceled
  const now = new Date();
  const isExpired = user.subscriptionExpiresAt && new Date(user.subscriptionExpiresAt) < now;

  if (user.subscriptionStatus === 'EXPIRED' || (user.subscriptionStatus === 'CANCELED' && isExpired)) {
    return (
      <div className="bg-destructive text-destructive-foreground px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span>Sua assinatura está expirada ou cancelada. Seus recursos foram limitados.</span>
        </div>
        <Button size="sm" variant="outline" className="bg-white text-destructive border-white hover:bg-gray-100" asChild>
          <Link href="/assinatura">Renovar Plano</Link>
        </Button>
      </div>
    );
  }

  if (user.subscriptionStatus === 'CANCELED' && !isExpired) {
    const end = user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
    const dateStr = end ? end.toLocaleDateString('pt-BR') : "N/A";
    return (
      <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Sua assinatura foi cancelada. Seu acesso continuará liberado até <strong>{dateStr}</strong>. Nenhuma nova cobrança será gerada.</span>
        </div>
      </div>
    );
  }

  return null;
}

function ActivityIcon(props: any) {
    return (
      <svg
        {...props}
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    )
  }
