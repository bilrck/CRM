"use client";
import { useSearchParams, useRouter } from "next/navigation";
export default function AcceptInvitePage() {
const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  async function handleSubmit(e) {
    e.preventDefault();
    const name = e.target.name.value;
    const password = e.target.password.value;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team/accept`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, password }),
    });

    const data = await res.json();

    if (!res.ok) return alert(data.error);

    router.push("/dashboard");
  }
  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleSubmit} className="p-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold mb-6">Criar conta</h1>

        <input
          name="name"
          placeholder="Seu nome"
          className="border p-2 w-full mb-4"
          required
        />
        <input
          name="password"
          type="password"
          placeholder="Crie uma senha"
          className="border p-2 w-full mb-4"
          required
        />

        <button className="bg-green-600 text-white px-4 py-2 rounded">
          Entrar
        </button>
      </form>
    </div>
  );
}
