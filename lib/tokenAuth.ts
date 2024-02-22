import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";

// Función para crear una instancia del cliente Redis
export function createRedis() {
  return new Promise((resolve, reject) => {
    const client = new Redis({
      host: "localhost", // reemplaza con tu host
      port: 6379, // reemplaza con tu puerto
    });

    console.log("Parte 0: Cliente Redis creado");

    client.on("error", function (error: Error) {
      console.error("Error al conectar a Redis: ", error);
      reject(error);
    });

    client.on("connect", function () {
      console.log("Evento connect emitido");
    });

    client.on("ready", function () {
      console.log("Conectado a Redis y listo para emitir comandos");
      resolve(client);
    });
  });
}

// Función para verificar el registro local
export async function checkLocalRegister(token: string, apiKey: string) {
  let calls = 1;
  let time: string = "";
  const timecountdown = 10000;
  const currentTime = new Date().toISOString();

  // Crear una clave única a partir del token y los parámetros
  const uniqueKey = `${token}:${apiKey}`;
  console.log("Unique Key: ", uniqueKey);

  console.log("Parte 1");

  try {
    const client = new Redis({
      host: "localhost", // reemplaza con tu host
      port: 6379, // reemplaza con tu puerto
    });

    // Verificar que el registro exista
    console.log("Parte 2");
    let exists = await client.exists(uniqueKey);
    console.log("Existe el registro: ", exists);

    if (exists) {
      // Obtener el tiempo anterior
      console.log("Parte 3");
      time = (await client.hget(uniqueKey, "time")) as string;
      calls = parseInt((await client.hget(uniqueKey, "calls")) ?? "1") || 1;

      // Comparar si ha pasado más de 10 segundos entre el tiempo del registro y el tiempo actual
      console.log("Parte 4");
      const timeDifference =
        new Date(currentTime).getTime() - new Date(time).getTime();

      if (timeDifference < timecountdown) {
        console.log("Parte 5");
        calls = await client.hincrby(uniqueKey, "calls", 1);
        return { Message: `You must wait ${timecountdown/1000} seconds` };
      }

      // Si no ha pasado más de 10 segundos, incrementar el número de llamadas y retornar error
      console.log("Parte 6");
      await client.hmset(uniqueKey, {
        token: token,
        API: apiKey,
        time: currentTime,
        calls: calls.toString(),
      });
      return { Message: "Success" };
    }

    const prisma = new PrismaClient();

    console.log("Parte 7");
    const tokenExist = await prisma.promoter_user.findFirst({
      where: {
        api_token: token,
      },
    });

    if (!tokenExist) {
      console.log("Parte 8");
      return { Message: "Invalid token" };
    }

    console.log("Parte 9");
    await client.hmset(uniqueKey, {
      token: token,
      API: apiKey,
      time: currentTime,
      calls: calls,
    });

    prisma.$disconnect();

    return { Message: "Success" };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
