import type { NextPage } from "next";
import Head from "next/head";

interface EventProps {
  events: string;
}

const Home: NextPage<EventProps> = (props) => {
  console.log("Events AS STRING....", props.events);

  return (
    <div>
      <Head>
        <title>PP Tracker</title>
        <meta
          name="description"
          content="PP Tracker: Tracking for rally competitors. Power up by Al Kamel Systems S.L."
        />
        <link rel="icon" href="/favicon.png" />
      </Head>

      <main>
        <h1></h1>
      </main>

      <footer></footer>
    </div>
  );
};

export const getServerSideProps = async ({}) => {
  return { props: { events: "" } };
};

export default Home;
