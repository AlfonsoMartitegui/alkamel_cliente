import { Fragment } from "react";
import React from "react";
import { Button, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { participant } from "@prisma/client";
import {
  eventInfo,
  participantInfo,
  PPTrackerDataServerIoClient,
  rallyInfo,
} from "server/ppTrackerdataServerIoClient";
import PositionDetailsComponent from "./positionDetails";

interface OfficialCarProps {
  ev: eventInfo | undefined;
  officialCar: participant | undefined;
  participantInfo: participantInfo | undefined;
  onHide: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCenter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  rally: rallyInfo | undefined;
  userIsAdmin?: boolean;
  ppTrackerClient: PPTrackerDataServerIoClient;
}

const OfficialCarDetails: React.FC<OfficialCarProps> = (props) => {
  if (props.officialCar == undefined) return <Fragment></Fragment>;

  const officialCar: participant = props.officialCar;

  return (
    <Fragment>
      <input
        type="hidden"
        id="currentOfficialCarId"
        value={props.officialCar?.id.toString()}
      ></input>
      <Row className="bg-secondary p-1 fw-bold">
        <Col className="pt-1">{officialCar?.driver_name}</Col>
        <Col className="col-auto px-0">
          <Button
            variant="secondary-50"
            className="btn-sm pt-1 fw-bold"
            onClick={props.onCenter}
          >
            <Image
              src="/icons/center-map.svg"
              alt="Change Current Rally"
              height={20}
              width={20}
            />
          </Button>
        </Col>
        <Col className=" col-auto text-end pe-0 ps-1">
          <Button
            variant="secondary-50"
            className="btn-sm fw-bold"
            onClick={props.onHide}
          >
            HIDE
          </Button>
        </Col>
      </Row>
      <Row className="m-1"></Row>
      <PositionDetailsComponent
        ev={props.ev}
        rally={props.rally}
        participantInfo={props.participantInfo}
        participant={props.officialCar}
        userIsAdmin={props.userIsAdmin}
        ppTrackerClient={props.ppTrackerClient}
      />
    </Fragment>
  );
};

export default OfficialCarDetails;
