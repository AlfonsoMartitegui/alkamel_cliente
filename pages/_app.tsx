import "../styles/globals.css";
import "bootstrap/dist/css/bootstrap.css";
import type { AppProps } from "next/app";
import { useEffect } from "react";
import Layout from "../components/layout/layout";
import Head from "next/head";
import { SessionProvider } from "next-auth/react";

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    //import("bootstrap/dist/js/bootstrap");
  }, []);

  return (
    <SessionProvider session={pageProps.session}>
      <Layout timeZone={"Europe/Madrid"}>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Component {...pageProps} id="lolComponent" />
      </Layout>
    </SessionProvider>
  );
}
export default MyApp;
