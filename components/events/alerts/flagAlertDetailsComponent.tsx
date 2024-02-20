import React from "react";
import Image from "next/image";
import { eventInfo, participantInfo } from "server/ppTrackerdataServerIoClient";
import { Button, Modal, Container, Table } from "react-bootstrap";
import { flagAlert } from "server/shared/socket_io_packets";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";
//import { access } from "fs";

interface FlagDetailsProps {
  ev: eventInfo | undefined;
  alert: flagAlert;
  participants: participantInfo[];
  stages: stage[];
  onHide: () => void;
}

const FlagDetailsComponent: React.FC<FlagDetailsProps> = (props) => {
  const evOffsetMillis = props.ev ? props.ev.offsetGMT * 3600000 : 0;
  const participantsById = new Map<BigInt, participantInfo>();
  const stagesMap = new Map<number, stage>();

  for (var p of props.participants) {
    participantsById.set(p.id, p);
  }
  for (var s of props.stages) {
    stagesMap.set(Number(s.id), s);
  }

  const getStageName = (id: number) => {
    if (stagesMap.has(id)) {
      return stagesMap.get(id)?.time_control;
    } else {
      return "(unknown, id: " + id.toString() + ")";
    }
  };

  const getWayPointName = (stageId: number, waypointId: number) => {
    if (!stagesMap.has(stageId)) {
      return "-";
    }
    if (waypointId > 0) {
      return waypointId.toString();
    }
    return "-";
  };

  const getParticipantDrivers = (id: number) => {
    if (participantsById.has(BigInt(id))) {
      const part = participantsById.get(BigInt(id)) as participantInfo;
      return part.is_officialcar
        ? part.driver_name
        : part.driver_name +
            " " +
            part.driver_surname +
            " / " +
            part.codriver_name +
            " " +
            part.codriver_surname;
    } else {
      return "" + id.toString();
    }
  };

  const getParticipantNumber = (id: number) => {
    if (participantsById.has(BigInt(id))) {
      const part = participantsById.get(BigInt(id)) as participantInfo;
      return part.is_officialcar ? part.number : part.number;
    } else {
      return "" + id.toString();
    }
  };

  // flag_disabled.png;
  // flag_red.png;

  const getFlagTypeIcon = (s: flagAlert) => {
    const iconsVersion = "v4";
    switch (s.flag_type) {
      case 0:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/noFlag.png`}
            alt="Message"
            height={35}
            width={35}
          />
        );
      case 1:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/redFlag.png`}
            alt="Message"
            height={35}
            width={35}
          />
        );
      case 2:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/yellowFlag.png`}
            alt="Message"
            height={35}
            width={35}
          />
        );
    }
  };

  const getFlagTypeAsString = (s: flagAlert) => {
    switch (s.flag_type) {
      case 0:
        return "NO FLAG";
      case 1:
        return "RED";
      case 2:
        return "YELLOW";
    }
  };

  return (
    <Modal show={true} onHide={props.onHide} dialogClassName="sosDetailsModal">
      <Modal.Header
        className="bg-dark text-light border border-light"
        closeButton
      >
        <Modal.Title>
          {getFlagTypeIcon(props.alert)}
          {getFlagTypeAsString(props.alert)} Flag Details
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light border border-light">
        <Container>
          <Table responsive variant="dark" className="m-0 p-0">
            <tbody>
              <tr>
                <td className="fw-bold">Stage:</td>
                <td>
                  {props.alert.stage_id !== 0
                    ? getStageName(props.alert.stage_id)
                    : " - "}
                </td>
                <td className="fw-bold">Waypoint:</td>
                <td className="fw-bold">
                  {getWayPointName(
                    props.alert.stage_id,
                    props.alert.flag_meters
                  )}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Type:</td>
                <td>
                  {getFlagTypeIcon(props.alert)}
                  {getFlagTypeAsString(props.alert)}
                </td>
                <td className="fw-bold">Flag Time:</td>
                <td>
                  {millisToCurrentDate(
                    props.alert.flag_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
            </tbody>
          </Table>
          <Table
            striped
            hover
            responsive
            variant="dark"
            className="mt-3 mx-0 p-0"
            bordered
          >
            <thead>
              <tr>
                <th colSpan={4} className="fs-5">
                  DETAILS BY PARTICIPANT
                </th>
              </tr>
              <tr>
                <th>Nr</th>
                <th>Driver / Co-Driver</th>
                <th>Displayed</th>
                <th>Confirm At</th>
              </tr>
            </thead>
            <tbody>
              {props.alert.details
                .filter((a) => a.ack_time > 0 || a.displayed_time > 0)
                .map((a, index) => (
                  <tr key={index}>
                    <td>{getParticipantNumber(a.participant_id)}</td>
                    <td>{getParticipantDrivers(a.participant_id)}</td>
                    <td>
                      {millisToCurrentDate(
                        a.displayed_time,
                        evOffsetMillis,
                        "TIME_DATE",
                        ", "
                      )}
                      <br />
                      At {a.displayed_lat / 10000000},{" "}
                      {a.displayed_lon / 10000000}
                    </td>
                    <td>
                      {millisToCurrentDate(
                        a.ack_time,
                        evOffsetMillis,
                        "TIME_DATE",
                        ", "
                      )}
                      <br />
                      At {a.flag_ack_lat / 10000000},{" "}
                      {a.flag_ack_lon / 10000000}
                    </td>
                  </tr>
                ))}
            </tbody>
          </Table>
        </Container>
      </Modal.Body>
      <Modal.Footer className="bg-dark text-light border border-light">
        <Button variant="secondary" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FlagDetailsComponent;
