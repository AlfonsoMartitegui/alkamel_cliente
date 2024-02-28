import React, { useRef, useState } from "react";
import {
  participantInfo,
  PPTrackerDataServerIoClient,
} from "server/ppTrackerdataServerIoClient";
import { Col, Row, Button, Modal, Form } from "react-bootstrap";
import { messages, stage } from "@prisma/client";
import { apiLogResponse, logLine } from "server/shared/apiSharedTypes";
import { messageCommand } from "server/shared/socket_io_packets";
import LogViewer from "components/utils/logViewer";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
import superjson from "superjson";

interface sendMessageProps {
  rallyId: BigInt;
  stageId?: BigInt;
  participantId?: BigInt;
  participants: participantInfo[];
  stages: stage[];
  priority: string;
  ppTrackerClient: PPTrackerDataServerIoClient;
  onHide: () => void;
  messages: messages[];
}

interface autocompleteOption {
  value: string;
  label: string;
}

const SendMessageComponent: React.FC<sendMessageProps> = (props) => {
  const participantsById = new Map<BigInt, participantInfo>();
  const stagesMap = new Map<number, stage>();

  for (var p of props.participants) {
    participantsById.set(p.id, p);
  }
  for (var s of props.stages) {
    stagesMap.set(Number(s.id), s);
  }

  const [logLines, setLogLines] = useState<logLine[] | undefined>(undefined);

  // const messageText = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const messageHasResponse = useRef<HTMLInputElement>(null);
  const messageParticipants = useRef<HTMLSelectElement>(null);
  const messageOfficialCars = useRef<HTMLSelectElement>(null);
  const messageStage = useRef<HTMLSelectElement>(null);

  const sendMessage = () => {
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

    const cmd: messageCommand = {
      hasResponse: messageRequiresResponse
        ? messageRequiresResponse === 1
        : false,
      message: message ? message.trim() : "",
      participantsId: selectedParticipants,
      stageId: messageStage.current
        ? Number(messageStage.current.selectedOptions[0].value)
        : 0,
      priority:
        props.priority === "NORMAL" ||
        props.priority === "SOS" ||
        props.priority === "INFO"
          ? props.priority
          : "NORMAL",
      rallyId: Number(props.rallyId),
      type: "FREE",
    };

    setLogLines([
      {
        type: "INFO",
        message: "Waiting for server response...",
        idx: 1,
        time: new Date().getTime(),
      },
    ]);
    props.ppTrackerClient.setNewMessage(
      cmd,
      Number(props.rallyId),
      (response: apiLogResponse) => {
        setLogLines(response.log);
      }
    );
  };

  const hideLog = () => {
    setLogLines(undefined);
  };

  const handleNewMessageChange = (newValue: any, actionMeta: any) => {
    console.group("Value Changed");
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();

    if (newValue) {
      setMessage(newValue.value);
    }

    // Revisar si requires response y actualizar el checkbox
    const selectedMessage = props.messages
      ? props.messages.find((m) => m.message_text === newValue.value)
      : null;
    if (selectedMessage) {
      handleRequiresResponseChange(selectedMessage.response_type, {
        action: "selected a text",
      });
    }
  };

  const messageAutocompleteOptions = props.messages.map((m) => {
    return { value: m.message_text, label: m.message_text };
  });

  const [messageRequiresResponse, setMessageRequiresResponse] = useState(0);

  const handleRequiresResponseChange = (newValue: any, actionMeta: any) => {
    console.group("Value Changed");
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();

    console.log("Setting requires response to: ", newValue);
    setMessageRequiresResponse(newValue);
  };

  return (
    <Modal show={true} onHide={props.onHide} dialogClassName="sendMessageModal">
      <Modal.Header
        className="bg-dark text-light border border-light"
        closeButton
      >
        <Modal.Title>New Message</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light border border-light">
        <Form>
          {/* <Row>
            <Col>
              <Form.Group className="mb-3" controlId="mssText">
                <Form.Label>Message</Form.Label>
                <Form.Control
                  className="sm fw-bold"
                  type="input"
                  maxLength={148}
                  htmlSize={150}
                  placeholder="message text"
                  defaultValue={""}
                  ref={messageText}
                />
              </Form.Group>
            </Col>
          </Row> */}
          <Row>
            <Col>
              <Form.Group className="mb-3" controlId="mssText">
                <Form.Label>Message</Form.Label>
                <CreatableSelect
                  defaultValue={{ value: "", label: "message text" }}
                  options={messageAutocompleteOptions}
                  isClearable
                  isSearchable
                  onChange={handleNewMessageChange}
                  styles={{
                    menu: (base) => ({
                      ...base,
                      backgroundColor: "white", // Color de fondo del menú
                      color: "black", // Color del texto del menú
                    }),
                  }}
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Requires a YES/NO Response"
                  value={messageRequiresResponse}
                  checked={messageRequiresResponse === 1}
                  onChange={(e) => {
                    handleRequiresResponseChange(e.target.checked ? 1 : 0, {
                      action: "checkbox",
                    });
                  }}
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
              <Form.Group className="mb-3" controlId="mssText">
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
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Stage</Form.Label>
                <Form.Select ref={messageStage}>
                  <option value={0}>-</option>
                  {props.stages
                    .sort((a, b) => {
                      if (Number(a.idx) < Number(b.idx)) return -1;
                      else return 1;
                    })
                    .map((p) => (
                      <option key={Number(p.id)} value={Number(p.id)}>
                        {p.time_control + " - " + p.name}
                      </option>
                    ))}
                </Form.Select>
              </Form.Group>
              {/* <Form.Group className="mb-3">
                <Form.Check
                  type="checkbox"
                  label="Requires a YES/NO Response"
                  defaultChecked={true}
                  ref={messageHasResponse}
                />
              </Form.Group> */}
            </Col>
          </Row>
        </Form>
        {logLines && (
          <LogViewer logLines={logLines} onHide={hideLog} size="250px" />
        )}
      </Modal.Body>
      <Modal.Footer className="bg-dark text-light border border-light">
        <Button variant="secondary" onClick={props.onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={sendMessage}>
          Send Message
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SendMessageComponent;
