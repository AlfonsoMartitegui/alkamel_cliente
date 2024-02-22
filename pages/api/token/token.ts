import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

// // Supongamos que tienes una función `checkTokenStatus` que toma un token y devuelve su estado
// import { checkTokenStatus } from '../../lib/checkTokenStatus'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { token } = req.query

  if (!token) {
    return res.status(400).json({ error: 'Token is required' })
  }

  try {
    // const status = await checkTokenStatus(token as string)

    return res.status(200).json({Message: "Success" });
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