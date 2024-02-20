import { Fragment } from "react";
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { participant, stage } from "@prisma/client";
import {
  eventInfo,
  PPTrackerDataServerIoClient,
  rallyInfo,
} from "server/ppTrackerdataServerIoClient";
import { dateIsFromToday, millisToCurrentDate } from "server/shared/utils";
import { apiPosition } from "server/shared/apiSharedTypes";
import { apiPositionRecord } from "server/shared/socket_io_packets";

interface PositionDetailsProps {
  ev: eventInfo | undefined;
  participant: participant | undefined;
  position: apiPositionRecord | undefined;
  rally: rallyInfo | undefined;
  ppTrackerClient: PPTrackerDataServerIoClient;
}

const PositionReplayDetailsComponent: React.FC<PositionDetailsProps> = (
  props
) => {
  const evOffsetMillis = props.ev ? props.ev.offsetGMT * 3600000 : 0;

  if (props.participant == undefined) return <Fragment></Fragment>;

  const stagesById = new Map<bigint, stage>();
  if (props.rally !== undefined) {
    for (var s of props.rally.stages) {
      stagesById.set(s.id, s);
    }
  }

  const getAccelarationString = (pos: apiPosition | undefined) => {
    if (pos) {
      return (
        "[" +
        pos.accelerationX +
        ", " +
        pos.accelerationY +
        ", " +
        pos.accelerationZ +
        "]"
      );
    } else {
      return "-";
    }
  };

  const getStageName = (stageId: bigint) => {
    return stagesById.has(stageId)
      ? stagesById.get(stageId)?.time_control
      : "unknown";
  };

  const getGPRSStatusAsString = (type: number) => {
    switch (type) {
      case 1:
        return "NO Fix";
      case 2:
        return "2D Fix";
      case 3:
        return "3D Fix";
    }
    return "";
  };

  const getPPTrackerShortCode = (id: number | undefined) => {
    if (id !== undefined && props.ppTrackerClient.ppTrackerShortCodes.has(id)) {
      return "(#" + props.ppTrackerClient.ppTrackerShortCodes.get(id) + ") ";
    } else {
      return "";
    }
  };

  return (
    <Fragment>
      <Container className="mx-0 px-0">
        <Row className="text-center fw-bold fs-5 px-2 mt-0 mb-1 bg-light text-dark">
          LAST POSITION
        </Row>

        {props.position?.lat != undefined && (
          <Row>
            Position:{" "}
            {props.position.lat !== undefined &&
              props.position?.lat + ", " + props.position?.lon}
          </Row>
        )}
        {props.position?.lat === undefined && <Row>Position: Unknown</Row>}
        <Row className="row-cols-auto">
          <Col className="p-0">Time:</Col>
          <Col>
            <span className="fw-bold">
              {millisToCurrentDate(
                props.position?.time,
                evOffsetMillis,
                "TIME"
              )}
            </span>
            {dateIsFromToday(props.position?.time)
              ? ""
              : ", " +
                millisToCurrentDate(
                  props.position?.time,
                  evOffsetMillis,
                  "DATE"
                )}
          </Col>
        </Row>
        <Row className="row-cols-auto">
          <Col className="p-0">Publ:</Col>
          <Col>
            <span className="fw-bold">
              {millisToCurrentDate(
                props.position?.published_at,
                evOffsetMillis,
                "TIME"
              )}
            </span>
            {dateIsFromToday(props.position?.published_at)
              ? ""
              : ", " +
                millisToCurrentDate(
                  props.position?.published_at,
                  evOffsetMillis,
                  "DATE"
                )}
          </Col>
        </Row>
        <Row>Speed: {props.position?.speed}</Row>
        <Row>
          Stage:{" "}
          {props.position
            ? getStageName(BigInt(props.position.stage_id))
            : "unknown"}
        </Row>
        <Row>
          Km:{" "}
          {props.position?.meter !== 0 && props.position?.meter !== undefined
            ? props.position?.meter / 100000
            : 0}
        </Row>
        <Row>Course: {props.position?.course} º</Row>
        <Row>Altitude: {props.position?.altitude}</Row>
        <Row>Accelaration: {getAccelarationString(props.position)} G</Row>
        <Row>
          PPTracker ID: {getPPTrackerShortCode(props.position?.pptracker_id)}
          {props.position?.pptracker_id}
        </Row>
      </Container>
      <Container className="mx-0 px-0">
        <Row className="text-center fw-bold fs-5 px-2 mt-0 mb-1 bg-light text-dark">
          GPRS
        </Row>
        <Row>Quality: {props.position?.GPRSQuality} dBm.</Row>
        <Row>Band: {props.position?.GPRSBand}</Row>
        <Row>
          GPS Status:{" "}
          {props.position?.GPSStatus != null
            ? getGPRSStatusAsString(props.position?.GPSStatus)
            : ""}
        </Row>
        <Row>Satellites: {props.position?.GPSSat}</Row>
        <Row>
          HDOP:{" "}
          {props.position?.GPSHDOP !== null &&
          props.position?.GPSHDOP !== undefined &&
          props.position?.GPSHDOP !== 0
            ? props.position?.GPSHDOP / 100
            : 0}
        </Row>
      </Container>
      <Container className="mx-0 px-0">
        <Row className="text-center fw-bold fs-5 px-2 mt-0 mb-1 bg-light text-dark">
          BATTERY
        </Row>
        <Row>
          Voltage:{" "}
          {props.position?.batteryVoltage != null
            ? props.position?.batteryVoltage / 1000
            : "-"}{" "}
          V
        </Row>
        <Row>SoC: {props.position?.battery} %</Row>
      </Container>
      <Container className="mx-0 px-0">
        <Row className="text-center fw-bold fs-5 px-2 mt-0 mb-1 bg-light text-dark">
          CAR
        </Row>
        <Row>
          Voltage:{" "}
          {props.position?.carVoltage != null
            ? props.position?.carVoltage / 1000
            : "-"}{" "}
          V
        </Row>
        <Row>
          Current:{" "}
          {props.position?.carCurrent != null
            ? props.position?.carCurrent / 1000
            : "-"}{" "}
          A
        </Row>
        <Row>
          System Temp:{" "}
          {props.position?.internalTemperature != null
            ? props.position?.internalTemperature / 10
            : "-"}{" "}
          ºC
        </Row>
      </Container>
    </Fragment>
  );
};

export default PositionReplayDetailsComponent;
