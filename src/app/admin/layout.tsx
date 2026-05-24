import type { ReactNode } from "react";
import { Header } from "@/components/marketing/Header";
import { Footer } from "@/components/marketing/Footer";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireRole } from "@/lib/auth/helpers";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Apenas admin OU barber. RLS na maioria das tabelas reforça (is_staff).
  await requireRole(["admin", "barber"], "/admin");
  const loyaltyEnabled = process.env.NEXT_PUBLIC_LOYALTY_ENABLED === "true";

  return (
    <>
      <Header />
      <main className="flex-1 pt-32 md:pt-40 pb-24 font-ios">
        <div className="container-x">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <aside className="lg:col-span-3">
              <AdminSidebar loyaltyEnabled={loyaltyEnabled} />
            </aside>
            <div className="lg:col-span-9 min-w-0">{children}</div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
