import React from "react";

import { Table } from "react-bootstrap";

import { track_waypoints, waypoint_types } from "@prisma/client";

//import { access } from "fs";

interface WaypointDetailsProps {
  trackWaypoint: track_waypoints;
  wpType: waypoint_types;
}

const WaypointDetailsPopup: React.FC<WaypointDetailsProps> = (props) => {
  return (
    <Table variant="dark" className="p-0 m-0">
      <tr>
        <td>Name:</td>
        <td>
          {props.trackWaypoint.name} {"(" + props.wpType.name_en + ")"}
        </td>
      </tr>
      <tr>
        <td>Km:</td>
        <td>
          {props.trackWaypoint.km !== 0 ? props.trackWaypoint.km / 1000 : 0}{" "}
          {"( Idx: " + props.trackWaypoint.idx + ")"}
        </td>
      </tr>
      <tr>
        <td>Pos:</td>
        <td>
          {props.trackWaypoint.lat !== 0
            ? props.trackWaypoint.lat / 10000000
            : 0}
          ,
          {props.trackWaypoint.lon !== 0
            ? props.trackWaypoint.lon / 10000000
            : 0}
        </td>
      </tr>
      <tr>
        <td>Radius:</td>
        <td
          className={
            props.trackWaypoint.innerRadius !== 0 ||
            props.trackWaypoint.externalRadius !== 0
              ? "font-weight-bold text-warning"
              : ""
          }
        >
          {props.trackWaypoint.innerRadius !== 0
            ? props.trackWaypoint.innerRadius
            : props.wpType.default_inner_radio}
          ,
          {props.trackWaypoint.externalRadius !== 0
            ? props.trackWaypoint.externalRadius
            : props.wpType.default_outer_radio}
        </td>
      </tr>
    </Table>
  );
};

export default WaypointDetailsPopup;
