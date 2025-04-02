"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex justify-between items-center px-6 py-4 bg-secondary dark:bg-gray-800">
      <div>
        <Link href="/" className="text-xl font-bold text-accent">
          MyDictionary
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        {session ? (
          <>
            <span className="text-sm">{session.user?.name}</span>
            <Link href="/dashboard" className="text-sm underline">Dashboard</Link>
            <button className="text-sm" onClick={() => signOut()}>Logout</button>
          </>
        ) : (
          <button className="text-sm" onClick={() => signIn("google")}>Login</button>
        )}
      </div>
    </nav>
  );
}
