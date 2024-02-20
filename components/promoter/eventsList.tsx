import { Fragment } from "react";
import React from "react";
import { Row, Col } from "react-bootstrap";
import { promoter, event } from "@prisma/client";
import Link from "next/link";

interface PromoterEventsListProps {
  promoter: promoter | undefined;
  events: event[] | undefined;
  showActive: boolean;
  showNoActive: boolean;
  title: string;
}

const PromoterEventList: React.FC<PromoterEventsListProps> = (props) => {
  return (
    <Fragment>
      <Row>
        <Col className="col-auto ml-0 pt-2">{props.title}</Col>
      </Row>

      {props.events &&
        props.events
          .sort((a, b) => {
            if (a.start_date < b.start_date) return -1;
            else return 1;
          })
          .filter(
            (p) =>
              (props.showActive && p.active === 1) ||
              (props.showNoActive && p.active === 0)
          )
          .map((p) => (
            <Row key={Number(p.id)} className="p-0 m-1 text-start">
              <Col>
                <Link href={"/events/" + p.slug}>{p.name}</Link>
              </Col>
            </Row>
          ))}
    </Fragment>
  );
};

export default PromoterEventList;
