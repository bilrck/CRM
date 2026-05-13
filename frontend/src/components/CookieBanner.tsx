'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted or rejected cookies
    const cookieConsent = localStorage.getItem('rastreia_cookie_consent');
    if (!cookieConsent) {
      setIsVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('rastreia_cookie_consent', 'all');
    setIsVisible(false);
  };

  const handleAcceptEssential = () => {
    localStorage.setItem('rastreia_cookie_consent', 'essential');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 md:max-w-2xl md:mx-auto md:bottom-6">
      <div className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-slate-800 rounded-2xl shadow-2xl p-5 sm:p-6 flex flex-col sm:flex-row gap-4 sm:items-center relative">
        <button 
          onClick={handleAcceptEssential}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>
        
        <div className="bg-emerald-100 dark:bg-emerald-900/30 w-12 h-12 rounded-full flex items-center justify-center shrink-0 hidden sm:flex">
          <Shield className="text-emerald-600 dark:text-emerald-400" size={24} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 sm:hidden">
            <Shield className="text-emerald-600 dark:text-emerald-400" size={18} />
            <h3 className="font-semibold text-slate-900 dark:text-white">Privacidade e Cookies</h3>
          </div>
          <h3 className="font-semibold text-slate-900 dark:text-white hidden sm:block">Privacidade e Cookies</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Utilizamos cookies para melhorar sua experiência e analisar nosso tráfego. Ao continuar navegando, você concorda com a nossa{' '}
            <Link href="/privacidade" className="text-emerald-600 hover:underline font-medium">
              Política de Privacidade
            </Link>.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 shrink-0 mt-2 sm:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleAcceptEssential}
            className="text-xs"
          >
            Apenas Essenciais
          </Button>
          <Button 
            size="sm" 
            onClick={handleAcceptAll}
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
          >
            Aceitar Todos
          </Button>
        </div>
      </div>
    </div>
  );
}
