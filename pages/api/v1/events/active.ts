import { apiEvent } from "lib/apiV1Schema";
import type { NextApiRequest, NextApiResponse } from "next";
import { ppTrackerClient } from "../../../../server/ppTrackerdataServerIoClient";

type Data = apiEvent[];

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  if (req.method == "GET") {
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
