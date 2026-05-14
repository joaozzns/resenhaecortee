import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getAvailableSlots } from "@/lib/booking/availability";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  barberId: z
    .string()
    .min(1, "barberId obrigatório")
    .refine(
      (v) => v === "any" || /^[0-9a-f-]{36}$/i.test(v),
      "barberId inválido"
    ),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "date deve ser YYYY-MM-DD"),
  durationMinutes: z.coerce
    .number()
    .int()
    .min(15)
    .max(8 * 60)
    .refine((n) => n % 15 === 0, "duração deve ser múltiplo de 15"),
});

export async function GET(req: NextRequest) {
  const params = Object.fromEntries(req.nextUrl.searchParams);
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "params_invalidos", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const slots = await getAvailableSlots(parsed.data);
    return NextResponse.json({ slots });
  } catch (e) {
    console.error("[/api/availability]", e);
    return NextResponse.json(
      { error: "internal_error", message: e instanceof Error ? e.message : "?" },
      { status: 500 }
    );
  }
}
