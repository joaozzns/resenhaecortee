import { requireAuth } from "@/lib/auth/helpers";
import { ProfileForm } from "./ProfileForm";

export const metadata = { title: "Perfil" };

export default async function PerfilPage() {
  const me = await requireAuth("/minha-conta/perfil");
  if (!me.profile) {
    throw new Error("Profile não encontrado para o usuário logado.");
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Perfil
        </span>
        <h1 className="text-3xl md:text-4xl">Seus dados</h1>
        <p className="text-foreground/70 max-w-2xl">
          Mantém seus dados em dia para receber lembretes, cupons de aniversário
          e atualizações da casa.
        </p>
      </header>

      <ProfileForm profile={me.profile} email={me.email ?? ""} />
    </div>
  );
}
