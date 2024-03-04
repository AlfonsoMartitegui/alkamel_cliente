import { Fragment } from "react";
import React from "react";
import { Button, Row, Col } from "react-bootstrap";
import {
  getParticipantBackgroundColor,
  getParticipantBorderColor,
  getParticipantStatus,
  getParticipantTextColor,
  participantInfo,
  participantStatus,
  rallyInfo,
} from "../../server/ppTrackerdataServerIoClient";
import { stage } from "@prisma/client";
import type { DefaultUser } from "next-auth";

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
  hasPendingAlerts: boolean;
  alerts: AlertDetails[];
}

export interface AlertDetails {
  date: string;
  message: string;
  stage: string;
  participantNumber: string;
}

interface EntryListBarProps {
  rally: rallyInfo | undefined;
  participants: participantInfo[];
  onParticipantClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  user:
    | (DefaultUser & {
        id: string;
        role: string;
      })
    | undefined;
}

const EntryListBar: React.FC<EntryListBarProps> = (props) => {
  let rallyStages = new Map<bigint, stage>();
  if (props.rally) {
    for (var st of props.rally?.stages) {
      rallyStages.set(st.id, st);
    }
  }

  return (
    <Fragment>
      <Row>
        <Col className="col-auto ml-4 mt-1">
          <h5 className="text-white-50 fw-bold">ENTRY LIST:</h5>
        </Col>

        <Col className="p-0 m-1 text-start">
          {props.participants
            .sort((a, b) => {
              if (Number(a.number) < Number(b.number)) return -1;
              else return 1;
            })
            .filter((p) => p.is_officialcar === false)
            .map((p) => (
              <Button
                key={p.number}
                id={p.number}
                className="fw-bold py-0 px-1 mt-0 mb-1 ms-1 me-0"
                style={{
                  backgroundColor: getParticipantBackgroundColor(
                    p,
                    rallyStages,
                    props.user
                  ),
                  color: getParticipantTextColor(p, rallyStages, props.user),
                  border:
                    "2px solid " +
                    getParticipantBorderColor(p, rallyStages, props.user), // Cambia el color y el ancho del borde
                }}
                onClick={props.onParticipantClick}
              >
                {p.number}
              </Button>
            ))}
        </Col>
      </Row>
      <Row>
        <hr className="p-0 m-0" />
      </Row>
    </Fragment>
  );
};

export default EntryListBar;
