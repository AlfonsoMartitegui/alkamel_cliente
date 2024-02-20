import { waypoint_types } from "@prisma/client";

export const initWaypointIconMarkers = (
  version: string,
  waypoint_types: waypoint_types[]
) => {
  let waypointMarkerIconByTypeId = new Map<number, string>();
  for (var wpt of waypoint_types) {
    waypointMarkerIconByTypeId.set(
      Number(wpt.id),
      "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/markers/" +
        version +
        "/waypoints/" +
        wpt.name +
        ".png"
    );
  }
  return waypointMarkerIconByTypeId;
};
