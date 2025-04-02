"use client";

import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/navigation";

export default function Providers({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const messages = {
    en: { welcome: "Welcome!" },
    fr: { welcome: "Bienvenue!" },
  };

  return <SessionProvider>{children}</SessionProvider>;
}

//used to wrap my app with important global providers