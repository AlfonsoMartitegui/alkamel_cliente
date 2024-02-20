import { Fragment } from "react";
import React from "react";
import { Row, Col } from "react-bootstrap";

import { promoter } from "@prisma/client";

interface PromoterBarProps {
  promoter: promoter | undefined;
}

const PromoterBar: React.FC<PromoterBarProps> = (props) => {
  return (
    <Fragment>
      <Row>
        <Col className="col-auto ml-0 pt-2">Promoter:</Col>
        <Col className="col-auto ml-3 px-0 pt-1">
          <h4 className="fw-bold">{props.promoter?.name}</h4>
        </Col>

        <Col className="col p-0 m-1 pe-2 text-end"></Col>
      </Row>
      <Row>
        <hr className="p-0 m-0" />
      </Row>
    </Fragment>
  );
};

export default PromoterBar;
