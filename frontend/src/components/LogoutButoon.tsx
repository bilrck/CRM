// src/components/LogoutButton.tsx
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });

      // Remove o indicador de autenticação
      localStorage.removeItem('hasToken');
      
      // Força um recarregamento completo
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="w-full justify-start gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
    >
      <LogOut className="h-4 w-4" />
      Sair
    </Button>
  );
}