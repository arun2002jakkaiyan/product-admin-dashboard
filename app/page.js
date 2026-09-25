"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ProductsPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">
        Product Admin Dashboard
      </h1>

      <p className="mt-2 text-gray-600">
        You are logged in.
      </p>
    </main>
  );
}