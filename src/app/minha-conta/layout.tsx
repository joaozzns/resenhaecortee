import type { ReactNode } from "react";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { AccountSidebar } from "@/components/account/AccountSidebar";
import { requireAuth } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";

export default async function MinhaContaLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Defesa em profundidade: o proxy já redireciona, mas garantimos aqui também.
  await requireAuth("/minha-conta");
  const loyaltyEnabled = process.env.NEXT_PUBLIC_LOYALTY_ENABLED === "true";

  return (
    <>
      <Header />
      <main className="flex-1 pt-32 md:pt-40 pb-24">
        <div className="container-x">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
            <aside className="lg:col-span-3">
              <AccountSidebar loyaltyEnabled={loyaltyEnabled} />
            </aside>
            <div className="lg:col-span-9 min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
