import { useEffect, useState } from "react";
import React from "react";
import { Table } from "react-bootstrap";

import { event, stage } from "@prisma/client";

import { participantInfo, rallyInfo } from "server/ppTrackerdataServerIoClient";
import { apiIncidence } from "server/shared/socket_io_packets";
import { millisToCurrentDate } from "server/shared/utils";

export interface ReverseListProps {
  rally: rallyInfo | undefined;
  event: event | undefined;
  data: apiIncidence[];
  showDetails?: boolean;
}

export interface reverseLogLine {
  lat: number;
  lon: number;
  t: number;
  sp: number;
  m: number;
}
export interface reverseData extends apiIncidence {
  logArray: reverseLogLine[];
  duration: number;
  lat: number;
  lng: number;
}

const ReverseListComponent: React.FC<ReverseListProps> = (props) => {
  const [data, setData] = useState<reverseData[]>([]);
  // Chart.register(point)
  useEffect(() => {
    let newData: reverseData[] = [];
    for (var i of props.data) {
      if (i.type !== 2) {
        continue;
      }
      let reverse: reverseData = {
        logArray: [],
        duration: 0,
        lat: 0,
        lng: 0,
        ...i,
      };

      if (i.startTime > 0 && i.endTime > 0) {
        reverse.duration = i.endTime - i.startTime;
      }

      const logString = i.log ? i.log : "";
      if (logString.length > 0) {
        try {
          reverse.logArray = JSON.parse(logString);
          if (reverse.logArray.length > 0) {
            reverse.lat = reverse.logArray[0].lat / 10000000;
            reverse.lng = reverse.logArray[0].lon / 10000000;
          }
        } catch {
          console.log("ERROR PARCING LOG DATA: ", i.log);
        }
      }
      //console.log("NEW REVERSE: ", reverse);
      newData.push(reverse);
    }
    setData(newData);
  }, [props.data.length, props.data]);

  const ev = props.event;
  const evOffsetMillis = ev ? ev.offsetGMT * 3600000 : 0;

  let participantsById = new Map<number, participantInfo>();
  let stagesById = new Map<number, stage>();
  if (props.rally) {
    for (var p of props.rally.participants) {
      participantsById.set(Number(p.id), p);
    }
    for (var s of props.rally.stages) {
      stagesById.set(Number(s.id), s);
    }
  }

  return (
    <Table striped bordered responsive variant="dark">
      <thead>
        <tr>
          <th>Nr</th>
          <th>Driver</th>
          <th>Codriver</th>
          <th>Stage</th>
          <th>Start</th>
          <th>End</th>
          <th>Duration</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
        {data
          .sort((a, b) => {
            const partA = participantsById.get(a.participantId);
            const partB = participantsById.get(b.participantId);
            if (a.participantId !== b.participantId) {
              if (partA !== undefined && partB != undefined) {
                if (Number(partA.number) < Number(partB.number)) return -1;
                else return 1;
              } else {
                if (Number(a.participantId) < Number(b.participantId))
                  return -1;
                else return 1;
              }
            } else {
              if (Number(a.startTime) < Number(b.startTime)) return -1;
              else return 1;
            }
          })
          .filter((i) => i.type == 2)
          .map((incidence, index) => (
            <tr key={Number(index)}>
              <td>{participantsById.get(incidence.participantId)?.number}</td>
              <td>
                {participantsById.get(incidence.participantId)?.driver_name +
                  " " +
                  participantsById.get(incidence.participantId)?.driver_surname}
              </td>
              <td>
                {participantsById.get(incidence.participantId)?.codriver_name +
                  " " +
                  participantsById.get(incidence.participantId)
                    ?.codriver_surname}
              </td>
              <td>{stagesById.get(incidence.stageId)?.time_control}</td>
              <td>
                {millisToCurrentDate(
                  incidence.startTime,
                  evOffsetMillis,
                  "DATE_TIME",
                  " "
                )}
              </td>
              <td>
                {millisToCurrentDate(
                  incidence.endTime,
                  evOffsetMillis,
                  "DATE_TIME",
                  " "
                )}
              </td>
              <td>{incidence.duration / 1000}</td>
              <td>
                <a
                  target="_blank"
                  href={`https://www.google.com/maps/search/?api=1&query=${incidence.lat},${incidence.lng}`}
                  rel="noopener noreferrer"
                >
                  {`${incidence.lat}, ${incidence.lng}`}
                </a>
              </td>
            </tr>
          ))}
      </tbody>
    </Table>
  );
};

export default ReverseListComponent;
