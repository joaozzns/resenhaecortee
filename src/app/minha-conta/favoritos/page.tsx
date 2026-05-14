import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import { FavoritesUI } from "./FavoritesUI";

export const metadata = { title: "Favoritos" };

export default async function FavoritosPage() {
  const me = await requireAuth("/minha-conta/favoritos");
  const supabase = await createClient();

  const [{ data: barbers }, { data: services }, { data: favServices }] =
    await Promise.all([
      supabase
        .from("barbers")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("services")
        .select("*")
        .eq("active", true)
        .order("sort_order"),
      supabase
        .from("favorite_services")
        .select("service_id")
        .eq("profile_id", me.id),
    ]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Favoritos
        </span>
        <h1 className="text-3xl md:text-4xl">O que você prefere</h1>
        <p className="text-foreground/70 max-w-2xl">
          Personalize o atendimento. Suas escolhas aparecem pré-selecionadas
          no fluxo de agendamento.
        </p>
      </header>

      <FavoritesUI
        barbers={barbers ?? []}
        services={services ?? []}
        favoriteBarberId={me.profile?.favorite_barber_id ?? null}
        favoriteServiceIds={(favServices ?? []).map((f) => f.service_id)}
      />
    </div>
  );
}
