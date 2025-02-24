"use client";

// react
import { useEffect } from "react";

// hooks
import { useApi } from "@/lib/hooks/useApi";

// types
import { User } from "@/types/user";

export default function UserList() {
  const { data: users, loading, error, fetchData } = useApi<User[]>();

  useEffect(() => {
    fetchData("/users");
  }, []);

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <ul>
      {users?.map((user) => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  );
}
