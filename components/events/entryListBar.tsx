import { Fragment } from "react";
import React from "react";
import { Button, Row, Col } from "react-bootstrap";
import {
  getParticipantStatus,
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

const getParticipantStatusVariant = (
  p: participantInfo,
  stages: Map<bigint, stage>,
  user:
    | (DefaultUser & {
        id: string;
        role: string;
      })
    | undefined
) => {
  const st = getParticipantStatus(p, stages, user);
  switch (st) {
    case participantStatus.transport_disconnected:
      return "secondary text-warning";
    case participantStatus.transport_moving:
      return "dark text-light border border-light";

    case participantStatus.transport_stopped:
      return "secondary";

    case participantStatus.stage_moving:
      return "light";

    case participantStatus.stage_stopped:
      return "warning";

    case participantStatus.stage_stopped_warning:
      return "light text-warninig";

    case participantStatus.stage_sos:
      return "danger";

    case participantStatus.stage_sos_viewer:
      return "light";

    case participantStatus.stage_sos_ok:
      return "success";

    case participantStatus.stage_sos_ok_viewer:
      return "light";

    case participantStatus.unknown:
      return "secondary text-dark";
  }
  return "secondary";
};

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
                variant={getParticipantStatusVariant(
                  p,
                  rallyStages,
                  props.user
                )}
                className="fw-bold py-0 px-1 mt-0 mb-1 ms-1 me-0"
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
