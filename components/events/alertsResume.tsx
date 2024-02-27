import { Fragment, useEffect, useState } from "react";
import React from "react";
import styles from "./sosAlertComponent.module.css";
import {
  Button,
  Row,
  Col,
  Table,
  Container,
  Pagination,
} from "react-bootstrap";
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
import { get } from "http";

interface AlertIcon {
  id: number;
  name: string;
  icon: string;
}

interface AlertResumeProps {
  event: eventInfo | undefined;
  alerts: rallyAlert[];
  participants: participantInfo[];
  stages: stage[];
  maxHeight: number;
  ppTrackerClient: PPTrackerDataServerIoClient;
  onCenterMapOnParticipant?: (participantId: number) => void;
  alertIcons: AlertIcon[];
  onParticipantClick: (participantNumber: string) => void;
}

export interface AlertFilter {
  showSOS: boolean;
  showMechanical: boolean;
}

export interface IncidencesFilter {
  showOverspeedingIncidence: boolean;
  showReverseIncidense: boolean;
  showStopZoneIncidence: boolean;
  showdnMinTimeIncidence: boolean;
  showdnMaxTimeIncidence: boolean;
  showdnInvalidExitIncidence: boolean;
  showdnOverspeedingIncidence: boolean;
  showWaypointMissedIncidence: boolean;
  showdzOverspeedingIncidence: boolean;
  showForbiddenWaypointIncidence: boolean;
  showStoppedIncidence: boolean;
  showOthersIncidence: boolean;
}

