import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const metadata: Metadata = {
  title: "Entrar",
  description:
    "Entre na sua conta para acompanhar agendamentos e seu histórico na Resenha e Corte.",
};

export default function EntrarPage() {
  return (
    <Suspense>
      <AuthForm variant="login" />
    </Suspense>
  );
}
