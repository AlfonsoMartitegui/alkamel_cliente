import NextAuth from "next-auth";
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      id?: number | null | undefined;
      role?: number | null | undefined;
      active?: boolean | null | undefined;
      /** The user's postal address. */
      //   address: string
      name?: string | null | undefined;
      email?: string | null | undefined;
      image?: string | null | undefined;
    };
    userProfile: {
      id?: number | null | undefined;
      email?: string | null | undefined;
      firstName?: string | null | undefined;
      lastName?: string | null | undefined;
      roleid?: number | null | undefined;
      role: string | null | undefined;
      active?: boolean | null | undefined;
      promoterid?: number | null | undefined;
      promoter?: string | null | undefined;
      apitoken?: string | null | undefined;
      /** The user's postal address. */
      //   address: string
    };
  }
}


declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    idToken?: string
  }
}
