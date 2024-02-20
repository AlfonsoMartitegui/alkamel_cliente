import React, { useState } from "react";
import {
  eventInfo,
  participantInfo,
  PPTrackerDataServerIoClient,
} from "server/ppTrackerdataServerIoClient";
import { Button, Modal, Container, Table } from "react-bootstrap";
import { apiLogResponse, logLine } from "server/shared/apiSharedTypes";
import {
  apiSosAlertMerge,
  sosAckCommand,
} from "server/shared/socket_io_packets";
import LogViewer from "components/utils/logViewer";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";

interface sendMessageProps {
  ev: eventInfo | undefined;
  alert: apiSosAlertMerge;
  participants: participantInfo[];
  stages: stage[];
  ppTrackerClient: PPTrackerDataServerIoClient;
  onHide: () => void;
}

const SosDetailsComponent: React.FC<sendMessageProps> = (props) => {
  console.log("props.alert:", props.alert);
  const evOffsetMillis = props.ev ? props.ev.offsetGMT * 3600000 : 0;
  const participantsById = new Map<BigInt, participantInfo>();
  const stagesMap = new Map<number, stage>();

  for (var p of props.participants) {
    participantsById.set(p.id, p);
  }
  for (var s of props.stages) {
    stagesMap.set(Number(s.id), s);
  }

  const [logLines, setLogLines] = useState<logLine[] | undefined>(undefined);

  const sendAck = () => {
    const cmd: sosAckCommand = {
      rallyId: Number(props.alert.rally_id),
      ackTime: new Date().getTime(),
      sosTime: props.alert.time,
      ppTrackerId: props.alert.pptracker_id,
      participantId: props.alert.participant,
    };

    setLogLines([
      {
        type: "INFO",
        message: "Waiting for server response...",
        idx: 1,
        time: new Date().getTime(),
      },
    ]);

    props.ppTrackerClient.setSosAck(
      cmd,
      Number(props.alert.rally_id),
      (response: apiLogResponse) => {
        setLogLines(response.log);
      }
    );
  };

  const hideLog = () => {
    setLogLines(undefined);
  };

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

  const getSosTypeAsString = (s: apiSosAlertMerge) => {
    console.log("Sos Type: ", s.type, " SybTypoe:", s.subtype);
    if (s.subtype > 0) {
      switch (s.subtype) {
        case 1:
          return "S.O.S. / FIRE";
        case 2:
          return "S.O.S. / MEDICAL";
        case 3:
          return "MECHANICAL / ROAD BLOCKED";
        case 4:
          return "MECHANICAL / ROAD NOT BLOCKED";
        default:
          return "SOS";
      }
    } else {
      return s.type === 0 ? "S.O.S" : "MECHANICAL";
    }
  };

  return (
    <Modal show={true} onHide={props.onHide} dialogClassName="sosDetailsModal">
      <Modal.Header
        className="bg-dark text-light border border-light"
        closeButton
      >
        <Modal.Title>S.O.S. Details</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light border border-light">
        <Container>
          <Table striped hover responsive variant="dark" className="m-0 p-0">
            <tbody>
              <tr>
                <td className="fw-bold">Participant:</td>
                <td>
                  {getParticipantIdNumber(BigInt(props.alert.participant))}{" "}
                </td>
                <td className="fw-bold">Location:</td>
                <td>
                  {props.alert.stage_id !== 0 &&
                    "STAGE " + getStageName(props.alert.stage_id) + " - "}
                  {props.alert.lat}, {props.alert.lon}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">SOS Time:</td>
                <td>
                  {millisToCurrentDate(
                    props.alert.time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
                <td className="fw-bold">SOS Type:</td>
                <td className="fw-bold text-warning">
                  {getSosTypeAsString(props.alert)}
                </td>
              </tr>
              <tr>
                <td className="fw-bold">SOS ACK:</td>
                <td>
                  {millisToCurrentDate(
                    props.alert.ack_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
                <td className="fw-bold">SOS End:</td>
                <td>
                  {millisToCurrentDate(
                    props.alert.end_time,
                    evOffsetMillis,
                    "TIME_DATE",
                    ", "
                  )}
                </td>
              </tr>
            </tbody>
          </Table>
        </Container>
        {logLines && (
          <LogViewer
            logLines={logLines}
            onHide={hideLog}
            size="250px"
            margin="my-3"
          />
        )}
      </Modal.Body>
      <Modal.Footer className="bg-dark text-light border border-light">
        <Button variant="secondary" onClick={props.onHide}>
          Close
        </Button>
        {props.alert.ack_time === 0 && (
          <Button variant="primary" onClick={sendAck}>
            Send ACKNOWLEDGEMENT
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default SosDetailsComponent;
