import { Fragment } from "react";
import React from "react";
import { Button, Row, Col } from "react-bootstrap";
import { rallyInfo } from "../../server/ppTrackerdataServerIoClient";

interface OfficialCarsBarProps {
  rally: rallyInfo | undefined;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const OfficialCarsBar: React.FC<OfficialCarsBarProps> = (props) => {
  return (
    <Fragment>
      <Row>
        <Col className="col-auto ml-4 mt-1">
          <h5 className="text-white-50 fw-bold">OFFICAL CARS:</h5>
        </Col>

        <Col className="p-0 m-1 text-start">
          {props.rally?.participants
            .filter((p) => p.is_officialcar === true)
            .map((p) => (
              <Button
                key={p.number}
                id={p.number}
                variant="info"
                className="fw-bold py-0 px-1 my-0 ms-1 me-0"
                onClick={props.onClick}
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

export default OfficialCarsBar;
