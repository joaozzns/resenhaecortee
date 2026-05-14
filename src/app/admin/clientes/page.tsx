import Link from "next/link";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Search } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export const metadata = { title: "Clientes" };

const FILTERS = [
  { id: "all", label: "Todos" },
  { id: "frequent", label: "Mais frequentes" },
  { id: "birthday", label: "Aniversariantes do mês" },
  { id: "inactive", label: "Inativos 60+ dias" },
] as const;

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim();
  const filter = (sp.filter ?? "all") as (typeof FILTERS)[number]["id"];

  const admin = createAdminClient();

  // Lista base — apenas role=client
  let query = admin
    .from("profiles")
    .select(
      "id, full_name, phone, birthdate, role, created_at, loyalty_points"
    )
    .eq("role", "client")
    .order("created_at", { ascending: false })
    .limit(200);

  if (q) {
    query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  if (filter === "birthday") {
    const month = (new Date().getMonth() + 1)
      .toString()
      .padStart(2, "0");
    // birthdate como "YYYY-MM-DD" — filtramos pela substring de mês
    query = query.like("birthdate", `%-${month}-%`);
  }

  const { data: profiles } = await query;
  let list = profiles ?? [];

  // IDs com assinatura ativa — para o selo "Mensalista"
  const { data: activeSubs } = await admin
    .from("client_subscriptions")
    .select("profile_id")
    .eq("status", "active");
  const mensalistaSet = new Set(
    (activeSubs ?? []).map((s) => s.profile_id)
  );

  // Para "frequentes" e "inativos" precisamos contar appointments — fazemos
  // depois com uma query agregada paralela.
  if (filter === "frequent" || filter === "inactive") {
    const ids = list.map((p) => p.id);
    if (ids.length > 0) {
      const { data: appts } = await admin
        .from("appointments")
        .select("client_id, starts_at")
        .in("client_id", ids)
        .neq("status", "cancelled");
      const byClient = new Map<
        string,
        { count: number; lastAt: Date | null }
      >();
      for (const a of appts ?? []) {
        if (!a.client_id) continue;
        const cur = byClient.get(a.client_id) ?? { count: 0, lastAt: null };
        cur.count++;
        const at = new Date(a.starts_at);
        if (!cur.lastAt || at > cur.lastAt) cur.lastAt = at;
        byClient.set(a.client_id, cur);
      }
      if (filter === "frequent") {
        list = list
          .map((p) => ({ ...p, _count: byClient.get(p.id)?.count ?? 0 }))
          .sort((a, b) => b._count - a._count)
          .slice(0, 50);
      } else {
        const cutoff = subDays(new Date(), 60);
        list = list.filter((p) => {
          const last = byClient.get(p.id)?.lastAt;
          // Inativo: nunca veio OU última visita > 60d
          return !last || last < cutoff;
        });
      }
    }
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <span className="eyebrow flex items-center gap-3">
          <span className="gold-rule" /> Clientes
        </span>
        <h1 className="text-3xl md:text-4xl">Base de clientes</h1>
        <p className="text-foreground/70 max-w-2xl">
          Filtra, busca e abre o histórico de cada cliente.
        </p>
      </header>

      <form className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
            aria-hidden
          />
          <Input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou telefone"
            className="pl-9"
          />
        </div>
        <input type="hidden" name="filter" value={filter} />
        <button
          type="submit"
          className="px-4 py-2 rounded-full text-sm border border-border hover:border-accent hover:text-accent transition-colors"
        >
          Buscar
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = f.id === filter;
          const href =
            "?filter=" + f.id + (q ? "&q=" + encodeURIComponent(q) : "");
          return (
            <Link
              key={f.id}
              href={href}
              className={
                "px-3 py-1.5 rounded-full text-sm border transition-colors " +
                (active
                  ? "bg-accent text-background border-accent"
                  : "border-border hover:border-accent/60 hover:text-accent")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <Card className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-border">
            <tr className="text-left text-muted">
              <th className="p-4 font-normal">Nome</th>
              <th className="p-4 font-normal">Telefone</th>
              <th className="p-4 font-normal">Aniversário</th>
              <th className="p-4 font-normal">Cadastrado em</th>
              <th className="p-4 font-normal text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 && (
              <tr>
                <td className="p-6 text-muted" colSpan={5}>
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.id} className="border-b border-border last:border-0">
                <td className="p-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href={`/admin/clientes/${p.id}`}
                      className="text-foreground hover:text-accent"
                    >
                      {p.full_name ?? "—"}
                    </Link>
                    {mensalistaSet.has(p.id) && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.16em] border border-accent/50 bg-accent-soft text-accent">
                        Mensalista
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-foreground/85">{p.phone ?? "—"}</td>
                <td className="p-4 text-foreground/85">
                  {p.birthdate
                    ? format(new Date(`${p.birthdate}T12:00:00`), "dd/MM")
                    : "—"}
                </td>
                <td className="p-4 text-muted">
                  {format(new Date(p.created_at), "dd 'de' MMM yyyy", {
                    locale: ptBR,
                  })}
                </td>
                <td className="p-4 text-right tabular-nums">
                  {p.loyalty_points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
