'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    
    const [loading, setLoading] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (!token) {
            toast.error("Token de recuperação não encontrado.");
            router.push('/login');
        }
    }, [token, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (newPassword.length < 3) {
            toast.error("A senha deve ter pelo menos 3 caracteres");
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error("As senhas não coincidem");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    token,
                    newPassword
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Erro ao redefinir senha");
            }

            setSuccess(true);
            toast.success("Senha redefinida com sucesso!");
            setTimeout(() => {
                router.push('/login');
            }, 3000);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-emerald-100 text-center space-y-6 animate-in fade-in zoom-in duration-300">
                <div className="flex justify-center">
                    <div className="bg-emerald-100 p-3 rounded-full">
                        <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                    </div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Senha Alterada!</h2>
                <p className="text-gray-600">
                    Sua senha foi redefinida com sucesso. Você será redirecionado para a tela de login em alguns segundos.
                </p>
                <button 
                    onClick={() => router.push('/login')}
                    className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition font-bold shadow-md"
                >
                    Fazer Login Agora
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-zinc-100">
            <div className="flex justify-center mb-6">
                <div className="bg-primary/10 p-3 rounded-full text-primary">
                    <KeyRound size={32} />
                </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                Redefinir Senha
            </h2>
            <p className="text-center text-gray-600 text-sm mb-8">
                Crie uma nova senha segura para sua conta.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <KeyRound size={16} /> Nova Senha
                    </label>
                    <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition"
                        placeholder="Mínimo 3 caracteres"
                        required
                        disabled={loading}
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                        <KeyRound size={16} /> Confirmar Nova Senha
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary outline-none transition"
                        placeholder="Digite novamente"
                        required
                        disabled={loading}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading || !token}
                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl hover:bg-primary/90 transition flex items-center justify-center font-bold shadow-md disabled:opacity-50"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        'Redefinir Senha'
                    )}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 via-white to-zinc-100 px-4">
            <Suspense fallback={
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="animate-spin" /> Carregando...
                </div>
            }>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
