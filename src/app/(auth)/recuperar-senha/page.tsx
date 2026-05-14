import type { Metadata } from "next";
import { Suspense } from "react";
import { RecoverForm } from "./RecoverForm";

// Páginas de auth não devem ser pré-renderizadas estaticamente porque
// instanciam o supabase client no body do componente. Marcando como
// dinâmica, o Next pula prerender e não falha mesmo se as ENV vars
// estiverem ausentes no build.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description:
    "Receba um link no seu e-mail para definir uma nova senha de acesso.",
};

export default function RecuperarSenhaPage() {
  return (
    <Suspense>
      <RecoverForm />
    </Suspense>
  );
}
