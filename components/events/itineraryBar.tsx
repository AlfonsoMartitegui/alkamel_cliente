import { Fragment } from "react";
import React from "react";
import { Button, Row, Col } from "react-bootstrap";
import { rallyInfo } from "../../server/ppTrackerdataServerIoClient";
import { stage } from "@prisma/client";

interface ItineraryBarProps {
  rally: rallyInfo | undefined;
  onStageClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const getButtonColorForStage = (p: stage) => {
  // if (p.) {
  //   return "danger";
  // }
  // return p.alerts.length > 0 ? "warning" : "info";

  switch (Number(p.stage_type_id)) {
    case 2: //STAGE
      return "info";
    case 1: // TRANSPORT
      return "warninig";
    case 4: // SHAKEDOWN
      return "info";
    default: //UNKOWN
      return "danger";
  }
};

const ItineraryBar: React.FC<ItineraryBarProps> = (props) => {
  //console.log(props.rally?.stages);
  return (
    <Fragment>
      <Row>
        <Col className="col-auto ml-4 mt-1">
          <h5 className="text-white-50 fw-bold">ITINERARY:</h5>
        </Col>

        <Col className="p-0 m-1 text-start">
          {props.rally?.stages
            .filter((i) => i.track_id !== null)
            .map((s) =>
              Number(s.stage_type_id) !== 3 ? (
                <Button
                  key={s.id.toString()}
                  id={s.id.toString()}
                  variant={getButtonColorForStage(s)}
                  className="fw-bold py-0 px-1 mt-0 mb-1 ms-1 me-0"
                  onClick={props.onStageClick}
                >
                  {s.time_control}
                </Button>
              ) : (
                ""
              )
            )}
        </Col>
      </Row>
      <Row>
        <hr className="p-0 m-0" />
      </Row>
    </Fragment>
  );
};

export default ItineraryBar;
