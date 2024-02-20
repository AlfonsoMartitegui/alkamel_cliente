import React from "react";
import { Button, Row, Col } from "react-bootstrap";
import { AlertDetails } from "../../lib/data";

export interface StageData {
  name: string;
  shortName: string;
  distance: string;
  firstCarAt: string;
  type: string;
  leg: number;
  status: string;
  alerts: AlertDetails[];
}

interface StageProps {
  stage: StageData;
  rowNumber: number;
  showAdminTools: boolean;
}

const Layout: React.FC<StageProps> = (props) => {
  const stage = props.stage;

  return (
    <Row
      id={props.rowNumber.toString()}
      className={props.rowNumber % 2 == 0 ? "bg-black p-2" : "bg-secondary p-2"}
    >
      <Row className="m-0">
        <Col className="col-1 fw-bold mx-0 px-0 text-end">
          {stage.shortName}
        </Col>
        <Col className="px-2 ">{stage.name}</Col>
        <Col
          className={
            "col-4 fw-bold text-center p-1 " +
            (stage.status === "Running" ? "bg-info" : "bg-danger")
          }
        >
          {stage.status}
        </Col>
      </Row>
      <Row>
        <Col className="col-3 px-0 text-end">{stage.distance}</Col>
        <Col className="col-3 px-0 text-end">{stage.firstCarAt}</Col>
      </Row>
      {props.showAdminTools ? (
        <Row>
          <Col className="col-auto p-0 m-1">
            {stage.alerts.length > 0 ? (
              <Button variant="danger" className="btn-sm fw-bold">
                {stage.alerts.length} Alerts
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

export default Layout;
