import type { NextPage } from "next";
import Head from "next/head";
import { Container } from "react-bootstrap";
import React, { useEffect } from "react";
import { getSession } from "next-auth/react";
import { GetServerSideProps } from "next";
import { event, PrismaClient, promoter } from "@prisma/client";
import superjson from "superjson";
import PromoterBar from "components/promoter/promoterBar";
import PromoterEventList from "components/promoter/eventsList";

interface PromoterProps {
  loggedIn: boolean;
  isAdmin: boolean;
  events: string;
  promoter: string;
}

const EventAdmin: NextPage<PromoterProps> = (props) => {
  const [promoter, setPromoter] = React.useState<promoter | undefined>(
    undefined
  );
  const [eventsList, setEventsList] = React.useState<event[] | undefined>(
    undefined
  );

  //#region initialize local state variables with the props information
  useEffect(() => {
    try {
      const p: promoter = superjson.parse(props.promoter);
      setPromoter(p);
      const evList: event[] = superjson.parse(props.events);
      setEventsList(evList);
    } catch (error) {
      console.log("Error starting promoter page....", error);
    }
  }, [props.promoter, props.events]);
  //#endregion

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
        <Container fluid>
          <PromoterBar promoter={promoter} />

          <PromoterEventList
            promoter={promoter}
            showActive={true}
            events={eventsList}
            showNoActive={false}
            title={"ACTIVE EVENTS"}
          />
          <PromoterEventList
            promoter={promoter}
            showActive={false}
            events={eventsList}
            showNoActive={true}
            title={"CLOSED EVENTS"}
          />
        </Container>
      </main>

      <footer></footer>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  let myProps: PromoterProps = {
    loggedIn: false,
    isAdmin: false,
    events: "",
    promoter: "",
  };

  const { req } = context;

  //#region Check if user is logged in
  const session = await getSession({ req });
  if (session === null) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
      props: {
        redirectFrom: "/events/" + context.query.slug,
      },
    };
  }
  myProps.loggedIn = session ? true : false;
  myProps.isAdmin = session ? true : false;
  //#endregion

  //#region read promoter info if exist
  const slug: string[] = Array.isArray(context.query.slug)
    ? context.query.slug
    : [];
  const promoterSlugId = slug[0];

  let filter: any = { slug: promoterSlugId };
  if (Number(promoterSlugId) > 0) {
    filter = { id: Number(promoterSlugId) };
  }

  const prismaClient = new PrismaClient();

  const promoters = await prismaClient.promoter.findMany({
    where: filter,
  });

  if (promoters.length > 0) {
    myProps.promoter = superjson.stringify(promoters[0]);
  }
  //#endregion

  //#region read promoter events, if promoter exist...
  if (promoters.length > 0) {
    const eventsList = await prismaClient.event.findMany({
      where: {
        promoter_id: promoters[0].id,
      },
    });
    myProps.events = superjson.stringify(eventsList);
  }
  //#endregion

  prismaClient.$disconnect();

  return { props: myProps };
};

export default EventAdmin;
