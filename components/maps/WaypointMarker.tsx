import { track_waypoints, waypoint_types } from "@prisma/client";
import React from "react";
import WaypointDetailsPopup from "./WaypointDetailsPopup";
import ReactDOMServer from "react-dom/server";

interface WaypointMarkerProps extends google.maps.MarkerOptions {
  waypoint: track_waypoints | undefined;
  wpType: waypoint_types | undefined;
  onWaypointClick?: (participantId: number) => void;
}

const WaypointMarker: React.FC<WaypointMarkerProps> = (options) => {
  //const image =    "https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png";

  const [marker, setMarker] = React.useState<google.maps.Marker>();
  const [isMarker, setIsMarker] = React.useState<boolean>(false);
  //const [waypoint, setWaypoint] = React.useState<waypoint | undefined>(undefined);

  React.useEffect(() => {
    if (!marker) {
      setMarker(new google.maps.Marker());
    }
    // remove marker from map on unmount
    return () => {
      if (marker) {
        marker.setMap(null);
      }
    };
  }, [marker]);

  React.useEffect(() => {
    if (marker && !isMarker) {
      marker.setOptions(options);
      if (options.waypoint !== undefined) {
        marker.addListener("click", () => {
          //TODO: SHOW WAYPOINT POPUP
          var content = (
            <WaypointDetailsPopup
              trackWaypoint={options.waypoint!}
              wpType={options.wpType!}
            />
          );
          var contentString = ReactDOMServer.renderToString(content);
          var infowindow = new google.maps.InfoWindow({
            content: contentString,
          });

          infowindow.open(marker.getMap(), marker);
        });
      }
      setIsMarker(true);
    }
  }, [marker, isMarker, options]);

  return null;
}; // [END maps_react_map_marker_component]

export default WaypointMarker;
