import AuthForm from "../AuthForm";
import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Carregando...</div>}>
      <AuthForm mode="register" />
    </Suspense>
  );
}
