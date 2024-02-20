import { Fragment } from "react";
import React from "react";
import { Button, Row, Col, Form } from "react-bootstrap";
import Image from "next/image";
import { stage, stage_statuses } from "@prisma/client";
import { rallyInfo } from "server/ppTrackerdataServerIoClient";
import { useRef } from "react";
import { DefaultUser } from "next-auth";

interface StageProps {
  waypointRef: any;
  stage: stage | undefined;
  rally: rallyInfo | undefined;
  onHide: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onRedFlag: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onYellowFlag?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onNoFlag: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onStageClosed: (closed: number) => void;
  onStageStatus: (newStatus: number) => void;
  userIsAdmin?: boolean;
  user:
    | (DefaultUser & {
        id: string;
        role: string;
      })
    | null;
  stageStatuses: stage_statuses[];
}

const ParticipantDetails: React.FC<StageProps> = (props) => {
  const stageIsCloseRef = useRef<HTMLSelectElement>(null);
  //const stageStatusRef = useRef<HTMLSelectElement>(null);

  const stageClosedChange = () => {
    console.log(stageIsCloseRef.current?.value);
    const closed = stageIsCloseRef.current?.value;
    if (closed !== undefined) {
      props.onStageClosed(Number(closed));
    }
  };

  // const stageStatusChange = () => {
  //   console.log(stageStatusRef.current?.value);
  //   const newStatus = stageStatusRef.current?.value;
  //   if (newStatus !== undefined) {
  //     console.log(newStatus);
  //     props.onStageStatus(Number(newStatus));
  //   }
  // };

  const stage = props.stage;
  if (stage == undefined) return <Fragment></Fragment>;
  return (
    <Fragment>
      <input
        type="hidden"
        id="currentStageId"
        value={props.stage?.id.toString()}
      ></input>
      <Row className="bg-secondary p-1 fw-bold">
        <Col className="pt-1">STAGE {stage?.time_control}</Col>
        <Col className="col-auto px-0">
          <Button variant="secondary-50" className="btn-sm pt-1 fw-bold">
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

      {props.user && props.user.role === "rc_operator" && props.rally && (
        <Fragment>
          {/* <Row className="my-2">
            <Col className="col-auto">Status:</Col>
            <Col>
              <Form.Select
                size="sm"
                className="mb-2"
                id="stageStatus"
                ref={stageStatusRef}
                onChange={stageStatusChange}
              >
                {props.stageStatuses
                  .sort((a, b) => {
                    return a.id < b.id ? -1 : 1;
                  })
                  .map((s) => (
                    <option key={Number(s.id)} value={Number(s.id)}>
                      {s.name_en}
                    </option>
                  ))}
              </Form.Select>
            </Col>
          </Row> */}
          <Row className="my-2">
            <Col className="col-auto">Closed:</Col>
            <Col>
              <Form.Select
                size="sm"
                className="mb-2"
                id="stageClosed"
                ref={stageIsCloseRef}
                value={props.stage?.is_closed}
                onChange={stageClosedChange}
              >
                <option key={1} value={1}>
                  YES
                </option>
                <option key={0} value={0}>
                  NO
                </option>
              </Form.Select>
            </Col>
          </Row>
        </Fragment>
      )}

      <Row className="my-2">
        <Col className="col-auto">Distance:</Col>
        <Col>{stage.distance}</Col>
      </Row>

      <Row className="my-2">
        <Col className="col-auto">First Car At:</Col>
        <Col>{stage.first_car_at}</Col>
      </Row>
      <Row>
        <hr className="p-0 my-2" />
      </Row>

      {props.user &&
      props.user.role === "rc_operator" &&
      props.rally &&
      props.rally.allow_red_flag &&
      (Number(stage.stage_type_id) === 2 ||
        Number(stage.stage_type_id) === 4) ? (
        <Fragment>
          <Row>
            <Col>
              Set Flag At:
              <Form.Select
                size="sm"
                className="mb-2"
                id="stageWaypoint"
                ref={props.waypointRef}
              >
                {props.rally?.waypoints
                  .filter((w) => w.track_id === props.stage?.track_id)
                  .map((w) => (
                    <option key={Number(w.id)} value={Number(w.id)}>
                      {w.name}
                    </option>
                  ))}
              </Form.Select>
            </Col>
          </Row>
          <Row className="ms-1">
            <Col className="col-auto p-0 m-1">
              <Button
                variant="danger"
                className="btn-sm fw-bold"
                id={"red-" + props.stage?.id.toString()}
                onClick={props.onRedFlag}
              >
                RED FLAG
              </Button>
            </Col>
            {/*<Col className="col-auto p-0 m-1">
         <Button
            variant="warning"
            id={"yellow-" + props.stage?.id.toString()}
            className="btn-sm fw-bold"
            onClick={props.onYellowFlag}
          >
            YELLOW FLAG
          </Button>
        </Col>*/}
            <Col className="col-auto p-0 m-1">
              <Button
                variant="light"
                id={"yellow-" + props.stage?.id.toString()}
                className="btn-sm fw-bold"
                onClick={props.onNoFlag}
              >
                NO FLAG
              </Button>
            </Col>
          </Row>
          <Row>
            <hr className="p-0 my-2" />
          </Row>
        </Fragment>
      ) : (
        ""
      )}
      {/*<Row className="ms-1">
        <Col className="col-auto p-0 m-1">
          stage.alerts.length > 0 ? (
            <Button variant="info" className="btn-sm fw-bold">
              {stage.alerts.length} Alerts
            </Button>
          ) : (
            ""
          )
        </Col>
        <Col className="col-auto p-0 m-1">
          <Button variant="light" className="btn-sm fw-bold">
            Set Status
          </Button>
        </Col>
        <Col className="col-auto p-0 m-1">
          <Button variant="light" className="btn-sm fw-bold">
            New Message
          </Button>
        </Col>
      </Row>
      <Row>
        <hr className="p-0 my-2" />
      </Row>
      <Row className="bg-light p-0 fw-bold">
        <Col className="pt-1 bg-light text-secondary">To Run</Col>
      </Row>
      <Row>
        <Col className="p-0 m-1 text-start col-auto">
          <Button variant="link" className="fw-bold py-0 px-0 my-0 ms-1 me-0">
            75
          </Button>
        </Col>
        <Col className="p-0 m-1 text-start col-auto">
          <Button variant="link" className="fw-bold py-0 px-0 my-0 ms-1 me-0">
            69
          </Button>
        </Col>
        <Col className="p-0 m-1 text-start col-auto">
          <Button variant="link" className="fw-bold py-0 px-0 my-0 ms-1 me-0">
            15
          </Button>
        </Col>
      </Row>
      <Row className="bg-light p-0 fw-bold">
        <Col className="pt-1 bg-light text-secondary">Running</Col>
      </Row>
      <Row>
        <Col className="p-0 m-1 text-start col-auto">
          <Button variant="link" className="fw-bold py-0 px-0 my-0 ms-1 me-0">
            1
          </Button>
        </Col>
        <Col className="p-0 m-1 text-start col-auto">
          <Button variant="danger" className="fw-bold py-0 px-1 my-0 ms-1 me-0">
            33
          </Button>
        </Col>
        <Col className="p-0 m-1 text-start col-auto">
          <Button variant="link" className="fw-bold py-0 px-0 my-0 ms-1 me-0">
            12
          </Button>
        </Col>
      </Row>
      <Row className="bg-light p-0 fw-bold">
        <Col className="pt-1 bg-light text-secondary">Finished</Col>
      </Row>
      <Row>
        <Col className="p-0 m-1 text-start col-auto">
          <Button variant="link" className="fw-bold py-0 px-0 my-0 ms-1 me-0">
            11
          </Button>
        </Col>
        <Col className="p-0 m-1 text-start col-auto">
          <Button variant="link" className="fw-bold py-0 px-0 my-0 ms-1 me-0">
            6
          </Button>
        </Col>
      </Row>
      <Row>
        <hr className="p-0 my-2" />
      </Row>*/}
    </Fragment>
  );
};

export default ParticipantDetails;
