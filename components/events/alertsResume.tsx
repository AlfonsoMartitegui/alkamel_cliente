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
import { set } from "date-fns";

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

export interface SoSAndMechanicalFilter {
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
  showNoFlag: boolean;
}

export interface StagesFilter {
  value: string;
  label: string;
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

  const setInitialSosAndMechanicalFilter = () => {
    return {
      showSOS: true,
      showMechanical: true,
    };
  };

  const [sosAndMechanicalFilter, setSosAndMechanicalFilter] =
    React.useState<SoSAndMechanicalFilter>(setInitialSosAndMechanicalFilter());

  const onSosAndMechanicalFilterChange = (filters: SoSAndMechanicalFilter) => {
    setSosAndMechanicalFilter(filters);
  };

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

  const [incidencesFilters, setIncidencesFilters] =
    React.useState<IncidencesFilter>(setInitialIncidencesFilters());

  const onIncidenceFiltersChange = (filters: IncidencesFilter) => {
    setIncidencesFilters(filters);
  };

  const setInitialFlagsFilter = () => {
    return {
      showBlueFlag: true,
      showRedFlag: true,
      showYellowFlag: true,
      showNoFlag: true,
    };
  };
  const [flagsFilter, setFlagsFilter] = React.useState<FlagsFilter>(
    setInitialFlagsFilter()
  );
  const onFlagsFilterChange = (filters: FlagsFilter) => {
    setFlagsFilter(filters);
  };

  const [showMessages, setShowMessages] = React.useState<boolean>(true);
  const onMessagesFilterChange = (showMessages: boolean) => {
    setShowMessages(showMessages);
  };

  const [participantFilter, setParticipantFilter] = React.useState("");

  const [officialCarFilter, setOfficialCarFilter] = React.useState("");

  const [stagesFilter, setStagesFilter] = React.useState<StagesFilter[]>([]);

  const [startTimeFilter, setStartTimeFilter] = React.useState<string>("");
  const [endTimeFilter, setEndTimeFilter] = React.useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(50);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  const orderItems = (alerts: rallyAlert[]) => {
    const orderedItems = alerts.sort((a, b) => {
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
    });
    return orderedItems;
  };

  const [items, setItems] = useState<rallyAlert[]>(orderItems(props.alerts));

  const [totalItems, setTotalItems] = useState<number>(items.length);

