import { Fragment, useEffect, useRef, useState } from "react";
import React from "react";
import { Button, Row, Col, Form } from "react-bootstrap";
import Image from "next/image";
import { participant, country, stage } from "@prisma/client";
import {
  eventInfo,
  participantInfo,
  PPTrackerDataServerIoClient,
  rallyInfo,
} from "server/ppTrackerdataServerIoClient";
import PositionReplayDetailsComponent from "./positionReplayDetails";
import { apiPositionRecord } from "server/shared/socket_io_packets";

export interface pathDetails {
  color: string;
  showPath: boolean;
}

interface ParticipantReplayProps {
  ev: eventInfo | undefined;
  participant: participant | undefined;
  participantInfo: participantInfo | undefined;
  position: apiPositionRecord | undefined;
  countriesById: Map<number, country>;
  onHide: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCenter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onPathDetails: (pathDetails: pathDetails) => void;
  userIsAdmin?: boolean;
  rally: rallyInfo | undefined;
  ppTrackerClient: PPTrackerDataServerIoClient;
  pathDetails: pathDetails | undefined;
}

const ParticipantReplayDetails: React.FC<ParticipantReplayProps> = (props) => {
  const showPathReference = useRef<HTMLInputElement>(null);
  const pathColorReference = useRef<HTMLInputElement>(null);
  const [showPathValue, setShowPathValue] = useState<boolean>(false);
  const [pathColorValue, setPathColorValue] = useState<string>("#ffffff");

  useEffect(() => {
    console.log(
      ">> NEW PATH DETAILS FOR PARTICIPANT ",
      props.participantInfo?.number,
      " ??????",
      props.pathDetails
    );
    setShowPathValue(props.pathDetails ? props.pathDetails.showPath : false);
    setPathColorValue(props.pathDetails ? props.pathDetails.color : "#ffffff");
  }, [props.pathDetails, props.participantInfo]);

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

  const onPathChanged = () => {
    const newPathDetails = {
      showPath: showPathReference.current
        ? showPathReference.current.checked
        : false,
      color: pathColorReference.current
        ? pathColorReference.current.value
        : "#ffffff",
    };
    if (
      props.pathDetails === undefined ||
      (props.pathDetails &&
        (newPathDetails.showPath !== props.pathDetails.showPath ||
          newPathDetails.color !== props.pathDetails.color))
    ) {
      setShowPathValue(newPathDetails.showPath);
      setPathColorValue(newPathDetails.color);
      props.onPathDetails(newPathDetails);
    }
  };

  return (
    <Form>
      <input
        type="hidden"
        id="currentParticipantId"
        value={props.participant ? props.participant.id.toString() : "0"}
      ></input>
      <Row className="bg-secondary p-1 fw-bold">
        <Col className="pt-1">
          {participant?.is_officialcar
            ? participant?.driver_name
            : `Nr ${participant?.number}`}
        </Col>
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

      {participant && participant.is_officialcar === false && (
        <Fragment>
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
            <Col>
              {participant.vehicle}{" "}
              {participant.category.length > 0
                ? "(" + participant.category + ")"
                : ""}
            </Col>
          </Row>
          <Row>
            <hr className="p-0 my-2" />
          </Row>
        </Fragment>
      )}
      <Row className="mb-2">
        <Col className="co-auto">
          <Form.Check
            className="ms-2 mt-2"
            type="checkbox"
            label="Show path."
            checked={showPathValue}
            ref={showPathReference}
            onChange={onPathChanged}
          />
        </Col>
        <Col className="co-auto">
          <Form.Group className="my-0" controlId="pathColorInput">
            <Form.Label>Path Color:</Form.Label>

            <Form.Control
              size="sm"
              type="color"
              value={pathColorValue}
              title="Choose your color"
              ref={pathColorReference}
              onChange={onPathChanged}
            />
          </Form.Group>
        </Col>
      </Row>
      <PositionReplayDetailsComponent
        ev={props.ev}
        rally={props.rally}
        position={props.position}
        participant={props.participant}
        ppTrackerClient={props.ppTrackerClient}
      />
    </Form>
  );
};

export default ParticipantReplayDetails;