export interface FlagsFilter {  
  showBlueFlag: boolean;
  showRedFlag: boolean;
  showYellowFlag: boolean;
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
      showSOS: true,
      showMechanical: true,
    };
  };
  const [alertFilters, setAlertFilters] = React.useState<AlertFilter>(
    setInitialAlertFilters()
  );

  const setInitialIncidencesFilters = () => {
    return {
      showOverspeedingIncidence: true,
      showReverseIncidense: true,
      showStopZoneIncidence: true,
      showdnMinTimeIncidence: true,
      showdnMaxTimeIncidence: true,
      showdnInvalidExitIncidence: true,
      showdnOverspeedingIncidence: true,
      showWaypointMissedIncidence: true,
      showdzOverspeedingIncidence: true,
      showForbiddenWaypointIncidence: true,
      showStoppedIncidence: true,
      showOthersIncidence: true,
    };
  };

  const [incidencesFilters, setIncidencesFilters] = React.useState<IncidencesFilter>(
    setInitialIncidencesFilters()
  );
  const onIncidenceFiltersChange = (filters: IncidencesFilter) => {
    setIncidencesFilters(filters);
  };

  const setInitialFlagsFilter = () => {
    return {
      showBlueFlag: true,
      showRedFlag: true,
      showYellowFlag: true,
    };
  };
  const [flagsFilter, setFlagsFilter] = React.useState<FlagsFilter>(
    setInitialFlagsFilter()
  );
  const onFlagsFilterChange = (filters: FlagsFilter) => {
    setFlagsFilter(filters);
  };

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

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = props.alerts.slice(indexOfFirstItem, indexOfLastItem);

  const getSosTypeAsString = (s: apiSosAlertMerge) => {
    // console.log("Sos Type: ", s.type, " SybTypoe:", s.subtype);
    if (s.subtype > 0) {
      switch (s.subtype) {
        case 1:
          return "SOS";
        case 2:
          return "SOS";
        case 3:
          return "MECHANICAL";
        case 4:
          return "MECHANICAL";
        default:
          return "SOS";
      }
    } else {
      return s.type === 0 ? "SOS" : "MECHANICAL";
    }
  };

  useEffect(() => { 
    const newItems = props.alerts.filter(alert => {
      // Convertir el tipo en string para poder comparar
      const type = getSosTypeAsString(alert.alert as apiSosAlertMerge);
      console.log("Alert Type", type)
      // Si es del tipo SOS y el filtro de alertFilters.showSOS es falso, no incluir en el resultado
      if (type === "SOS" && !alertFilters.showSOS) {
        return false;
      }
    })
    console.log('newItems', newItems);
  }, [alertFilters.showSOS, props.alerts, indexOfFirstItem, indexOfLastItem]);

  // useEffect(() => {
  //   const newItems = props.alerts.filter(alert => {
  //     // Revisar que no haya un alert del tipo SOS
  //     if ("SOS" in alert.alert && "end_time" in alert.alert) {
  //       // alert es de tipo apiSosAlertMerge y el tipo de alerta es SOS
  //       return !alert.alert.end_time;
  //     }
  //     return true;
  //   });
  
  //   setCurrentItems(newItems.slice(indexOfFirstItem, indexOfLastItem));
  // }, [alertFilters.showSOS, props.alerts, indexOfFirstItem, indexOfLastItem]);

  // useEffect(() => {
  //   const newItems = props.alerts.filter(alert => {
  //     if ("Blue Flag" in alert.alert && !flagsFilter.showBlueFlag) {
  //       // Revisar que el alert.alert sea de tipo apiBlueFlag
  //       return !alert.alert["Blue Flag"];
  //     }
  //     if (alert.type === 'red' && !flagsFilter.showRedFlag) {
  //       return false;
  //     }
  //     if (alert.type === 'yellow' && !flagsFilter.showYellowFlag) {
  //       return false;
  //     }
  //     return true;
  //   });
  
  //   setCurrentItems(newItems.slice(indexOfFirstItem, indexOfLastItem));
  // }, [flagsFilter, props.alerts, indexOfFirstItem, indexOfLastItem]);

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
          className="m-0 p-0 mb-2"
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
            {currentItems
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
                      alertIcons={props.alertIcons}
                      onParticipantClick={props.onParticipantClick}
                    />
                  )}
                  {p.alertType === 2 && (
                    <FlagAlertComponent
                      alert={p.alert as flagAlert}
                      onDetails={onDetails}
                      participants={props.participants}
                      stages={props.stages}
                      event={props.event}
                      alertIcons={props.alertIcons}
                      onParticipantClick={props.onParticipantClick}
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
                      alertIcons={props.alertIcons}
                      onParticipantClick={props.onParticipantClick}
                    />
                  )}
                  {p.alertType === 5 && (
                    <BlueFlagComponent
                      blueFlag={p.alert as apiBlueFlag}
                      participants={props.participants}
                      onDetails={onDetails}
                      stages={props.stages}
                      event={props.event}
                      alertIcons={props.alertIcons}
                    />
                  )}
                  {p.alertType === 4 && (
                    <MessageComponent
                      message={p.alert as apiMessage}
                      participants={props.participants}
                      stages={props.stages}
                      event={props.event}
                      alertIcons={props.alertIcons}
                      onParticipantClick={props.onParticipantClick}
                    />
                  )}
                </Fragment>
              ))}
          </tbody>
        </Table>
        <div>
          <Pagination className="justify-content-center">
            <Pagination.Prev
              onClick={() =>
                setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)
              }
            />
            <Pagination.Item>{currentPage}</Pagination.Item>
            <Pagination.Next
              onClick={() =>
                setCurrentPage(
                  currentPage < Math.ceil(props.alerts.length / itemsPerPage)
                    ? currentPage + 1
                    : currentPage
                )
              }
            />
          </Pagination>
        </div>
        {showFilters && (
          <FiltersComponent
            filters={alertFilters}
            onHide={onHideFilters}
            onFiltersChange={onFiltersChange}
            incidencesFilters={incidencesFilters}
            onIncidenceFiltersChange={onIncidenceFiltersChange}
            flagsFilter={flagsFilter}
            onFlagsFilterChange={onFlagsFilterChange} 
          />
        )}
      </Container>
    </Fragment>
  );
};

export default AlertsResume;
