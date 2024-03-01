import {
  apiEventInfo,
  apiErrorMessage,
  apiRally,
  apiParticipant,
  apiStage,
  apiParticipantWaypointTimes,
} from "lib/apiV1Schema";
import type { NextApiRequest, NextApiResponse } from "next";
import { ppTrackerClient } from "../../../../server/ppTrackerdataServerIoClient";
import { checkLocalRegister } from "lib/tokenAuth";

type Data =
  | apiStage[]
  | apiEventInfo
  | apiParticipant[]
  | apiRally
  | apiErrorMessage
  | apiParticipantWaypointTimes[]
  | { error: string };

const handler = async (req: NextApiRequest, res: NextApiResponse<Data>) => {
  console.log("GET Events Info for Event Slug:", req.query, req.query.auth);
  if (!ppTrackerClient.isStarted) {
    console.log(">>>>>  STARTING SOCKET CLIENT....????????????");
    ppTrackerClient.join("waypointEvents");
    await ppTrackerClient.start();
  }

  if (req.method == "GET") {
    const slug = req.query.slug;
    const auth = await checkLocalRegister(req.query.auth as string, slug as string);
    if (auth) {
      console.log(auth);
    }

    if (auth.Message !== "Success") {
      res.status(401).json({ error: auth.Message });
      console.log("Not authorized");
      return;
    }
    
    console.log("NEW 'event slug' request for >>>>>>>", slug);
    if (Array.isArray(slug)) {
      if (slug.length === 1) {
        res.status(200).json(ppTrackerClient.getAPIEventInfoFor(slug[0]));
      } else if (slug.length === 2) {
        res
          .status(200)
          .json(ppTrackerClient.getAPIRallyInfoForEvent(slug[0], slug[1]));
      } else if (slug.length === 3) {
        if (slug[2] === "participants") {
          res
            .status(200)
            .json(ppTrackerClient.getAPIRallyParticipants(slug[0], slug[1]));
        } else if (slug[2] === "stages") {
          res
            .status(200)
            .json(ppTrackerClient.getAPIRallyStages(slug[0], slug[1]));
        }
      } else if (slug.length === 4) {
        if (slug[3] === "times") {
          res
            .status(200)
            .json(
              ppTrackerClient.getAPIRallyStageTimes(slug[0], slug[1], slug[2])
            );
        }
      } else if (slug.length === 6) {
        console.log("TESTING NEW SLUG REQUEST: ", slug);
        res.status(200).json({ error: "Not implemented" });
      }
    }
  }
};

export default handler;
