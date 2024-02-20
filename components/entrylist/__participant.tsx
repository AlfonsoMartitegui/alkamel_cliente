//import { Fragment } from "react";
import React from "react";
//import { Button, Form, Container, Row, Col } from "react-bootstrap";
import { Button, Row, Col } from "react-bootstrap";
import Image from "next/image";

export interface ParticipantData {
  number: string;
  driver: string;
  driverCountry: string;
  codriver: string;
  codriverCountry: string;
  vehicle: string;
  lat: number;
  lng: number;
  status: string;
  alerts: AlertDetails[];
}

export interface AlertDetails {
  date: string;
  message: string;
  stage: string;
}

interface ParticipantProps {
  participant: ParticipantData;
  rowNumber: number;
  showAdminTools: boolean;
}

const LayoutParticipant: React.FC<ParticipantProps> = (props) => {
  const participant = props.participant;

  return (
    <Row
      id={participant.number}
      className={props.rowNumber % 2 == 0 ? "bg-black p-2" : "bg-secondary p-2"}
    >
      <Row>
        <Col className="col-1 mx-0 px-0 text-end">{participant.number}</Col>
        <Col>
          <Row>
            <Col className="col-auto pl-0 ml-0">
              <Image
                src={`/img/${participant.driverCountry}.gif`}
                alt={participant.driverCountry}
                width={16}
                height={11}
                layout="fixed"
              />
            </Col>
            <Col className="px-0 fw-bold">{participant.driver}</Col>
            <Col className="col-auto pl-0 ml-0">
              <Image
                src={`/flags/4x3/${participant.codriverCountry.toLowerCase()}.svg`}
                alt={participant.codriverCountry}
                width={16}
                height={11}
                layout="fixed"
              />
            </Col>
            <Col className="px-0 fw-bold">{participant.codriver}</Col>
          </Row>
          <Row>
            <Col>{participant.vehicle}</Col>
            <Col
              className={
                "col-3 fw-bold text-center " +
                (participant.status === "Running" ? "bg-info" : "bg-danger")
              }
            >
              {participant.status}
            </Col>
          </Row>
        </Col>
      </Row>
      {props.showAdminTools ? (
        <Row>
          <Col className="col-auto p-0 m-1">
            {participant.alerts.length > 0 ? (
              <Button variant="danger" className="btn-sm fw-bold">
                {participant.alerts.length} Alerts
              </Button>
            ) : (
              ""
            )}
          </Col>
          <Col className="col-auto p-0 m-1">
            <Button variant="light" className="btn-sm fw-bold">
              Set Status
            </Button>
          </Col>
          <Col className="col-auto p-0 m-1">
            <Button variant="light" className="btn-sm fw-bold">
              Message
            </Button>
          </Col>
        </Row>
      ) : (
        ""
      )}
    </Row>
  );
};

export default LayoutParticipant;
