import { Fragment } from "react";
import React from "react";
import { Button, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { participant, country, stage } from "@prisma/client";
import {
  eventInfo,
  participantInfo,
  PPTrackerDataServerIoClient,
  rallyInfo,
} from "server/ppTrackerdataServerIoClient";
import PositionDetailsComponent from "./positionDetails";

interface ParticipantProps {
  ev: eventInfo | undefined;
  participant: participant | undefined;
  participantInfo: participantInfo | undefined;
  countriesById: Map<number, country>;
  onHide: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCenter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  userIsAdmin?: boolean;
  rally: rallyInfo | undefined;
  ppTrackerClient: PPTrackerDataServerIoClient;
}

const ParticipantDetails: React.FC<ParticipantProps> = (props) => {
  if (props.participant == undefined) return <Fragment></Fragment>;

  const stagesById = new Map<bigint, stage>();
  if (props.rally !== undefined) {
    for (var s of props.rally.stages) {
      stagesById.set(s.id, s);
    }
  }

  const participant: participant = props.participant;
  const driverCountry = props.countriesById.has(
    Number(props.participant.driver_country_id)
  )
    ? props.countriesById.get(Number(participant.driver_country_id))
    : undefined;
  const codriverCountry = props.countriesById.has(
    Number(participant.codriver_country_id)
  )
    ? props.countriesById.get(Number(participant.codriver_country_id))
    : undefined;

  return (
    <Fragment>
      <input
        type="hidden"
        id="currentParticipantId"
        value={props.participant?.id.toString()}
      ></input>
      <Row className="bg-secondary p-1 fw-bold">
        <Col className="pt-1">Nr {participant?.number}</Col>
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

      <Row>
        <Col className="col-auto pl-0 ml-0">
          <Image
            src={`/flags/4x3/${driverCountry?.iso_alpha2_code.toLowerCase()}.svg`}
            alt={driverCountry?.name_en}
            width={16}
            height={11}
            layout="fixed"
          />
        </Col>
        <Col className="px-0 fw-bold">
          {participant.driver_name + " " + participant.driver_surname}
        </Col>
      </Row>
      <Row>
        <Col className="col-auto pl-0 ml-0">
          <Image
            src={`/flags/4x3/${codriverCountry?.iso_alpha2_code.toLowerCase()}.svg`}
            alt={codriverCountry?.name_en}
            width={16}
            height={11}
            layout="fixed"
          />
        </Col>
        <Col className="px-0 fw-bold">
          {participant.codriver_name + " " + participant.codriver_surname}
        </Col>
      </Row>
      <Row>
        <Col>{participant.vehicle}</Col>
      </Row>
      <Row>
        <Col>{participant.category}</Col>
      </Row>

      <Row>
        <hr className="p-0 my-2" />
      </Row>
      <PositionDetailsComponent
        ev={props.ev}
        rally={props.rally}
        participantInfo={props.participantInfo}
        participant={props.participant}
        userIsAdmin={props.userIsAdmin}
        ppTrackerClient={props.ppTrackerClient}
      />
    </Fragment>
  );
};

export default ParticipantDetails;
