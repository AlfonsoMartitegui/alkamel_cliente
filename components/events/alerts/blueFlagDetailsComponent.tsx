import React from "react";
import Image from "next/image";
import { eventInfo, participantInfo } from "server/ppTrackerdataServerIoClient";
import { Button, Modal, Container, Table, Row, Col } from "react-bootstrap";
import { apiBlueFlag } from "server/shared/socket_io_packets";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";

//import { access } from "fs";

interface BlueFlagDetailsProps {
  ev: eventInfo | undefined;
  blueFlag: apiBlueFlag;
  participants: participantInfo[];
  stages: stage[];
  onHide: () => void;
}

const BlueFlagDetailsComponent: React.FC<BlueFlagDetailsProps> = (props) => {
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
      return "-";
    }
  };

  const getParticipantNumber = (id: number) => {
    if (participantsById.has(BigInt(id))) {
      const part = participantsById.get(BigInt(id)) as participantInfo;
      return part.is_officialcar ? part.number : part.number;
    } else {
      return "(unknown, id: " + id.toString() + ")";
    }
  };

  // flag_disabled.png;
  // flag_red.png;
  const iconsVersion = "v4";

  return (
    <Modal show={true} onHide={props.onHide} dialogClassName="sosDetailsModal">
      <Modal.Header
        className="bg-dark text-light border border-light"
        closeButton
      >
        <Modal.Title>
          <Row>
            <Col className="col-auto">
              <Image
                src={`/maps/${iconsVersion}/alertIcons/blueFlag.png`}
                alt="Message"
                height={35}
                width={35}
              />
            </Col>
            <Col>Blue Flag Details</Col>
          </Row>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light border border-light">
        <Container>
          <Table responsive variant="dark" className="m-0 p-0">
            <tbody>
              <tr>
                <td className="fw-bold">Request From:</td>
                <td>
                  {" "}
                  Nr{" "}
                  {getParticipantNumber(props.blueFlag.participant_requester)}
                </td>
                <td>
                  {getParticipantDrivers(props.blueFlag.participant_requester)}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Target:</td>
                <td>
                  {" "}
                  Nr {getParticipantNumber(props.blueFlag.participant_target)}
                </td>
                <td>
                  {getParticipantDrivers(props.blueFlag.participant_target)}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Stage:</td>
                <td>
                  {props.blueFlag.stage_id !== 0
                    ? getStageName(props.blueFlag.stage_id)
                    : " - "}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Request Time:</td>
                <td>
                  {millisToCurrentDate(
                    props.blueFlag.blue_flag_request_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Display Time:</td>
                <td>
                  {millisToCurrentDate(
                    props.blueFlag.blue_flag_displayed_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Response Time:</td>
                <td>
                  {millisToCurrentDate(
                    props.blueFlag.blue_flag_response_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Accept Time:</td>
                <td>
                  {millisToCurrentDate(
                    props.blueFlag.blue_flag_response_accepted_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Time Out:</td>
                <td>{props.blueFlag.blue_flag_timeout}</td>
              </tr>
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

export default BlueFlagDetailsComponent;
