import React from "react";
import { Row, Col } from "react-bootstrap";

export interface LegData {
  day: number;
  date: string;
  number: number;
}

interface LegProps {
  leg: LegData;
  rowNumber: number;
}

const Layout: React.FC<LegProps> = (props) => {
  const leg = props.leg;

  return (
    <Row id={props.rowNumber.toString()} className="bg-light p-2 mb-2">
      <Col className="col mx-0 px-0 fw-bold text-primary">Leg {leg.number}</Col>
      <Col className="col-2 px-0 text-end text-secondary">{leg.date}</Col>
    </Row>
  );
};

export default Layout;
