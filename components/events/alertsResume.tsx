import { Fragment, useEffect } from "react";
import React from "react";
import { Button, Row, Col, Table, Container } from "react-bootstrap";
import {
  apiBlueFlag,
  apiIncidence,
  apiMessage,
  apiSosAlertMerge,
  flagAlert,
  rallyAlert,
} from "server/shared/socket_io_packets";
import {
  eventInfo,
  participantInfo,
  PPTrackerDataServerIoClient,
} from "server/ppTrackerdataServerIoClient";
import SosAlertComponent from "./alerts/sosAlertComponent";
import FlagAlertComponent from "./alerts/flagAlertComponent";
import { stage } from "@prisma/client";
import IncidenceComponent from "./alerts/incidenceComponent";
import MessageComponent from "./alerts/messageComponent";
import BlueFlagComponent from "./alerts/blueFlagComponent";
import FiltersComponent from "./alerts/filtersComponent";

interface AlertResumeProps {
  event: eventInfo | undefined;
  alerts: rallyAlert[];
  participants: participantInfo[];
  stages: stage[];
  maxHeight: number;
  ppTrackerClient: PPTrackerDataServerIoClient;
  onCenterMapOnParticipant?: (participantId: number) => void;
}

export interface AlertFilter {
  showSOS: boolean;
  showMessages: boolean;
  showIncidences: boolean;
  showBlueFlags: boolean;
  showFlagAlerts: boolean;
}

const AlertsResume: React.FC<AlertResumeProps> = (props) => {
  useEffect(() => {
    console.log(
      ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> NEW ALERTS <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<",
      props.alerts.length
    );
  }, [props.alerts]);
  const [showFilters, setShowFilters] = React.useState<boolean>(false);
  const onShowFilters = () => {
    setShowFilters(!showFilters);
  };
  const onHideFilters = () => {
    setShowFilters(false);
  };

  const onFiltersChange = (filters: AlertFilter) => {
    setAlertFilters(filters);
  };

  const participantsById = new Map<BigInt, participantInfo>();

  for (var p of props.participants) {
    participantsById.set(p.id, p);
  }

  const onDetails = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("ONDETAILS!!!");
    if (e.currentTarget.getAttribute("id")) {
      const sId = e.currentTarget.getAttribute("id")?.substring(6);
      console.log("Show details for...", sId);
    }
  };

  const tableStyle = { height: (props.maxHeight - 50).toString() + "px" };

  const onCenterMapOnParticipant = (participantId: number) => {
    if (props.onCenterMapOnParticipant) {
      props.onCenterMapOnParticipant(participantId);
    }
  };

  const setInitialAlertFilters = () => {
    return {
      showIncidences: true,
      showSOS: true,
      showMessages: true,
      showBlueFlags: true,
      showFlagAlerts: true,
    };
  };
  const [alertFilters, setAlertFilters] = React.useState<AlertFilter>(
    setInitialAlertFilters()
  );
  // const showAlertYesOrNo = (alert: rallyAlert) => {
  //   return true;
  //   if (alertFilters.showIncidences && isIncidenceAlert(alert)) {
  //     return true;
  //   } else if (alertFilters.showSOS && isSosAlert(alert)) {
  //     return true;
  //   } else if (alertFilters.showFlagAlerts && isFlagAlert(alert)) {
  //     return true;
  //   } else if (alertFilters.showBlueFlags && isBlueFlagAlert(alert)) {
  //     return true;
  //   } else if (alertFilters.showMessages && isMessageAlert(alert)) {
  //     return true;
  //   } else return true;
  // };

  return (
    <Fragment>
      <Row id="alertsTitle" className="bg-secondary p-1 fw-bold mx-0 px-0">
        <Col className="pt-1 mt-2 fs-5">ALERTS RESUME</Col>
        <Col className=" col-auto text-end pe-0 ps-1">
          <Button
            variant="secondary-50"
            className="btn-sm fw-bold"
            onClick={onShowFilters}
          >
            FILTERS
          </Button>
        </Col>
      </Row>
      <Container
        id="alertsContainer"
        style={tableStyle}
        className="overflow-auto px-0"
      >
        <Table
          striped
          bordered
          hover
          responsive
          variant="dark"
          className="m-0 p-0"
        >
          <thead>
            <tr>
              <th>Type</th>
              <th>Nr</th>
              <th>Time</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {props.alerts
              .sort((a, b) => {
                if (a.time === b.time) {
                  if (a.alertType < b.alertType) return 1;
                  else if (a.alertType === 3 && b.alertType === 3) {
                    const iA = a.alert as apiIncidence;
                    const iB = b.alert as apiIncidence;
                    return iA.pptrackerId < iB.pptrackerId ? 1 : -1;
                  } else if (a.alertType === 4 && b.alertType === 4) {
                    const msgA = a.alert as apiMessage;
                    const msgB = b.alert as apiMessage;
                    return msgA.participant < msgB.participant ? 1 : -1;
                  } else return -1;
                } else {
                  if (a.time < b.time) return 1;
                  else return -1;
                }
              })
              .map((p, index) => (
                <Fragment key={index}>
                  {p.alertType === 1 && (
                    <SosAlertComponent
                      alert={p.alert as apiSosAlertMerge}
                      participants={props.participants}
                      onDetails={onDetails}
                      ppTrackerClient={props.ppTrackerClient}
                      stages={props.stages}
                      event={props.event}
                    />
                  )}
                  {p.alertType === 2 && (
                    <FlagAlertComponent
                      alert={p.alert as flagAlert}
                      onDetails={onDetails}
                      participants={props.participants}
                      stages={props.stages}
                      event={props.event}
                    />
                  )}
                  {p.alertType === 3 && (
                    <IncidenceComponent
                      incidence={p.alert as apiIncidence}
                      participants={props.participants}
                      onDetails={onDetails}
                      stages={props.stages}
                      event={props.event}
                      onCenterMapOnParticipant={onCenterMapOnParticipant}
                    />
                  )}
                  {p.alertType === 5 && (
                    <BlueFlagComponent
                      blueFlag={p.alert as apiBlueFlag}
                      participants={props.participants}
                      onDetails={onDetails}
                      stages={props.stages}
                      event={props.event}
                    />
                  )}
                  {p.alertType === 4 && (
                    <MessageComponent
                      message={p.alert as apiMessage}
                      participants={props.participants}
                      stages={props.stages}
                      event={props.event}
                    />
                  )}
                </Fragment>
              ))}
          </tbody>
        </Table>
        {showFilters && (
          <FiltersComponent
            filters={alertFilters}
            onHide={onHideFilters}
            onFiltersChange={onFiltersChange}
          />
        )}
      </Container>
    </Fragment>
  );
};

export default AlertsResume;
