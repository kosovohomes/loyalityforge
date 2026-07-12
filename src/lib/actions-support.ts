"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

const TICKET_CATEGORIES = ["general", "bug", "feature", "billing"] as const;
const MAX_MESSAGE_LEN = 10_000;

const schema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Please enter a valid email address").max(254),
  subject: z.string().trim().min(1, "Subject is required").max(200),
  category: z.enum(TICKET_CATEGORIES).default("general"),
  message: z.string().trim().min(1, "Message is required").max(MAX_MESSAGE_LEN),
});

export async function submitSupportTicket(input: {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}): Promise<{ error?: string; id?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    const hdrs = headers();
    const ip =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      hdrs.get("x-real-ip") ??
      null;

    const ticket = await prisma.supportTicket.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        category: parsed.data.category,
        message: parsed.data.message,
      },
    });

    console.log(`[support] ticket ${ticket.id} filed by ${parsed.data.email} (ip=${ip ?? "unknown"})`);
    return { id: ticket.id };
  } catch (err) {
    console.error("[support] submitSupportTicket failed", err);
    return { error: "Could not submit your ticket. Please try again later." };
  }
}
