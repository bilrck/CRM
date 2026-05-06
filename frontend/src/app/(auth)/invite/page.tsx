"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function InvitePage() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token");

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/team/validate?token=${token}`)
      .then(async (res) => {
        if (!res.ok) throw new Error((await res.json()).error);
        const data = await res.json();
        return data;
      })
      .then(setInvite)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return <p>Validando convite...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Convite recebido</h1>
      <p>Email: <strong>{invite?.invite.email}</strong></p>
      <p>Função: <strong>{invite?.invite.role}</strong></p>

      <div className="mt-6 space-x-4">
        <button
          onClick={() => router.push(`/invite/accept?token=${token}`)}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Aceitar
        </button>

        <button
          onClick={async () => {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/team/reject`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            });

            alert("Convite recusado.");
            router.push("/");
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Recusar
        </button>
      </div>
    </div>
  );
}
