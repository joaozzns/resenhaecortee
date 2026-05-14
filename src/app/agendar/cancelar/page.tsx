import Link from "next/link";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cancelar agendamento" };

export default async function CancelByTokenPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const sp = await searchParams;
  const token = (sp.token ?? "").trim();

  let result: {
    ok: boolean;
    message: string;
    appointment?: {
      starts_at: string;
      client_name: string;
    };
  } = {
    ok: false,
    message: "Link inválido. Verifique o e-mail recebido.",
  };

  if (token) {
    const admin = createAdminClient();
    const { data: appt } = await admin
      .from("appointments")
      .select("id, starts_at, status, client_name")
      .eq("cancel_token", token)
      .maybeSingle();

    if (!appt) {
      result = { ok: false, message: "Agendamento não encontrado." };
    } else if (appt.status === "cancelled") {
      result = {
        ok: true,
        message: "Esse agendamento já estava cancelado.",
        appointment: appt,
      };
    } else if (new Date(appt.starts_at) < new Date()) {
      result = {
        ok: false,
        message: "Esse horário já passou — não é possível cancelar.",
        appointment: appt,
      };
    } else {
      const { error } = await admin
        .from("appointments")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", appt.id);
      result = error
        ? { ok: false, message: error.message }
        : {
            ok: true,
            message: "Cancelamento confirmado.",
            appointment: appt,
          };
    }
  }

  return (
    <>
      <Header />
      <main className="flex-1 pt-32 md:pt-40 pb-24">
        <div className="container-x">
          <div className="max-w-xl mx-auto text-center space-y-6">
            <div className="grid place-items-center">
              <span
                className={
                  "grid place-items-center h-16 w-16 rounded-full " +
                  (result.ok
                    ? "bg-success/15 text-success"
                    : "bg-danger/15 text-danger")
                }
              >
                {result.ok ? (
                  <CheckCircle2 className="h-8 w-8" aria-hidden />
                ) : (
                  <XCircle className="h-8 w-8" aria-hidden />
                )}
              </span>
            </div>

            <div className="space-y-3">
              <span className="eyebrow flex items-center justify-center gap-3">
                <span className="gold-rule" /> Cancelamento{" "}
                <span className="gold-rule" />
              </span>
              <h1 className="text-3xl md:text-4xl">
                {result.ok ? "Tudo certo." : "Não consegui cancelar."}
              </h1>
              <p className="text-foreground/75">{result.message}</p>
            </div>

            {result.appointment && (
              <Card>
                <CardBody className="py-6 text-left text-sm">
                  <p>
                    <span className="text-muted">Cliente:</span>{" "}
                    {result.appointment.client_name}
                  </p>
                  <p>
                    <span className="text-muted">Quando:</span>{" "}
                    {format(
                      new Date(result.appointment.starts_at),
                      "dd 'de' MMM 'às' HH:mm",
                      { locale: ptBR }
                    )}
                  </p>
                </CardBody>
              </Card>
            )}

            <div className="flex justify-center gap-3">
              <Button asChild variant="outline" size="md">
                <Link href="/">
                  <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar ao site
                </Link>
              </Button>
              <Button asChild size="md">
                <Link href="/agendar">Agendar novamente</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
