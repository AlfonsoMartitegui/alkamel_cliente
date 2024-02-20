import React, { useEffect, useRef, useState } from "react";
import {
  eventInfo,
  participantInfo,
  PPTrackerDataServerIoClient,
} from "server/ppTrackerdataServerIoClient";
import { Col, Row, Button, Modal, Form } from "react-bootstrap";
import { stage } from "@prisma/client";
import { logLine } from "server/shared/apiSharedTypes";
import {
  apiPositionRecord,
  positionRecordsRequestQuery,
} from "server/shared/socket_io_packets";
import LogViewer from "components/utils/logViewer";
import { millisToInputDateTime } from "server/shared/utils";

interface queryProps {
  query: positionRecordsRequestQuery | undefined;
  onRequestData: (
    data: apiPositionRecord[],
    query: positionRecordsRequestQuery
  ) => void;
  rallyId: BigInt;
  participants: participantInfo[];
  stages: stage[];
  ppTrackerClient: PPTrackerDataServerIoClient;
  ev: eventInfo | undefined;
  onHide: () => void;
}

const RequestQueryFormComponent: React.FC<queryProps> = (props) => {
  const participantsById = new Map<BigInt, participantInfo>();
  const stagesMap = new Map<number, stage>();

  for (var p of props.participants) {
    participantsById.set(p.id, p);
  }
  for (var s of props.stages) {
    stagesMap.set(Number(s.id), s);
  }

  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [logLines, setLogLines] = useState<logLine[] | undefined>(undefined);
  const messageParticipants = useRef<HTMLSelectElement>(null);
  const messageOfficialCars = useRef<HTMLSelectElement>(null);
  const startDate = useRef<HTMLInputElement>(null);
  const endDate = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let offsetMillis = props.ev ? props.ev.offsetGMT * 60 * 60 * 1000 : 0;
    if (props.query === undefined) {
      const millis = new Date().getTime();
      setStart(millisToInputDateTime(millis, offsetMillis));
      setEnd(millisToInputDateTime(millis, offsetMillis));
    } else {
      setStart(millisToInputDateTime(props.query.startTime, offsetMillis));
      setEnd(millisToInputDateTime(props.query.endTime, offsetMillis));
    }
  }, [props.query, props.ev]);

  const requestData = () => {
    let selectedParticipants: number[] = [];
    if (messageOfficialCars.current) {
      for (
        let i = 0;
        i < messageOfficialCars.current.selectedOptions.length;
        i++
      ) {
        selectedParticipants.push(
          Number(messageOfficialCars.current.selectedOptions[i].value)
        );
      }
    }
    if (messageParticipants.current) {
      for (
        let i = 0;
        i < messageParticipants.current.selectedOptions.length;
        i++
      ) {
        selectedParticipants.push(
          Number(messageParticipants.current.selectedOptions[i].value)
        );
      }
    }

    let startDateMillis = 0;
    let endDateMillis = 0;

    if (startDate.current && endDate.current) {
      const d = new Date(startDate.current.value);
      startDateMillis = d.getTime();
      const eD = new Date(endDate.current.value);
      endDateMillis = eD.getTime();
    }

    if (startDateMillis === 0 || endDateMillis === 0) {
      //TODO: generate error, invalid dates.
    }

    const query: positionRecordsRequestQuery = {
      rallyId: Number(props.rallyId),
      startTime: startDateMillis,
      endTime: endDateMillis,
      participants: selectedParticipants,
    };

    setLogLines([
      {
        type: "INFO",
        message: "Waiting for server response...",
        idx: 1,
        time: new Date().getTime(),
      },
    ]);

    props.ppTrackerClient.getReplayData(
      query,
      (data: apiPositionRecord[], error?: unknown) => {
        if (error) {
          setLogLines([
            {
              type: "ERROR",
              idx: 1,
              time: new Date().getTime(),
              message:
                typeof error === "string"
                  ? error
                  : error instanceof Error
                  ? error.message + " " + (error.stack ? error.stack : "")
                  : "Unknow error.",
            },
          ]);
        } else {
          let logLines: logLine[] = [];
          logLines.push({
            type: data.length > 0 ? "SUCCESS" : "WARNING",
            message:
              data.length > 0
                ? `${data.length} record found.`
                : "No Records Found.",
            idx: 1,
            time: new Date().getTime(),
          });

          if (data.length > 0) {
            logLines.push({
              type: "INFO",
              message: "CLOSE THIS WINDOW TO START THE REPLAY¨.",
              idx: 2,
              time: new Date().getTime(),
            });
          }
          setLogLines(logLines);
          if (data.length > 0) {
            props.onRequestData(data, query);
          }
        }
      }
    );
  };

  const hideLog = () => {
    setLogLines(undefined);
  };

  return (
    <Modal show={true} onHide={props.onHide} dialogClassName="sendMessageModal">
      <Modal.Header
        className="bg-dark text-light border border-light"
        closeButton
      >
        <Modal.Title>GET REPLAY DATA</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light border border-light">
        <Form>
          <Row>
            <Col>
              <Form.Group className="mb-3" controlId="startDateInput">
                <Form.Label>Start Date</Form.Label>
                <Form.Control
                  className="sm fw-bold"
                  type="datetime-local"
                  placeholder="Rally Start Date"
                  defaultValue={start}
                  ref={startDate}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3" controlId="endDateInput">
                <Form.Label>End Date</Form.Label>
                <Form.Control
                  className="sm fw-bold"
                  type="datetime-local"
                  placeholder="Rally End Date"
                  defaultValue={end}
                  ref={endDate}
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Participants</Form.Label>
                <Form.Select
                  multiple={true}
                  htmlSize={10}
                  ref={messageParticipants}
                >
                  {props.participants
                    .sort((a, b) => {
                      if (Number(a.number) < Number(b.number)) return -1;
                      else return 1;
                    })
                    .filter((p) => p.is_officialcar === false)
                    .map((p) => (
                      <option key={Number(p.id)} value={Number(p.id)}>
                        {p.number}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3" controlId="officialCarsSelect">
                <Form.Label>Official Cars</Form.Label>
                <Form.Select
                  multiple={true}
                  htmlSize={10}
                  ref={messageOfficialCars}
                >
                  {props.participants
                    .sort((a, b) => {
                      if (Number(a.number) < Number(b.number)) return -1;
                      else return 1;
                    })
                    .filter((p) => p.is_officialcar === true)
                    .map((p) => (
                      <option key={Number(p.id)} value={Number(p.id)}>
                        {p.driver_name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Form>
        {logLines && (
          <LogViewer
            logLines={logLines}
            logLinesLength={logLines ? logLines.length : 0}
            onHide={hideLog}
            size="250px"
          />
        )}
      </Modal.Body>
      <Modal.Footer className="bg-dark text-light border border-light">
        <Button variant="secondary" onClick={props.onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={requestData}>
          Get Replay Data
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RequestQueryFormComponent;
