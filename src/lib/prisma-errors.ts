import { Prisma } from "@prisma/client";

export function mapPrismaError(err: unknown): { message: string; status: number } {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return { message: `A record with that ${target} already exists.`, status: 409 };
    }
    if (err.code === "P2025") {
      return { message: "Record not found.", status: 404 };
    }
  }
  console.error("[prisma] unmapped error", err);
  return { message: "Internal error.", status: 500 };
}