  // AQUI EMPIEZA LA APLICACION DE LOS FILTROS
  useEffect(() => {
    let filteredItems = props.alerts;

    if (!flagsFilter.showBlueFlag) {
      filteredItems = props.alerts.filter((item) => item.alertType !== 5);
    }

    if (!flagsFilter.showRedFlag) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 2) {
          const flag = item.alert as flagAlert;
          return flag.flag_type !== 1;
        } else return true;
      });
    }

    if (!flagsFilter.showYellowFlag) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 2) {
          const flag = item.alert as flagAlert;
          return flag.flag_type !== 2;
        } else return true;
      });
    }

    if (!flagsFilter.showNoFlag) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 2) {
          const flag = item.alert as flagAlert;
          return flag.flag_type !== 0;
        } else return true;
      });
    }

    if (!sosAndMechanicalFilter.showSOS) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 1) {
          const sos = item.alert as apiSosAlertMerge;
          if (sos.type === 0 && sos.subtype === 0) return false;
          return sos.subtype !== 1 && sos.subtype !== 2;
        } else return true;
      });
    }

    if (!sosAndMechanicalFilter.showMechanical) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 1) {
          const sos = item.alert as apiSosAlertMerge;
          if (sos.type === 1 && sos.subtype === 0) return false;
          return sos.subtype !== 3 && sos.subtype !== 4;
        } else return true;
      });
    }

    if (!showMessages) {
      filteredItems = filteredItems.filter((item) => item.alertType !== 4);
    }

    if (!incidencesFilters.showOverspeedingIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 1;
        } else return true;
      });
    }

    if (!incidencesFilters.showReverseIncidense) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 2;
        } else return true;
      });
    }

    if (!incidencesFilters.showStopZoneIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 3;
        } else return true;
      });
    }

    if (!incidencesFilters.showdnMinTimeIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 4;
        } else return true;
      });
    }

    if (!incidencesFilters.showdnMaxTimeIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 5;
        } else return true;
      });
    }

    if (!incidencesFilters.showdnInvalidExitIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 6;
        } else return true;
      });
    }

    if (!incidencesFilters.showdnOverspeedingIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 7;
        } else return true;
      });
    }

    if (!incidencesFilters.showWaypointMissedIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 8;
        } else return true;
      });
    }

    if (!incidencesFilters.showdzOverspeedingIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 9;
        } else return true;
      });
    }

    if (!incidencesFilters.showForbiddenWaypointIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 10;
        } else return true;
      });
    }

    if (!incidencesFilters.showStoppedIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type !== 11;
        } else return true;
      });
    }

    if (!incidencesFilters.showOthersIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type > 11;
        } else return true;
      });
    }

    if (!incidencesFilters.showOthersIncidence) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return incidence.type === 0;
        } else return true;
      });
    }

    if (participantFilter !== "" && participantFilter !== null) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 1) {
          const sos = item.alert as apiSosAlertMerge;
          const getParticipant = participantsById.get(BigInt(sos.participant));
          const participantNumber = getParticipant ? getParticipant.number : "";
          return participantNumber === participantFilter;
        } else if (item.alertType === 2) {
          // const flag = item.alert as flagAlert;
          // const participantNumber = participantsById.get(BigInt(flag.));
          return item.alertType !== 2;
        } else if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          // Obtener el numero a partir del participantId
          const getParticipant = participantsById.get(
            BigInt(incidence.participantId)
          );
          const participantNumber = getParticipant ? getParticipant.number : "";
          return participantNumber === participantFilter;
        } else if (item.alertType === 4) {
          const message = item.alert as apiMessage;
          const getParticipant = participantsById.get(
            BigInt(message.participant)
          );
          const participantNumber = getParticipant ? getParticipant.number : "";
          return participantNumber === participantFilter;
        } else if (item.alertType === 5) {
          const blueFlag = item.alert as apiBlueFlag;
          const getParticipantRequester = participantsById.get(
            BigInt(blueFlag.participant_requester)
          );
          const getParticipantTarget = participantsById.get(
            BigInt(blueFlag.participant_target)
          );
          const participantRequesterNumber = getParticipantRequester
            ? getParticipantRequester.number
            : "";
          const participantTargetNumber = getParticipantTarget
            ? getParticipantTarget.number
            : "";
          return (
            participantRequesterNumber === participantFilter ||
            participantTargetNumber === participantFilter
          );
        } else return true;
      });
    }

    if (officialCarFilter !== "" && officialCarFilter !== null) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 1) {
          const sos = item.alert as apiSosAlertMerge;
          const getParticipant = participantsById.get(BigInt(sos.participant));
          const participantNumber = getParticipant ? getParticipant.number : "";
          return participantNumber === officialCarFilter;
        } else if (item.alertType === 2) {
          // const flag = item.alert as flagAlert;
          // const participantNumber = participantsById.get(BigInt(flag.));
          return item.alertType !== 2;
        } else if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          // Obtener el numero a partir del participantId
          const getParticipant = participantsById.get(
            BigInt(incidence.participantId)
          );
          const participantNumber = getParticipant ? getParticipant.number : "";
          return participantNumber === officialCarFilter;
        } else if (item.alertType === 4) {
          const message = item.alert as apiMessage;
          const getParticipant = participantsById.get(
            BigInt(message.participant)
          );
          const participantNumber = getParticipant ? getParticipant.number : "";
          return participantNumber === officialCarFilter;
        } else if (item.alertType === 5) {
          const blueFlag = item.alert as apiBlueFlag;
          const getParticipantRequester = participantsById.get(
            BigInt(blueFlag.participant_requester)
          );
          const getParticipantTarget = participantsById.get(
            BigInt(blueFlag.participant_target)
          );
          const participantRequesterNumber = getParticipantRequester
            ? getParticipantRequester.number
            : "";
          const participantTargetNumber = getParticipantTarget
            ? getParticipantTarget.number
            : "";
          return (
            participantRequesterNumber === officialCarFilter ||
            participantTargetNumber === officialCarFilter
          );
        } else return true;
      });
    }

    if (stagesFilter.length > 0) {
      filteredItems = filteredItems.filter((item) => {
        if (item.alertType === 1) {
          const sos = item.alert as apiSosAlertMerge;
          return stagesFilter.some(
            (stage) => stage.value === sos.stage_id.toString()
          );
        } else if (item.alertType === 2) {
          const flag = item.alert as flagAlert;
          return stagesFilter.some(
            (stage) => stage.value === flag.stage_id.toString()
          );
        } else if (item.alertType === 3) {
          const incidence = item.alert as apiIncidence;
          return stagesFilter.some(
            (stage) => stage.value === incidence.stageId.toString()
          );
        } else if (item.alertType === 4) {
          const message = item.alert as apiMessage;
          return stagesFilter.some(
            (stage) => stage.value === message.stage_id.toString()
          );
        } else if (item.alertType === 5) {
          const blueFlag = item.alert as apiBlueFlag;
          return stagesFilter.some(
            (stage) => stage.value === blueFlag.stage_id.toString()
          );
        } else return true;
      });
    }

    if (startTimeFilter !== "") {
      filteredItems = filteredItems.filter((item) => {
        const date = new Date(item.time);
        const startTime = new Date(startTimeFilter).getTime();
        return date.getTime() >= startTime;
      });
    }

    if (endTimeFilter !== "") {
      filteredItems = filteredItems.filter((item) => {
        const date = new Date(item.time);
        const endTime = new Date(endTimeFilter).getTime();
        return date.getTime() <= endTime;
      });
    }

    // 2023-11-18 14:49:57.400

    // 2023-11-18 12:58:42.200

    // console.log("Stages Filter: ", stagesFilter);
    // console.log("Stages filter length: ", stagesFilter.length);

    let orderedItems = orderItems(filteredItems);

    setItems(orderedItems);
    setTotalItems(orderedItems.length);
    setCurrentPage(1);

    console.log("Number of items:", orderedItems.length);
  }, [
    flagsFilter,
    sosAndMechanicalFilter,
    showMessages,
    incidencesFilters,
    participantFilter,
    officialCarFilter,
    stagesFilter,
    startTimeFilter,
    endTimeFilter,
    props.alerts,
  ]);

  const currentItems = items.slice(indexOfFirstItem, indexOfLastItem);

  const getParticipantIdNumber = (id: BigInt) => {
    if (participantsById.has(id)) {
      const part = participantsById.get(id) as participantInfo;
      return part.is_officialcar ? part.number : "" + part.number;
    } else {
      return "--" + id.toString();
    }
  };

  // const getStageName = (id: string) => {

  //   if (stagesMap.has(id)) {
  //     return stagesMap.get(id)?.time_control;
  //   } else {
  //     return "(unknown, id: " + id.toString() + ")";
  //   }
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
          <tbody className="m-0 p-0">
            {currentItems.map((p, index) => (
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
                    sosAndMechanicalFilter={sosAndMechanicalFilter}
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
                    flagsFilter={flagsFilter}
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
            <Pagination.First onClick={() => setCurrentPage(1)} />
            <Pagination.Prev
              onClick={() =>
                setCurrentPage(currentPage > 1 ? currentPage - 1 : 1)
              }
            />
            <Pagination.Item>{currentPage}</Pagination.Item>
            <Pagination.Next
              onClick={() =>
                setCurrentPage(
                  currentPage < Math.ceil(totalItems / itemsPerPage)
                    ? currentPage + 1
                    : currentPage
                )
              }
            />
            <Pagination.Last
              onClick={() =>
                setCurrentPage(Math.ceil(totalItems / itemsPerPage))
              }
            />
          </Pagination>
        </div>
        {showFilters && (
          <FiltersComponent
            filters={alertFilters}
            onHide={onHideFilters}
            onFiltersChange={onFiltersChange}
            sosAndMechanicalFilter={sosAndMechanicalFilter}
            onSosAndMechanicalFilterChange={onSosAndMechanicalFilterChange}
            incidencesFilters={incidencesFilters}
            onIncidenceFiltersChange={onIncidenceFiltersChange}
            flagsFilter={flagsFilter}
            onFlagsFilterChange={onFlagsFilterChange}
            showMessages={showMessages}
            onMessagesFilterChange={onMessagesFilterChange}
            participants={props.participants}
            setParticipantFilter={setParticipantFilter}
            participantFilter={participantFilter}
            officialCarFilter={officialCarFilter}
            setOfficialCarFilter={setOfficialCarFilter}
            stages={props.stages}
            setStagesFilter={setStagesFilter}
            stagesFilter={stagesFilter}
            startTimeFilter={startTimeFilter}
            setStartTimeFilter={setStartTimeFilter}
            endTimeFilter={endTimeFilter}
            setEndTimeFilter={setEndTimeFilter}
          />
        )}
      </Container>
    </Fragment>
  );
};

export default AlertsResume;
