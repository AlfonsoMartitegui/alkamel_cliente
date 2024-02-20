import React from "react";
import Image from "next/image";
import { eventInfo, participantInfo } from "server/ppTrackerdataServerIoClient";
import { Button, Modal, Container, Table, Row, Col } from "react-bootstrap";
import { apiMessage } from "server/shared/socket_io_packets";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";

interface messageDetailsProps {
  ev: eventInfo | undefined;
  alert: apiMessage;
  participants: participantInfo[];
  stages: stage[];
  onHide: () => void;
}

const MessageDetailsComponent: React.FC<messageDetailsProps> = (props) => {
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

  const getParticipantIdNumber = (id: BigInt) => {
    if (participantsById.has(id)) {
      const part = participantsById.get(id) as participantInfo;
      return part.is_officialcar
        ? part.number + " - " + part.driver_name
        : "Nr. " +
            part.number +
            " - " +
            part.driver_name +
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

  //  const getMessageTypeAsString = (message: apiMessage) => {
  //     switch (message.message_has_response) {
  //       case 1:
  //         return "YES / NO";
  //       default:
  //         return "ACCEPT";
  //     }
  //   };

  const getMessageResponse = (message: apiMessage) => {
    if (message.message_response_time > 0) {
      if (message.message_has_response === 1) {
        return message.message_response === 2 ? "YES" : "NO";
      } else {
        return "OK";
      }
    } else return "-";
  };

  const iconsVersion = "v4";

  return (
    <Modal
      show={true}
      onHide={props.onHide}
      dialogClassName="messageDetailsModal"
    >
      <Modal.Header
        className="bg-dark text-light border border-light"
        closeButton
      >
        <Modal.Title>
          <Row>
            <Col className="col-auto">
              <Image
                src={`/maps/${iconsVersion}/alertIcons/message.png`}
                alt="Message"
                height={35}
                width={35}
              />
            </Col>
            <Col>Message Details</Col>
          </Row>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light border border-light">
        <Container>
          <Table striped hover responsive variant="dark" className="m-0 p-0">
            <tbody>
              <tr>
                <td className="fw-bold">Message:</td>
                <td colSpan={3} className="text-warning">
                  {props.alert.message_text}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Participant:</td>
                <td>
                  {getParticipantIdNumber(BigInt(props.alert.participant))}{" "}
                </td>
                <td className="fw-bold">Message Response:</td>
                <td className="fw-bold text-warning">
                  {getMessageResponse(props.alert)}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Send At:</td>
                <td colSpan={3}>
                  {millisToCurrentDate(
                    props.alert.message_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Response At:</td>
                <td colSpan={3}>
                  {millisToCurrentDate(
                    props.alert.message_response_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">ACK at:</td>
                <td colSpan={3}>
                  {millisToCurrentDate(
                    props.alert.message_received_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Displayed At:</td>
                <td colSpan={3}>
                  {millisToCurrentDate(
                    props.alert.message_displayed_at,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">Location:</td>
                <td colSpan={3}>
                  {props.alert.stage_id !== 0 &&
                    "STAGE " + getStageName(props.alert.stage_id)}
                </td>
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

export default MessageDetailsComponent;
