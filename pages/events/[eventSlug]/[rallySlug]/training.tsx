import type { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import { getSession } from "next-auth/react";
import {
  Container,
  Row,
  Col,
  Tabs,
  Tab,
  Form,
  Button,
  Badge,
} from "react-bootstrap";
import React, { useEffect, useState, useRef, Fragment } from "react";
import {
  eventInfo,
  ppTrackerClient,
  rallyInfo,
  participantInfo,
} from "server/ppTrackerdataServerIoClient";

import CurrentEventBar from "components/events/currentEventBar";
import { logLine } from "server/shared/apiSharedTypes";
import LogViewer from "components/utils/logViewer";
import { apiIncidence, apiStageEvent } from "server/shared/socket_io_packets";
import { millisToInputDateTime } from "server/shared/utils";
import OverspeedListComponent from "components/events/training/overspeedList";
import AttemptListComponent, {
  attemptAnalysisLine,
} from "components/events/training/attempsList";
import ReverseListComponent from "components/events/training/reverseList";
import { useRouter } from "next/router";

interface EventProps {
  loggedIn: boolean;
  currentEvent: string;
  currentRallySlug: string;
  currentEventSlug: string;
  rallies: string;
}

const Replay: NextPage<EventProps> = (props) => {
  const router = useRouter();
  const [mainTabKey, setMainTabKey] = useState("Attemps");
  const [activeEvent, setActiveEvent] = React.useState<eventInfo | undefined>(
    undefined
  );
  const [rally, setRally] = React.useState<rallyInfo | undefined>(undefined);
  const [participants, setParticipants] = React.useState<participantInfo[]>([]);

  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [logLines, setLogLines] = useState<logLine[] | undefined>(undefined);
  const [logLinesLength, setLogLinesLength] = useState<number>(0);

  const participantFilter = useRef<HTMLSelectElement>(null);
  const startDate = useRef<HTMLInputElement>(null);
  const endDate = useRef<HTMLInputElement>(null);

  const [attempLines, setAttempLines] = React.useState<attemptAnalysisLine[]>(
    []
  );
  const [incidences, setIndicences] = React.useState<apiIncidence[]>([]);
  const [overSpeedCount, setOverSpeedCount] = React.useState<number>(0);
  const [reverseCount, setReverseCount] = React.useState<number>(0);
  const [stageEvents, setStageEvents] = React.useState<apiStageEvent[]>([]);

  useEffect(() => {
    ppTrackerClient.start();
    ppTrackerClient.on("activeEvents", () => onActiveEvents());
  }, []);

  const onActiveEvents = (): void => {
    if (ppTrackerClient.activeEventsBySlug.has(props.currentEventSlug)) {
      const activeEvent = ppTrackerClient.activeEventsBySlug.get(
        props.currentEventSlug
      );
      setActiveEvent(activeEvent);
      if (activeEvent && activeEvent.rallies.length > 0) {
        let maybeNewRally: rallyInfo | undefined = undefined;
        for (var ral of activeEvent.rallies) {
          if (ral.slug === props.currentRallySlug) {
            maybeNewRally = ral;
          }
        }
        const r =
          maybeNewRally !== undefined ? maybeNewRally : activeEvent.rallies[0];
        console.log("SETTING RALLY: ", r.slug);
        setRally(r);
        setParticipants(r.participants);
        let offsetMillis = activeEvent.offsetGMT * 60 * 60 * 1000;
        setStart(millisToInputDateTime(Number(r.start_date), offsetMillis));
        setEnd(millisToInputDateTime(Number(r.end_date), offsetMillis));
      }
    }
  };

  const requestData = () => {
    let log: logLine[] = [];
    setLogLines(log);
    setLogLinesLength(log.length);
    setIndicences([]);
    setOverSpeedCount(0);
    setReverseCount(0);
    setStageEvents([]);
    console.log(stageEvents.length);

    const participantId = participantFilter.current
      ? Number(participantFilter.current.selectedOptions[0].value)
      : 0;
    let startDateMillis = 0;
    let endDateMillis = 0;

    if (startDate.current && endDate.current) {
      const d = new Date(startDate.current.value);
      startDateMillis = d.getTime();
      const eD = new Date(endDate.current.value);
      endDateMillis = eD.getTime();
    }

    if (
      startDateMillis === 0 ||
      endDateMillis === 0 ||
      endDateMillis <= startDateMillis
    ) {
      log.push({
        type: "ERROR",
        message:
          "Invalid date filter. Make sure that start Time is bigger than end time.",
        idx: 1,
        time: new Date().getTime(),
      });
      setLogLines(log);
      setLogLinesLength(log.length);
      return;
    }

    log.push({
      type: "INFO",
      message: "Waiting for server response...",
      idx: 1,
      time: new Date().getTime(),
    });
    setLogLines(log);
    setLogLinesLength(log.length);
    const query = {
      rallyId: rally ? Number(rally.id) : 0,
      startTime: startDateMillis,
      endTime: endDateMillis,
      participant: participantId,
    };

    console.log("query: ", query);

    ppTrackerClient.getIncidencesData(
      query,
      (data: apiIncidence[], error?: unknown) => {
        console.log("On incidences reply, total records:", data.length);
        if (error) {
          log.push({
            type: "ERROR",
            idx: 2,
            time: new Date().getTime(),
            message:
              typeof error === "string"
                ? error
                : error instanceof Error
                ? error.message + " " + (error.stack ? error.stack : "")
                : "Unknow error getting incidences.",
          });
          setLogLines(log);
          setLogLinesLength(log.length);
        } else {
          log.push({
            type: data.length > 0 ? "SUCCESS" : "WARNING",
            message:
              data.length > 0
                ? `${data.length} incidence records found.`
                : "No Incidence Records Found.",
            idx: 2,
            time: new Date().getTime(),
          });
          setLogLines(log);
          setLogLinesLength(log.length);
          setIndicences(data);
          let overCount = 0;
          let reverses = 0;
          for (var i of data) {
            if (i.type === 1) {
              overCount++;
            }
            if (i.type === 2) {
              reverses++;
            }
          }
          setOverSpeedCount(overCount);
          setReverseCount(reverses);
          ppTrackerClient.getStageEventsData(
            query,
            (data: apiStageEvent[], error?: unknown) => {
              console.log("On stage events reply, total records:", data.length);
              if (error) {
                log.push({
                  type: "ERROR",
                  idx: 3,
                  time: new Date().getTime(),
                  message:
                    typeof error === "string"
                      ? error
                      : error instanceof Error
                      ? error.message + " " + (error.stack ? error.stack : "")
                      : "Unknow error getting stage events.",
                });
              } else {
                log.push({
                  type: data.length > 0 ? "SUCCESS" : "WARNING",
                  message:
                    data.length > 0
                      ? `${data.length} records found.`
                      : "No Stage Events  Found.",
                  idx: 3,
                  time: new Date().getTime(),
                });
              }
              console.log("SETTING LOG TO??? ", log);
              setLogLines(log);
              setLogLinesLength(log.length);
              setStageEvents(data);
              const sortedData: apiStageEvent[] = data.sort((a, b) => {
                if (a.participant_id != b.participant_id) {
                  if (a.participant_id < b.participant_id) return -1;
                  else return 1;
                } else {
                  if (a.stage_id !== b.stage_id) {
                    if (a.stage_id < b.stage_id) return -1;
                    else return 1;
                  } else {
                    if (a.time < b.time) return -1;
                    else return 1;
                  }
                }
              });

              let newLine: attemptAnalysisLine | undefined = undefined;
              let previousAttemp: attemptAnalysisLine | undefined = undefined;
              let lastIdx: number = 0;
              let previousTypeIdx: number = -1;
              const MAX_ALLOWED_ATTEMPS = 3;
              let newAttempsData: attemptAnalysisLine[] = [];

              for (var sEvent of sortedData) {
                const typeIdx = getStageEventTypeIndex(sEvent.type);

                if (
                  newLine === undefined ||
                  previousTypeIdx >= typeIdx ||
                  (newLine !== undefined &&
                    Number(newLine.participantId) !== sEvent.participant_id) ||
                  (newLine !== undefined &&
                    Number(newLine.stageId) !== sEvent.stage_id)
                ) {
                  previousAttemp = newLine;
                  if (newLine !== undefined) {
                    newAttempsData.push(newLine);
                  }
                  newLine = getEmptyAttempltAnalysisLine();
                  newLine.attemptIdx = ++lastIdx;
                  newLine.participantId = sEvent.participant_id;
                  newLine.stageId = sEvent.stage_id;
                  if (
                    previousAttemp !== undefined &&
                    (newLine.participantId !== previousAttemp.participantId ||
                      newLine.stageId !== previousAttemp.stageId)
                  ) {
                    newLine.attemptNr = 1;
                  } else {
                    if (sEvent.type === 5 || sEvent.type == 1) {
                      newLine.attemptNr =
                        previousAttemp != undefined
                          ? previousAttemp.attemptNr + 1
                          : 1;
                    } else {
                      newLine.attemptNr =
                        previousAttemp != undefined
                          ? previousAttemp.attemptNr
                          : 1;
                    }
                  }
                }

                //#region add sEvent Time to Attemp Line Object
                switch (sEvent.type) {
                  case 5: //arrival
                    newLine.arriveTime = sEvent.time;
                    break;
                  case 1: //start
                    newLine.startTime = sEvent.time;
                    break;
                  case 3: //enter
                    newLine.enterTime = sEvent.time;
                    newLine.enterLat = sEvent.lat / 10000000;
                    newLine.enterLng = sEvent.lon / 10000000;
                    break;
                  case 4: //abandon
                    newLine.abandonTime = sEvent.time;
                    newLine.abandonLat = sEvent.lat / 10000000;
                    newLine.abandonLng = sEvent.lon / 10000000;
                    break;
                  case 2: //finish
                    newLine.finishTime = sEvent.time;
                    break;
                  case 6: //exit
                    newLine.exitTime = sEvent.time;
                    break;
                }

                if (newLine.attemptNr > MAX_ALLOWED_ATTEMPS) {
                  newLine.isAttemptNrAlert = true;
                }
                //console.log("current newLine:", newLine);
                //#endregion
                previousTypeIdx = typeIdx;
              }

              if (newLine !== undefined) {
                //console.log("pushing the LAST new line: ", newLine);
                newAttempsData.push(newLine);
              }

              setAttempLines(newAttempsData);
            }
          );

          //TODO: GET DATA RESULTS, and process all of them.
        }
      }
    );
  };

  const getStageEventTypeIndex = (t: number) => {
    switch (t) {
      case 5: //arrival
        return 1;
      case 1: //start
        return 2;
      case 3: //enter
        return 3;
      case 4: //abandon
        return 4;
      case 2: //finish
        return 5;
      case 6: //exit
        return 6;
      default:
        return 99;
    }
  };
  const getEmptyAttempltAnalysisLine = () => {
    return {
      participantId: 0,
      stageId: 0,
      attemptIdx: 0,
      attemptNr: 1,
      arriveTime: 0,
      startTime: 0,
      enterTime: 0,
      enterLat: 0,
      enterLng: 0,
      abandonTime: 0,
      abandonLat: 0,
      abandonLng: 0,
      finishTime: 0,
      exitTime: 0,
      isAttemptNrAlert: false,
      isStartTimeAlert: false,
    };
  };
  const hideLog = () => {
    setLogLines(undefined);
    setLogLinesLength(0);
  };

  const onChangeRallyClick = () => {
    if (activeEvent && activeEvent.rallies.length > 2) {
      //TODO: Show Dialog to choose which rally is going to be selected
    } else if (activeEvent && activeEvent.rallies.length === 2) {
      //Only 2 rallies, change automatically to the "second" rally.

      router.push(
        "/events/" +
          props.currentEventSlug +
          "/" +
          activeEvent.rallies[
            activeEvent.rallies[0].slug === rally?.slug ? 1 : 0
          ].slug +
          "/training",
        undefined,
        { shallow: false }
      );
    }
  };

  const onTotalOverSpeeds = (total: number) => {
    setOverSpeedCount(total);
  };

  return (
    <Fragment>
      <Head>
        <title>PP Tracker</title>
        <meta
          name="description"
          content="PP Tracker: Tracking for rally competitors. Power up by Al Kamel Systems S.L."
        />
        <link rel="icon" href="/favicon.png" />
      </Head>
      <main>
        <input
          type="hidden"
          id="currentRallyId"
          value={rally ? rally.id.toString() : "0"}
        ></input>
        <Container fluid style={{ height: "100%" }}>
          <CurrentEventBar
            userIsAdmin={props.loggedIn}
            event={activeEvent}
            rally={rally}
            noAlerts
            noNewMessage
            noOfficialCars
            noItinerary
            noEntryList
            showChangeRallyButton
            onChangeRallyClick={onChangeRallyClick}
            user={null}
          />
          <Row className="border my-3 mx-2">
            <Col>
              <Form>
                <Row>
                  <Col className="fw-b fs-4 mb-3 text-primary mt-1">
                    FILTERS:
                  </Col>
                </Row>
                <Row>
                  <Col>
                    <Form.Group className="mb-3" controlId="startDateInput">
                      <Form.Label>Start Date</Form.Label>
                      <Form.Control
                        className="sm fw-bold"
                        type="datetime-local"
                        placeholder="Rally Start Date"
                        defaultValue={start}
                        ref={startDate}
                      />
                    </Form.Group>
                  </Col>
                  <Col>
                    <Form.Group className="mb-3" controlId="endDateInput">
                      <Form.Label>End Date</Form.Label>
                      <Form.Control
                        className="sm fw-bold"
                        type="datetime-local"
                        placeholder="Rally End Date"
                        defaultValue={end}
                        ref={endDate}
                      />
                    </Form.Group>
                  </Col>

                  <Col>
                    <Form.Group className="mb-3">
                      <Form.Label>Participant</Form.Label>
                      <Form.Select ref={participantFilter}>
                        <option key={-1} value={0}>
                          -
                        </option>
                        {participants
                          .sort((a, b) => {
                            if (Number(a.number) < Number(b.number)) return -1;
                            else return 1;
                          })
                          .map((p) => (
                            <option key={Number(p.id)} value={Number(p.id)}>
                              {p.number}
                            </option>
                          ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                {logLines && (
                  <LogViewer
                    logLines={logLines}
                    logLinesLength={logLinesLength}
                    onHide={hideLog}
                    size="250px"
                    margin="mb-2"
                  />
                )}
                <Row>
                  <Col className="mb-2 mt-0">
                    <Button variant="primary" onClick={requestData}>
                      Get Data
                    </Button>
                  </Col>
                </Row>
              </Form>
            </Col>
          </Row>
          <Row>
            <Col>
              <Tabs
                id="mainEventTab"
                activeKey={mainTabKey}
                onSelect={(k) => setMainTabKey(k as string)}
                className="mt-3 mb-3 h4"
              >
                <Tab
                  eventKey="attemps"
                  title={
                    <React.Fragment>
                      Attemps Analysis
                      <Badge className="ms-1 bg-warning text-dark">
                        {attempLines.length}
                      </Badge>
                    </React.Fragment>
                  }
                >
                  <AttemptListComponent
                    event={activeEvent}
                    rally={rally}
                    data={attempLines}
                  />
                </Tab>
                <Tab
                  eventKey="reverse"
                  title={
                    <React.Fragment>
                      Reverse Alerts
                      <Badge className="ms-1 bg-danger">{reverseCount}</Badge>
                    </React.Fragment>
                  }
                >
                  <ReverseListComponent
                    event={activeEvent}
                    rally={rally}
                    data={incidences}
                  />
                </Tab>
                <Tab
                  eventKey="speed"
                  title={
                    <React.Fragment>
                      Overspeed Alerts
                      <Badge className="ms-1 bg-danger">{overSpeedCount}</Badge>
                    </React.Fragment>
                  }
                >
                  <OverspeedListComponent
                    event={activeEvent}
                    rally={rally}
                    data={incidences}
                    overspeedMargin={0}
                    onTotalOverSpeeds={onTotalOverSpeeds}
                  />
                </Tab>
              </Tabs>
            </Col>
          </Row>
        </Container>
      </main>

      <footer></footer>
    </Fragment>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const evSlug: string = context.query.eventSlug as string;
  const rallySlug: string = context.query.rallySlug as string;

  const { req } = context;
  const session = await getSession({ req });
  if (session === null) {
    return {
      redirect: {
        permanent: false,
        destination: "/login",
      },
      props: {
        redirectFrom: req.headers.referer,
      },
    };
  }
  console.log("I'm I in the right place???", context.query);
  return {
    props: {
      loggedIn: session ? true : false,
      currentEventSlug: evSlug,
      currentEvent: "",
      currentRallySlug: rallySlug,
      rallies: "",
    },
  };
};

export default Replay;
