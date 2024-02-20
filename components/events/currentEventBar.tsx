import { Fragment } from "react";
import React from "react";
import { Button, Row, Col } from "react-bootstrap";
import Image from "next/image";
import { eventInfo, rallyInfo } from "../../server/ppTrackerdataServerIoClient";
import { DefaultUser } from "next-auth";

interface EventBarProps {
  event: eventInfo | undefined;
  rally: rallyInfo | undefined;
  showOfficialCarButton?: boolean;
  onShowOfficalCarBarButton?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showItineraryButton?: boolean;
  onShowItineraryButton?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showEntryListButton?: boolean;
  onShowEntryListButton?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showAlertsButton?: boolean;
  onShowAlertsButton?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  showChangeRallyButton?: boolean;
  onChangeRallyClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onNewMessageClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  userIsAdmin: boolean;
  noAlerts?: boolean;
  noNewMessage?: boolean;
  noOfficialCars?: boolean;
  noItinerary?: boolean;
  noEntryList?: boolean;
  user:
    | (DefaultUser & {
        id: string;
        role: string;
      })
    | null;
}

const CurrentEventBar: React.FC<EventBarProps> = (props) => {
  return (
    <Fragment>
      <Row>
        <Col className="col-auto ml-3">
          <h4 className="fw-bold">{props.event?.name}</h4>
        </Col>
        {(props.noItinerary === undefined || props.noItinerary === false) && (
          <Col className="p-0 m-1 text-end">
            <Button
              variant={props.showItineraryButton ? "warning" : "link"}
              className="btn-sm fw-bold"
              onClick={props.onShowItineraryButton}
            >
              Itinerary
            </Button>
          </Col>
        )}
        {(props.noEntryList === undefined || props.noEntryList === false) && (
          <Col className="p-0 m-1 col-auto">
            <Button
              variant={props.showEntryListButton ? "warning" : "link"}
              className="btn-sm fw-bold"
              onClick={props.onShowEntryListButton}
            >
              Entry List
            </Button>
          </Col>
        )}
        {props.userIsAdmin &&
          (props.noAlerts === undefined || props.noAlerts === false) && (
            <Col className="p-0 m-1 col-auto">
              <Button
                variant={props.showAlertsButton ? "warning" : "link"}
                className="btn-sm fw-bold"
                onClick={props.onShowAlertsButton}
              >
                Alerts
              </Button>
            </Col>
          )}
        {props.userIsAdmin &&
          (props.noOfficialCars === undefined ||
            props.noOfficialCars === false) && (
            <Col className="p-0 m-1 col-auto">
              <Button
                variant={props.showOfficialCarButton ? "warning" : "link"}
                className="btn-sm fw-bold"
                onClick={props.onShowOfficalCarBarButton}
              >
                Official Cars
              </Button>
            </Col>
          )}
        {props.user &&
          props.user.role === "rc_operator" &&
          (props.noNewMessage === undefined ||
            props.noNewMessage === false) && (
            <Col className="p-0 m-1 text-start">
              <Button
                variant={"link"}
                className="btn-sm fw-bold"
                onClick={props.onNewMessageClick}
              >
                New Message
              </Button>
            </Col>
          )}
        {props.showChangeRallyButton &&
        props.event &&
        props.event.rallies.length > 1 ? (
          <Col className="col-auto mr-4 ml-2">
            <h4>
              <span className="fs-5 text-white-50">Rally: </span>
              {props.rally !== undefined ? props.rally.name : ""}
            </h4>
          </Col>
        ) : (
          ""
        )}
        {props.showChangeRallyButton &&
        props.event &&
        props.event.rallies.length > 1 ? (
          <Col className="col-auto p-0 m-1">
            <Button
              variant="primary"
              className="btn-sm fw-bold"
              onClick={props.onChangeRallyClick}
            >
              <Image
                src="/icons/reload-icon.svg"
                alt="Change Current Rally"
                height={15}
                width={15}
              />
            </Button>
          </Col>
        ) : (
          ""
        )}
      </Row>
      <Row>
        <hr className="p-0 m-0" />
      </Row>
    </Fragment>
  );
};

export default CurrentEventBar;
