import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth/AuthForm";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Criar conta",
  description:
    "Crie sua conta na Resenha e Corte e agende em segundos. Histórico, favoritos e benefícios em um só lugar.",
};

export default function CadastrarPage() {
  return (
    <Suspense>
      <AuthForm variant="signup" />
    </Suspense>
  );
}
