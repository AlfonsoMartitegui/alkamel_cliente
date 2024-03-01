// pages/api/listados.tsx
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).end(); // Método no permitido
  }

  const { promoterid } = req.body;

  let eventSlug = "";

  try {
    const events = await prisma.event.findMany({
      where: { promoter_id: promoterid },
      select: {
        id: true,
        name: true,
        slug: true,
        start_date: true,
        end_date: true,
        active: true,
        public: true,
        promoter_id: true,
        offsetGMT: true,
      },
      orderBy: { start_date: "desc" },
    });

    const serializedEvents = events.map((event) => ({
      ...event,
      id: Number(event.id),
      start_date: Number(event.start_date),
      end_date: Number(event.end_date),
      year: new Date(Number(event.start_date)).getFullYear(),
      promoter_id: Number(event.promoter_id),
      offsetGMT: Number(event.offsetGMT),
    }));

    // console.log("serializedEvents", serializedEvents);

    // Obtener el evento con start_date más reciente
    const latestEvent = serializedEvents.reduce((prev, current) =>
      prev.start_date > current.start_date ? prev : current
    );

    // Obtener los eventos activos
    const filteredEvents = serializedEvents.filter((event) => event.active);

    const event =
      filteredEvents && filteredEvents.length > 0
        ? filteredEvents.reduce((prev, current) =>
            prev.start_date > current.start_date ? prev : current
          )
        : latestEvent;

    // // Verificar si hay eventos activos
    // if (filteredEvents.length > 0) {
    //   eventSlug = filteredEvents[0].slug;
    // } else {
    //   eventSlug = serializedEvents[0].slug;
    // }

    eventSlug = event.slug;

    console.log("eventSlug", eventSlug);

    // Devuelve un código de estado 200 (OK) y los datos en formato JSON
    return res.status(200).json(eventSlug);
  } catch (error) {
    let errorMessage = "Internal Server Error";
    // Maneja errores de Prisma y otros errores de manera diferente
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma request error:", error.message);
      errorMessage = error.message;
    } else {
      console.error("Error saving data:", error);
    }
    return res
      .status(500)
      .json({ error: "Internal Server Error", details: errorMessage });
  } finally {
    await prisma.$disconnect();
  }
}
