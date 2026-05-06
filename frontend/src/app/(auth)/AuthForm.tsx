// src/app/(auth)/AuthForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ShieldCheck, Mail, Lock, User, Key, ArrowRight, ChevronLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from "sonner";
import { useTheme } from "next-themes";

interface AuthFormProps {
  mode: 'login' | 'register';
}

export default function AuthForm({ mode: initialMode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { theme } = useTheme();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const redirectTo = searchParams?.get('from') || '/dashboard';

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;

    if (mode === 'forgot') {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok) {
          toast.success(data.message || "Link de recuperação enviado!");
          setMode('login');
        } else {
          toast.error(data.error || "Erro ao solicitar recuperação");
        }
      } catch (err) {
        toast.error("Erro de conexão com o servidor");
      } finally {
        setLoading(false);
      }
      return;
    }

    try {
      const password = form.get('password') as string;
      const name = form.get('name') as string;
      const role = form.get('role') as string;
      const licenseKey = form.get('licenseKey') as string;

      const endpoint = mode === 'register' ? 'register' : 'login';
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/${endpoint}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role, licenseKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro na operação');
      }

      if (mode === 'login') {
        const data = await response.json();
        localStorage.setItem('hasToken', 'true');
        
        if (data.user?.forcePasswordChange) {
            router.push('/change-password');
        } else {
            window.location.href = redirectTo;
        }
      } else {
        toast.success("Cadastro realizado com sucesso!");
        setMode('login');
        router.push('/login?registered=true');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
      toast.error(err.message || "Erro na operação");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-500 px-4 overflow-hidden relative ${isDark ? 'bg-[#0a0a0a]' : 'bg-slate-50'}`}>
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000 ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000 ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
           <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border mb-4 transition-all ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-500/5 border-emerald-500/10'}`}>
              <ShieldCheck className="text-emerald-500 w-8 h-8" />
           </div>
           <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
             {mode === 'register' ? 'Comece agora' : mode === 'forgot' ? 'Recuperar senha' : 'Bem-vindo de volta'}
           </h1>
           <p className="text-muted-foreground mt-2 text-sm">
             {mode === 'register' ? 'Crie sua conta e comece a rastrear seus leads' : mode === 'forgot' ? 'Enviaremos um link para redefinir sua senha' : 'Acesse sua conta para gerenciar seu CRM'}
           </p>
        </div>

        <div className={`border rounded-3xl p-8 shadow-2xl transition-all ${isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200'}`}>
          {error && (
            <div className={`mb-6 p-4 border rounded-2xl text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-1 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <div className="w-1 h-1 rounded-full bg-red-500"></div>
              {error}
            </div>
          )}

          {searchParams?.get('registered') && mode === 'login' && (
            <div className={`mb-6 p-4 border rounded-2xl text-xs flex items-center gap-3 ${isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'}`}>
              <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
              Cadastro realizado! Faça login para entrar.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">
                  Nome Completo
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                  <input
                    name="name"
                    type="text"
                    placeholder="Seu nome"
                    className={`w-full border rounded-2xl px-11 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">
                Endereço de Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                <input
                  name="email"
                  type="email"
                  placeholder="exemplo@email.com"
                  className={`w-full border rounded-2xl px-11 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">
                    Desejo entrar como
                  </label>
                  <Select name="role" defaultValue="CLIENTE">
                    <SelectTrigger className={`w-full border rounded-2xl px-4 py-6 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                      <SelectValue placeholder="Selecione sua função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GESTOR">Gestor (Dono de Empresa)</SelectItem>
                      <SelectItem value="CLIENTE">Cliente (Acesso Comum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider">
                    Chave de Licença (Opcional)
                  </label>
                  <div className="relative">
                    <Key className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                    <input
                      name="licenseKey"
                      type="text"
                      placeholder="XXXX-XXXX-XXXX"
                      className={`w-full border rounded-2xl px-11 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none font-mono ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                      disabled={loading}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-1 italic">Vazio = 10 dias de teste grátis.</p>
                </div>
              </>
            )}
            
            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Sua Senha
                  </label>
                  {mode === 'login' && (
                    <button 
                      type="button" 
                      onClick={() => setMode('forgot')}
                      className="text-[10px] text-emerald-500 hover:text-emerald-400 font-bold uppercase tracking-widest"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 h-5 w-5 text-gray-500" />
                  <input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    className={`w-full border rounded-2xl px-11 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    required
                    minLength={3}
                    disabled={loading}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-black font-bold py-4 rounded-2xl hover:bg-emerald-400 transition-all flex items-center justify-center disabled:opacity-70 group shadow-xl shadow-emerald-500/10"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === 'register' ? 'Criar minha conta' : mode === 'forgot' ? 'Enviar Link' : 'Entrar no Painel'}
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-2 pt-2 transition-colors"
              >
                <ChevronLeft size={16} />
                Voltar para o login
              </button>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-muted-foreground text-sm">
              {mode === 'register' ? 'Já possui uma conta ativa?' : 'Ainda não possui uma conta?'}{' '}
              <button
                type="button"
                onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors"
              >
                {mode === 'register' ? 'Fazer login' : 'Registrar agora'}
              </button>
            </p>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-muted-foreground mt-8 uppercase tracking-widest opacity-50">
          © 2026 Rastreia AI • Sistema de Gestão de Leads Premium
        </p>
      </div>
    </div>
  );
}