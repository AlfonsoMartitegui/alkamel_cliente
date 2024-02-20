import { Fragment } from "react";
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { participant, stage } from "@prisma/client";
import {
  eventInfo,
  participantInfo,
  PPTrackerDataServerIoClient,
  rallyInfo,
} from "server/ppTrackerdataServerIoClient";
import { dateIsFromToday, millisToCurrentDate } from "server/shared/utils";
import { apiPosition } from "server/shared/apiSharedTypes";

interface PositionDetailsProps {
  ev: eventInfo | undefined;
  participant: participant | undefined;
  participantInfo: participantInfo | undefined;
  userIsAdmin?: boolean;
  rally: rallyInfo | undefined;
  ppTrackerClient: PPTrackerDataServerIoClient;
}

const PositionDetailsComponent: React.FC<PositionDetailsProps> = (props) => {
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
      {props.participantInfo !== undefined && (
        <Container className="bg-light text-dark">
          <Row className="text-center fw-bold">LAST POSITION</Row>

          {props.participantInfo.position?.lat != undefined && (
            <Row>
              Position:{" "}
              {props.participantInfo.position.lat !== undefined &&
                props.participantInfo.position?.lat +
                  ", " +
                  props.participantInfo.position?.lon}
            </Row>
          )}
          {props.participantInfo.position?.lat === undefined && (
            <Row>Position: Unknown</Row>
          )}
          <Row className="row-cols-auto">
            <Col className="p-0">Time:</Col>
            <Col>
              <span className="fw-bold">
                {millisToCurrentDate(
                  props.participantInfo.position?.time,
                  evOffsetMillis,
                  "TIME"
                )}
              </span>
              {dateIsFromToday(props.participantInfo.position?.time)
                ? ""
                : ", " +
                  millisToCurrentDate(
                    props.participantInfo.position?.time,
                    evOffsetMillis,
                    "DATE"
                  )}
            </Col>
          </Row>
          {props.participantInfo !== undefined && props.userIsAdmin && (
            <Row>
              <Col className="p-0">Last Stopped Time:</Col>
              <Col>
                <span className="fw-bold">
                  {millisToCurrentDate(
                    props.participantInfo.lastStopTime,
                    evOffsetMillis,
                    "TIME"
                  )}
                </span>
                {dateIsFromToday(props.participantInfo.lastStopTime)
                  ? ""
                  : ", " +
                    millisToCurrentDate(
                      props.participantInfo.lastStopTime,
                      evOffsetMillis,
                      "DATE"
                    )}
              </Col>
            </Row>
          )}
          <Row>Speed: {props.participantInfo.position?.speed}</Row>
          {props.participantInfo !== undefined && props.userIsAdmin && (
            <Fragment>
              <Row>
                Stage:{" "}
                {props.participantInfo.position
                  ? getStageName(
                      BigInt(props.participantInfo.position.stage_id)
                    )
                  : "unknown"}
              </Row>
              <Row>
                Km:{" "}
                {props.participantInfo.position?.meter !== 0 &&
                props.participantInfo.position?.meter !== undefined
                  ? props.participantInfo.position?.meter / 100000
                  : 0}
              </Row>
              <Row>Course: {props.participantInfo.position?.course} º</Row>
              <Row>Altitude: {props.participantInfo.position?.altitude}</Row>
              <Row>
                Accelaration:{" "}
                {getAccelarationString(props.participantInfo.position)} G
              </Row>
              <Row>
                PPTracker ID:{" "}
                {getPPTrackerShortCode(
                  props.participantInfo.position?.pptracker_id
                )}
                {props.participantInfo.position?.pptracker_id}
              </Row>
            </Fragment>
          )}
        </Container>
      )}
      {props.participantInfo !== undefined && props.userIsAdmin && (
        <Fragment>
          <Container className="bg-light text-dark mt-2">
            <Row className="text-center fw-bold">GPRS</Row>
            {props.participantInfo?.position?.GPRSQuality != null && (
              <Row>
                Quality: {props.participantInfo?.position?.GPRSQuality} dBm.
              </Row>
            )}
            {props.participantInfo?.position?.GPRSBand != null && (
              <Row>Band: {props.participantInfo?.position?.GPRSBand}</Row>
            )}
            {props.participantInfo?.position?.GPSStatus != null && (
              <Row>
                GPS Status:{" "}
                {getGPRSStatusAsString(
                  props.participantInfo?.position?.GPSStatus
                )}
              </Row>
            )}
            {props.participantInfo?.position?.GPSSat != null && (
              <Row>Satellites: {props.participantInfo?.position?.GPSSat}</Row>
            )}
            {props.participantInfo?.position?.GPSHDOP != null && (
              <Row>
                HDOP:{" "}
                {props.participantInfo?.position?.GPSHDOP !== 0
                  ? props.participantInfo?.position?.GPSHDOP / 100
                  : 0}
              </Row>
            )}
          </Container>
          <Container className="bg-light text-dark mt-2">
            <Row className="text-center fw-bold">BATTERY</Row>
            {props.participantInfo?.position?.batteryVoltage != null && (
              <Row>
                Voltage:{" "}
                {props.participantInfo?.position?.batteryVoltage / 1000} V
              </Row>
            )}
            {props.participantInfo?.position?.battery != null && (
              <Row>SoC: {props.participantInfo?.position?.battery} %</Row>
            )}
          </Container>
          <Container className="bg-light text-dark mt-2">
            <Row className="text-center fw-bold">CAR</Row>
            {props.participantInfo?.position?.carVoltage != null && (
              <Row>
                Voltage: {props.participantInfo?.position?.carVoltage / 1000} V
              </Row>
            )}
            {props.participantInfo?.position?.carCurrent != null && (
              <Row>
                Current: {props.participantInfo?.position?.carCurrent / 1000} A
              </Row>
            )}
            {props.participantInfo?.position?.internalTemperature != null && (
              <Row>
                System Temp:{" "}
                {props.participantInfo?.position?.internalTemperature / 10} ºC
              </Row>
            )}
          </Container>
        </Fragment>
      )}
    </Fragment>
  );
};

export default PositionDetailsComponent;
