import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";

export default NextAuth({
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  secret: "bf1ff71da99074ee8a466a35394fc4f9",

  // CREA LA AUTENTIFICACION
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials, req) {
        // CONECCION A BBDD
        const prisma = new PrismaClient();

        // BUSCAR EL EMAIL DEL USUARIO Y HACER LA COMPROBACION DE LA CONTRASEÑA
        const fetchUser = await prisma.user.findFirst({
          where: {
            email: credentials?.email,
          },
          select: {
            // Selecciona los campos que necesitas de la tabla user
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            password: true,
            active: true,
            // Añade los campos de la tabla user_global_role
            user_global_role: {
              select: {
                user_id: true,
                role_id: true,
                // Añade los campos de la tabla role
                role: {
                  select: {
                    id: true,
                    name: true,
                    tag_type: true,
                  },
                },
              },
            },
          },
        });

        const serializedFetchedUser = {
          id: Number(fetchUser?.id).toString(),
          email: fetchUser?.email,
          firstName: fetchUser?.firstName,
          lastName: fetchUser?.lastName,
          password: fetchUser?.password,
          active: fetchUser?.active,
          roleid: Number(fetchUser?.user_global_role[0].role_id),
          role: fetchUser?.user_global_role[0].role.name,
        };

        let promoterid = null;
        let promotername = '';
        let apitoken = '';

        // si no es rol 1 o 2 no permitir login
        if(serializedFetchedUser.roleid !== 1 && serializedFetchedUser.roleid !== 2){
          prisma.$disconnect();
          throw new Error("User with role not valid!");
        }

        if (serializedFetchedUser.roleid === 1 || serializedFetchedUser.roleid === 2) {
          const fetchPromoter = await prisma.promoter_user.findFirst({
            where: {
              user_id: Number(serializedFetchedUser.id),
            },
            select: {
              promoter: {
                select: {
                  id: true,
                  name: true,
                  promoter_user:{
                    select: {
                      api_token: true,
                    }
                  }
                },
              },
            },
          });

          promoterid = Number(fetchPromoter?.promoter.id);
          promotername = fetchPromoter?.promoter.name!;
          apitoken = fetchPromoter?.promoter.promoter_user[0].api_token!;
        }

        const serializedUser = {
          id: Number(fetchUser?.id).toString(),
          email: fetchUser?.email,
          firstName: fetchUser?.firstName,
          lastName: fetchUser?.lastName,
          password: fetchUser?.password,
          active: fetchUser?.active,
          roleid: Number(fetchUser?.user_global_role[0].role_id),
          role: fetchUser?.user_global_role[0].role.name,
          promoterid: promoterid,
          promotername: promotername,
          apitoken: apitoken,
        };

        const user = serializedUser;

        if (!user) {
          prisma.$disconnect();
          throw new Error("No user found!");
        }

        // COMPARAR LA CONTRASEÑA Y LA CONTRASEÑA ENCRIPTADA CON EL METODO COMPARE DE bcryptjs
        // const isValid = await verifyPassword(
        //   credentials.password,
        //   user.password
        // );

        // if (!isValid) {
        //   client.close();
        //   throw new Error("Could not log you in!");
        // }

        const isValid = credentials?.password === user.password;
        if (!isValid) {
          prisma.$disconnect();
          throw new Error("Could not log you in!");
        }

        prisma.$disconnect();

        // DEVOLVER LA INFORMACION DEL USUARIO
        console.log("Este es el usuario serializado: ", serializedUser);

       return user;
      },
    }),
  ],
  callbacks:{
    async jwt({ token, user }: any) {
      // console.log('Este es el user: ', user);
      // Añade nuevo campo al token de la session si se ha obtenido el user
      if (user) {
        token.userProfile = {
          id: Number(user.id),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          roleid: user.roleid,
          role: user.role,
          active: user.active,
          promoterid: user.promoterid,
          promoter: user.promotername,
          apitoken: user.apitoken,
        }        
      }
      // console.log('ESTE ES EL TOKEN: ', token);
      // console.log('ESTE ES EL TOKEN.TEST: ', token.profile);
      return token;
    },
    async session({ session, token }: any) {
      // Manda los datos del token a la session
      if(token){
        session.userProfile = token.userProfile;
      }
      return session;
    },
  },
});
