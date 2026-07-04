"use server";

import { prisma } from "@/lib/prisma";

export async function submitSupportTicket(input: {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
}): Promise<{ error?: string; id?: string }> {
  if (!input.name || !input.email || !input.subject || !input.message) {
    return { error: "All fields are required." };
  }

  if (!input.email.includes("@") || !input.email.includes(".")) {
    return { error: "Please enter a valid email address." };
  }

  const validCategories = ["general", "bug", "feature", "billing"];
  const category = validCategories.includes(input.category) ? input.category : "general";

  const ticket = await prisma.supportTicket.create({
    data: {
      name: input.name,
      email: input.email,
      subject: input.subject,
      category,
      message: input.message,
    },
  });

  return { id: ticket.id };
}

export async function getSupportTickets() {
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return tickets;
}

export async function updateTicketStatus(ticketId: string, status: string) {
  const validStatuses = ["open", "in_progress", "resolved"];
  if (!validStatuses.includes(status)) {
    return { error: "Invalid status." };
  }

  await prisma.supportTicket.update({
    where: { id: ticketId },
    data: { status },
  });

  return { success: true };
}
