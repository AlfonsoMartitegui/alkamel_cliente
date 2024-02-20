import { Fragment, useEffect, useState } from "react";
import React from "react";
import { Col, Row, Table } from "react-bootstrap";

import { event, stage } from "@prisma/client";

import { participantInfo, rallyInfo } from "server/ppTrackerdataServerIoClient";
import { apiIncidence } from "server/shared/socket_io_packets";
import { millisToCurrentDate } from "server/shared/utils";

export interface attemptAnalysisLine {
  participantId: number;
  stageId: number;
  attemptIdx: number;
  attemptNr: number;
  arriveTime: number;
  startTime: number;
  enterTime: number;
  enterLat: number;
  enterLng: number;
  abandonTime: number;
  abandonLat: number;
  abandonLng: number;
  finishTime: number;
  exitTime: number;
  isAttemptNrAlert: boolean;
  isStartTimeAlert: boolean;
}

export interface AttempsListProps {
  rally: rallyInfo | undefined;
  event: event | undefined;
  data: attemptAnalysisLine[];
  showDetails?: boolean;
}

export interface oversSpeedLogLine {
  lat: number;
  lon: number;
  t: number;
  sp: number;
  m: number;
}
export interface overSpeedData extends apiIncidence {
  logArray: oversSpeedLogLine[];
  duration: number;
  distance: number;
  maxSpeed: number;
  maxAllowedSpeed: number;
  lat: number;
  lng: number;
}

const AttemptListComponent: React.FC<AttempsListProps> = (props) => {
  const [attemptLines, setAttemptLines] = useState<attemptAnalysisLine[]>([]);
  const [participantsById, setParticipantsById] = useState(
    new Map<number, participantInfo>()
  );
  const [stagesById, setStagesById] = useState(new Map<number, stage>());
  const [participantsWithData, setParticipantsWithData] = useState<number[]>(
    []
  );

  useEffect(() => {
    let participantsByIdMap = new Map<number, participantInfo>();
    let stagesByIdMap = new Map<number, stage>();
    if (props.rally) {
      for (var p of props.rally.participants) {
        participantsByIdMap.set(Number(p.id), p);
      }
      for (var s of props.rally.stages) {
        stagesByIdMap.set(Number(s.id), s);
      }
    }
    setParticipantsById(participantsByIdMap);
    setStagesById(stagesByIdMap);
    setAttemptLines(props.data);

    let partWithData: number[] = [];
    for (var att of props.data) {
      if (!partWithData.includes(att.participantId)) {
        partWithData.push(att.participantId);
      }
    }
    setParticipantsWithData(partWithData);

    //console.log("Attemps by Part:", partWithData);
  }, [props.data.length, props.data, props.rally]);

  const evOffsetMillis = props.event ? props.event.offsetGMT * 3600000 : 0;

  return (
    <Fragment>
      {participantsWithData.map((p) => (
        <Fragment key={p}>
          <Row className="bg-dark-50 mx-0 border">
            <Col className="col-auto ps-2 fw-bold fs-4">
              Nr. {participantsById.get(p)?.number}
            </Col>
            <Col className="col-auto ps-2 ms-5 my-1 fs-5">
              {participantsById.get(p)?.driver_name +
                " " +
                participantsById.get(p)?.driver_surname}
            </Col>
            <Col className="col-auto ps-2 ms-5 my-1 fs-5">
              {participantsById.get(p)?.codriver_name +
                " " +
                participantsById.get(p)?.codriver_surname}
            </Col>
          </Row>
          <Row>
            <Table striped bordered responsive variant="dark">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Attempt Nr</th>
                  <th>Arrival</th>
                  <th>Start</th>
                  <th>Enter</th>
                  <th>Abandon</th>
                  <th>Finish</th>
                  <th>Exit</th>
                </tr>
              </thead>
              <tbody>
                {attemptLines
                  .filter((i) => i.participantId == p)
                  .sort((a, b) => {
                    const partA = participantsById.get(a.participantId);
                    const partB = participantsById.get(b.participantId);
                    if (a.participantId !== b.participantId) {
                      if (partA !== undefined && partB != undefined) {
                        if (Number(partA.number) < Number(partB.number))
                          return -1;
                        else return 1;
                      } else {
                        if (Number(a.participantId) < Number(b.participantId))
                          return -1;
                        else return 1;
                      }
                    } else {
                      if (Number(a.attemptIdx) < Number(b.attemptIdx))
                        return -1;
                      else return 1;
                    }
                  })
                  .map((l, index) => (
                    <Fragment key={index}>
                      <tr key={Number(index)}>
                        <td>{stagesById.get(l.stageId)?.time_control}</td>
                        <td
                          className={l.isAttemptNrAlert ? "table-danger" : ""}
                        >
                          {l.attemptNr}
                        </td>
                        <td>
                          {l.arriveTime > 0
                            ? millisToCurrentDate(
                                l.arriveTime,
                                evOffsetMillis,
                                "DATE_TIME",
                                " "
                              )
                            : "-"}
                        </td>
                        <td>
                          {l.startTime > 0
                            ? millisToCurrentDate(
                                l.startTime,
                                evOffsetMillis,
                                "DATE_TIME",
                                " "
                              )
                            : "-"}
                        </td>
                        <td>
                          {l.enterTime > 0
                            ? millisToCurrentDate(
                                l.enterTime,
                                evOffsetMillis,
                                "DATE_TIME",
                                " "
                              )
                            : "-"}
                          {l.enterTime > 0 && (
                            <Fragment>
                              <br />
                              <a
                                target="_blank"
                                href={`https://www.google.com/maps/search/?api=1&query=${l.enterLat},${l.enterLng}`}
                                rel="noopener noreferrer"
                              >
                                {`${l.enterLat}, ${l.enterLng}`}
                              </a>
                            </Fragment>
                          )}
                        </td>
                        <td>
                          {l.abandonTime > 0
                            ? millisToCurrentDate(
                                l.abandonTime,
                                evOffsetMillis,
                                "DATE_TIME",
                                " "
                              )
                            : "-"}
                          {l.abandonTime > 0 && (
                            <Fragment>
                              <br />
                              <a
                                target="_blank"
                                href={`https://www.google.com/maps/search/?api=1&query=${l.abandonLat},${l.abandonLng}`}
                                rel="noopener noreferrer"
                              >
                                {`${l.abandonLat}, ${l.abandonLng}`}
                              </a>
                            </Fragment>
                          )}
                        </td>
                        <td>
                          {l.finishTime > 0
                            ? millisToCurrentDate(
                                l.finishTime,
                                evOffsetMillis,
                                "DATE_TIME",
                                " "
                              )
                            : "-"}
                        </td>
                        <td>
                          {l.exitTime > 0
                            ? millisToCurrentDate(
                                l.exitTime,
                                evOffsetMillis,
                                "DATE_TIME",
                                " "
                              )
                            : "-"}
                        </td>
                      </tr>
                    </Fragment>
                  ))}
              </tbody>
            </Table>
          </Row>
        </Fragment>
      ))}
    </Fragment>
  );
};

export default AttemptListComponent;
