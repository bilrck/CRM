// src/hooks/useAuth.ts
import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "USER";
  workspace?: {
    id: number;
    name: string;
  };
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      credentials: "include",
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null));
  }, []);

  return { user };
}
