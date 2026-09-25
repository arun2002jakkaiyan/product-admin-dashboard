"use client";

import { useRouter } from "next/navigation";
import { logout } from "../lib/auth";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = () => {
    logout();

    router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
    >
      Logout
    </button>
  );
}