import { Suspense } from "react";
import type { Metadata } from "next";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { BookingStepper } from "@/components/booking/BookingStepper";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/helpers";

export const metadata: Metadata = {
  title: "Agendar horário",
  description:
    "Reserve seu horário na Resenha e Corte. Escolha serviços, barbeiro e horário em poucos cliques.",
};

export const dynamic = "force-dynamic";

export default async function AgendarPage() {
  const supabase = await createClient();
  const [
    { data: services },
    { data: barbers },
    user,
  ] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("barbers")
      .select("*")
      .eq("active", true)
      .order("sort_order"),
    getCurrentUser(),
  ]);

  return (
    <>
      <Header />
      <main className="flex-1 pt-24 md:pt-40 pb-12">
        <div className="container-x">
          <header className="max-w-3xl mb-10 md:mb-16">
            <span className="eyebrow flex items-center gap-3">
              <span className="gold-rule" /> Agendamento
            </span>
            <h1 className="mt-4 md:mt-5 text-3xl sm:text-4xl md:text-5xl xl:text-6xl">
              Marque seu horário em quatro passos.
            </h1>
            <p className="mt-4 md:mt-5 text-foreground/70 leading-relaxed text-sm sm:text-base">
              Sem fila, sem ligação. Basta ter uma conta e, em menos de um
              minuto, seu horário está confirmado.
            </p>
          </header>

          <Suspense
            fallback={
              <div className="text-muted">Carregando agendamento…</div>
            }
          >
            <BookingStepper
              services={services ?? []}
              barbers={barbers ?? []}
              user={user}
            />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
