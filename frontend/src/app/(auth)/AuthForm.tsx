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
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'verify2FA'>(initialMode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [twoFactorEmail, setTwoFactorEmail] = useState<string | null>(null);
  const redirectTo = searchParams?.get('from') || '/dashboard';

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = (form.get('email') as string) || twoFactorEmail || "";

    if (mode === 'verify2FA') {
      try {
        const code = form.get('code') as string;
        if (!code || code.length !== 6) {
          throw new Error("O código de verificação deve conter 6 dígitos.");
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/verify-2fa`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: twoFactorEmail, code }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Código incorreto ou expirado');
        }

        localStorage.setItem('hasToken', 'true');
        toast.success("Autenticação realizada com sucesso!");
        if (data.user?.forcePasswordChange) {
          router.push('/change-password');
        } else {
          window.location.href = redirectTo;
        }
      } catch (err: any) {
        setError(err.message || 'Código incorreto ou expirado.');
        toast.error(err.message || "Erro na verificação");
      } finally {
        setLoading(false);
      }
      return;
    }

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro na operação');
      }

      if (mode === 'login') {
        if (data.twoFactorRequired) {
          setTwoFactorEmail(data.email);
          setMode('verify2FA');
          toast.success("Código de segurança enviado ao seu e-mail!");
          return;
        }

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
      <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000 ${isDark ? 'bg-indigo-500/10' : 'bg-indigo-500/5'}`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none transition-opacity duration-1000 ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}></div>

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-8">
           <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl border mb-4 transition-all ${isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-500/5 border-blue-500/10'}`}>
              <ShieldCheck className="text-blue-600 w-8 h-8" />
           </div>
           <h1 className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
             {mode === 'register' ? 'Comece agora' : mode === 'forgot' ? 'Recuperar senha' : mode === 'verify2FA' ? 'Verificação de 2 Fatores' : 'Bem-vindo de volta'}
           </h1>
           <p className="text-muted-foreground mt-2 text-sm max-w-xs mx-auto leading-relaxed">
             {mode === 'register' 
               ? 'Crie sua conta e comece a rastrear seus leads' 
               : mode === 'forgot' 
                 ? 'Enviaremos um link para redefinir sua senha' 
                 : mode === 'verify2FA' 
                   ? `Insira o código de segurança de 6 dígitos enviado por e-mail.` 
                   : 'Acesse sua conta para gerenciar seu CRM'}
           </p>
        </div>

        <div className={`border rounded-3xl p-8 shadow-2xl transition-all ${isDark ? 'bg-[#141414] border-white/5' : 'bg-white border-slate-200'}`}>
          {error && (
            <div className={`mb-6 p-4 border rounded-2xl text-xs flex items-center gap-3 animate-in fade-in slide-in-from-top-1 ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-200 text-red-600'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
              {error}
            </div>
          )}

          {searchParams?.get('registered') && mode === 'login' && (
            <div className={`mb-6 p-4 border rounded-2xl text-xs flex items-center gap-3 ${isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'}`}>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></div>
              Cadastro realizado! Faça login para entrar.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'verify2FA' && (
              <div className="space-y-3">
                <div className="flex flex-col items-center justify-center py-2">
                  <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-500/5 px-3 py-1 rounded-full border border-blue-500/10">
                    E-mail: {twoFactorEmail}
                  </span>
                </div>
                <label className="text-xs font-bold text-muted-foreground ml-1 uppercase tracking-wider block text-center">
                  Código de Segurança
                </label>
                <div className="relative">
                  <Key className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
                  <input
                    name="code"
                    type="text"
                    maxLength={6}
                    placeholder="000000"
                    className={`w-full border rounded-2xl px-11 py-3.5 text-center text-xl tracking-[12px] font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                    required
                    disabled={loading}
                    autoComplete="one-time-code"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-center leading-normal italic">
                  Este código expira em 5 minutos. Verifique sua caixa de entrada e de spam.
                </p>
              </div>
            )}

            {mode !== 'verify2FA' && (
              <>
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
                        className={`w-full border rounded-2xl px-11 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
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
                      className={`w-full border rounded-2xl px-11 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
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
                        <SelectTrigger className={`w-full border rounded-2xl px-4 py-6 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
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
                          className={`w-full border rounded-2xl px-11 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-mono ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
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
                          className="text-[10px] text-blue-600 hover:text-blue-500 font-bold uppercase tracking-widest"
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
                        className={`w-full border rounded-2xl px-11 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${isDark ? 'bg-black/40 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
                        required
                        minLength={3}
                        disabled={loading}
                      />
                    </div>
                  </div>
                )}

                {mode === 'register' && (
                  <div className="flex items-start gap-2 pt-2 pb-2">
                    <input 
                      type="checkbox" 
                      id="lgpd-consent" 
                      name="lgpd-consent" 
                      required 
                      className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <label htmlFor="lgpd-consent" className="text-xs text-muted-foreground">
                      Li e aceito os{' '}
                      <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Termos de Uso</a>
                      {' '}e a{' '}
                      <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Política de Privacidade</a>.
                    </label>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center disabled:opacity-70 group shadow-xl shadow-blue-600/10"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  {mode === 'register' ? 'Criar minha conta' : mode === 'forgot' ? 'Enviar Link' : mode === 'verify2FA' ? 'Verificar Código' : 'Entrar no Painel'}
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

            {mode === 'verify2FA' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="w-full text-muted-foreground hover:text-foreground text-sm flex items-center justify-center gap-2 pt-2 transition-colors"
              >
                <ChevronLeft size={16} />
                Cancelar e Voltar ao Login
              </button>
            )}
          </form>

          {mode !== 'verify2FA' && (
            <div className="mt-8 text-center">
              <p className="text-muted-foreground text-sm">
                {mode === 'register' ? 'Já possui uma conta ativa?' : 'Ainda não possui uma conta?'}{' '}
                <button
                  type="button"
                  onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
                  className="text-blue-600 hover:text-blue-500 font-bold transition-colors"
                >
                  {mode === 'register' ? 'Fazer login' : 'Registrar agora'}
                </button>
              </p>
            </div>
          )}
        </div>
        
        <p className="text-center text-[10px] text-muted-foreground mt-8 uppercase tracking-widest opacity-50">
          © 2026 Rastreia AI • Sistema de Gestão de Leads Premium
        </p>
      </div>
    </div>
  );
}