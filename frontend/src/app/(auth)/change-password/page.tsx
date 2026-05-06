'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ShieldAlert, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

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
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/change-password`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    newPassword,
                    companyName // Optional, used for hierarchy onboarding
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Erro ao alterar senha");
            }

            toast.success("Dados atualizados com sucesso! Bem-vindo.");
            window.location.href = '/dashboard'; // Redirect and refresh
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-white to-amber-100 px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-amber-200">
                <div className="flex justify-center mb-6">
                    <div className="bg-amber-100 p-3 rounded-full">
                        <ShieldAlert className="h-8 w-8 text-amber-600" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center text-gray-900 mb-2">
                    Configuração de Conta
                </h2>
                <p className="text-center text-gray-600 text-sm mb-8">
                    Defina sua nova senha e personalize seu workspace.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            Nome da Empresa / Workspace
                        </label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                            placeholder="Ex: Minha Empresa"
                            disabled={loading}
                        />
                        <p className="text-[10px] text-gray-500 italic">Este será o nome visível do seu workspace.</p>
                    </div>

                    <div className="pt-2 border-t border-gray-100"></div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <KeyRound size={16} /> Nova Senha
                        </label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none transition"
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
                            className="w-full border border-gray-300 rounded-xl px-4 py-2 focus:ring-2 focus:ring-amber-500 outline-none transition"
                            placeholder="Digite novamente"
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-emerald-600 text-white py-3 rounded-xl hover:bg-emerald-700 transition flex items-center justify-center font-bold shadow-md disabled:opacity-70 group"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            'Salvar e Acessar'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

