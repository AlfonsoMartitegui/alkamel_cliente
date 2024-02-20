import NextAuth from "next-auth/next";
import CredentialsProvider from "next-auth/providers/credentials";

export default NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        return url;
      } else if (url.startsWith("/")) {
        return new URL(url, baseUrl).toString();
      }
      return baseUrl;
    },
    session: async ({ session, token }) => {
      if (session?.user) {
        session.user.id = token.uid;
        session.user.role = token.role;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id.substring(0, user.id.indexOf("-"));
        token.role = user.id.substring(user.id.indexOf("-") + 1);
      }
      return token;
    },
  },
  secret: "bf1ff71da99074ee8a466a35394fc4f9",
  providers: [
    CredentialsProvider({
      name: "Credentials",
      // The credentials is used to generate a suitable form on the sign in page.
      // You can specify whatever fields you are expecting to be submitted.
      // e.g. domain, username, password, 2FA token, etc.
      // You can pass any HTML attribute to the <input> tag through the object.
      credentials: {
        username: { label: "Username", type: "text", placeholder: "jsmith" },
        password: { label: "Password", type: "password" },
      },
      //async authorize(credentials, req) {
      async authorize(credentials) {
        console.log("AUTHORIZING????");
        if (
          credentials?.password === "Lot23.r" &&
          credentials.username === "rViewer@alkamelsystems.com"
        ) {
          return {
            id: "1-rc_viewer",
            name: "RC. Viewer",
            email: credentials.username,
            role: "rc_viewer",
          };
        } else if (
          credentials?.password === "Lot23.r" &&
          credentials.username === "rOperator@alkamelsystems.com"
        ) {
          return {
            id: "2-rc_operator",
            name: "RC Operator",
            email: credentials.username,
            role: "rc_operator",
          };
        } else throw new Error("Invalid password");
      },
    }),
  ],
});
