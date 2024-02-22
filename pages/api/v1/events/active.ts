import { apiEvent } from "lib/apiV1Schema";
import type { NextApiRequest, NextApiResponse } from "next";
import { ppTrackerClient } from "../../../../server/ppTrackerdataServerIoClient";
import { checkLocalRegister } from "lib/tokenAuth";

type Data = apiEvent[] | { error: string };

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  if (req.method == "GET") {
    // ejemplo();

    const auth = await checkLocalRegister(req.query.auth as string, "active");
    if (auth) {
      console.log(auth);
    }

    if (auth.Message !== "Success") {
      res.status(401).json({ error: auth.Message });
      console.log("Not authorized");
      return;
    }

    if (!ppTrackerClient.isStarted) {
      console.log(">>>>>  STARTING SOCKET CLIENT....????????????");
      ppTrackerClient.join("waypointEvents");
      await ppTrackerClient.start();
    }
    console.log(
      "GET Active Events request receviced....",
      req.query,
      req.query.auth
    );
    console.log(ppTrackerClient.getAPIActiveEvents());
  } else {
    console.log("UNKWON Active Events request receviced....", req.method);
  }
  const activeEvents: apiEvent[] = ppTrackerClient.getAPIActiveEvents();
  console.log(activeEvents);
  res.status(200).json(activeEvents);
};

export default handler;
