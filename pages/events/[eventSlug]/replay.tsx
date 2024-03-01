import type { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import { getSession } from "next-auth/react";
import { Container, Row, Col } from "react-bootstrap";
import CSS from "csstype";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import React, { useEffect, useState, useRef, Fragment } from "react";
import {
  participant,
  PrismaClient,
  track_waypoints,
  waypoint_types,
} from "@prisma/client";
import superjson from "superjson";
import {
  eventInfo,
  ppTrackerClient,
  rallyInfo,
  participantInfo,
} from "server/ppTrackerdataServerIoClient";
import {
  apiPositionRecord,
  positionRecordsRequestQuery,
} from "server/shared/socket_io_packets";
import CurrentEventBar from "components/events/currentEventBar";
import ParticipantMarker from "components/maps/ParticipantMarker";
import WaypointMarker from "components/maps/WaypointMarker";
import RequestQueryFormComponent from "components/events/Replay/requestQueryFormComponent";
import ReplayEntryBar from "components/events/Replay/ReplayBar";
import ParticipantReplayDetails, {
  pathDetails,
} from "components/events/Replay/participantReplayDetails";
import ReplayMap from "components/maps/ReplayMap";
import { initWaypointIconMarkers } from "components/events/maps/resources";

interface EventProps {
  loggedIn: boolean;
  userProfile: {
    id: number;
    roleid: number;
    role: string;
  };
  currentEvent: string;
  currentRallySlug: string;
  currentEventSlug: string;
  rallies: string;
  waypoint_types: string;
}

export interface pathDetailsToShowInTheReplay {
  lastTimeChange: number;
  pathDetails: Map<number, pathDetails>;
  replayData: apiPositionRecord[];
}

const verticalDivider: CSS.Properties = {
  borderRight: "1px solid #777",
};

const Replay: NextPage<EventProps> = (props) => {
  //#region map Waypoints Markers:  Icons, GetColorByStatus
  const waypointMarkerIcon =
    "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/WaypointMarker.png";

  //  const officialCarMarkerIcon =
  //  "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/officialCarMarker.png";

  const initMarkers = () => {
    let participantMarkers = new Map<string, string>();
    participantMarkers.set(
      "black",
      "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/markers/v0/black.png"
    );
    participantMarkers.set(
      "white",
      "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/markers/v0/white.png"
    );
    participantMarkers.set(
      "gray",
      "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/markers/v0/gray.png"
    );
    participantMarkers.set(
      "yellow",
      "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/markers/v0/yellow.png"
    );
    participantMarkers.set(
      "green",
      "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/markers/v0/green.png"
    );
    participantMarkers.set(
      "red",
      "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/markers/v0/red.png"
    );
    return participantMarkers;
  };

  const markers = initMarkers();

  const [waypointTypes, setWaypointTypes] = React.useState<
    Map<bigint, waypoint_types>
  >(new Map<bigint, waypoint_types>());
  const [waypointMarkers, setWaypointMarkers] = React.useState<
    Map<number, string>
  >(new Map<number, string>());

  const getWaypointTypeFor = (w: track_waypoints) => {
    if (waypointTypes.has(w.waypoint_type_id)) {
      return waypointTypes.get(w.waypoint_type_id);
    } else {
      let wpTypeUnknown: waypoint_types = {
        id: 0n,
        name: "unknown",
        name_es: "unknown",
        name_en: "unknown",
        default_apperture: 0n,
        default_inner_radio: 0,
        default_mandatory: 0,
        default_outer_radio: 0,
      };
      return wpTypeUnknown;
    }
  };

  //#endregion

  //#region PROCES & GET REPLAY DATA
  const [replayData, setReplayData] = React.useState<apiPositionRecord[]>([]);
  const [replayDataByParticipant, setReplayDataByParticipant] = React.useState<
    Map<number, apiPositionRecord[]>
  >(new Map<number, apiPositionRecord[]>());
  const [showRequestForm, setShowRequestForm] = React.useState<boolean>(false);

  const onRequestData = (
    data: apiPositionRecord[],
    query: positionRecordsRequestQuery
  ) => {
    setReplayData(data);

    let firstPacketTime = 0;
    let dataByParticipant = new Map<number, apiPositionRecord[]>();
    for (var pos of data) {
      const posValidTime = getPacketValidTime(pos);
      if (firstPacketTime === 0 || firstPacketTime > posValidTime) {
        firstPacketTime = posValidTime;
      }
      let positions: apiPositionRecord[] = [];
      if (dataByParticipant.has(pos.participant)) {
        positions = dataByParticipant.get(
          pos.participant
        ) as apiPositionRecord[];
      }
      positions.push(pos);
      dataByParticipant.set(pos.participant, positions);
    }
    let sortedDataByParticipant = new Map<number, apiPositionRecord[]>();
    for (var partId of dataByParticipant.keys()) {
      let sortedData = dataByParticipant.get(partId);
      if (sortedData !== undefined) {
        sortedData = sortedData.sort((a, b) => {
          const aTime = a.time > 0 ? a.time : a.published_at;
          const bTime = b.time > 0 ? b.time : b.published_at;
          return aTime > bTime ? 1 : aTime < bTime ? -1 : 0;
        });
        sortedDataByParticipant.set(partId, sortedData);
      }
    }
    setReplayDataByParticipant(sortedDataByParticipant);
    setReplayQuery(query);
    setShowRequestForm(false);
    console.log("SET REPLAY TO FIRST PACKET TIME:", firstPacketTime);
    onReplayTime(firstPacketTime);
  };

  const [replayIndexByParticipant, setReplayIndexByParticipant] =
    React.useState<Map<number, number>>(new Map<number, number>());
  const [replayRecordByParticipant, setReplayRecordByParticipant] =
    React.useState<Map<number, apiPositionRecord | undefined>>(
      new Map<number, apiPositionRecord | undefined>()
    );
  const [replayTime, setReplayTime] = useState<number>(0);

  const onReplayTime = (time: number) => {
    //console.log("SETTING NEW REPLAY TIME TO: ", time);
    if (replayQuery) {
      //console.log("UPDATING SOMETHING???");
      let newReplayRecords = new Map<number, apiPositionRecord | undefined>();
      let newReplayIndexs = replayIndexByParticipant;
      let idxHasChanged: boolean = false;
      for (var p of replayQuery.participants) {
        if (replayDataByParticipant.has(p)) {
          let idx = replayIndexByParticipant.has(p)
            ? (replayIndexByParticipant.get(p) as number)
            : 0;
          const previousIdx = idx;
          const rData = replayDataByParticipant.get(p) as apiPositionRecord[];
          if (idx > rData.length - 1) {
            idx = rData.length - 1;
            // console.log(
            //   "FIXING IDX TO LAST PACKET FROM",
            //   previousIdx,
            //   " TO ",
            //   idx
            // );
          } else if (idx < 0) {
            idx = 0;
          }
          let currentTimeIndex = getPacketValidTime(rData[idx]);
          // console.log(
          //   "INDeX OF ",
          //   p,
          //   " IS ",
          //   previousIdx,
          //   " - CURRENT TIME IS: ",
          //   currentTimeIndex,
          //   "LOOKING FOR PACKET BEFORE: ",
          //   time,
          //   " / TOTAL RECORDS: ",
          //   rData.length
          // );

          //TODO: move to next index;
          const firstPacketAt = getPacketValidTime(rData[0]);
          const lastPacketAt = getPacketValidTime(rData[rData.length - 1]);
          if (time < firstPacketAt) {
            idx = -1;
          } else if (time >= lastPacketAt) {
            idx = rData.length - 1;
          } else if (time > replayTime) {
            //moving forwards
            while (currentTimeIndex < time && idx < rData.length - 1) {
              currentTimeIndex = getPacketValidTime(rData[idx + 1]);
              idx++;
            }

            if (idx > rData.length - 1) {
              idx = rData.length - 1;
            } else if (currentTimeIndex > time) {
              idx--;
            }
          } else if (time < replayTime) {
            //moving backwards
            while (currentTimeIndex > time && idx > 0) {
              //console.log(" << back to ", idx - 1, currentTimeIndex, time);
              idx--;
              currentTimeIndex = getPacketValidTime(rData[idx]);
            }
          }

          if (previousIdx != idx) {
            idxHasChanged = true;
          }

          newReplayIndexs.set(p, idx);
          newReplayRecords.set(p, idx != -1 ? rData[idx] : undefined);
          // console.log(
          //   "NEW INDeX OF ",
          //   p,
          //   " IS ",
          //   idx,
          //   " - CURRENT TIME IS: ",
          //   idx != -1 ? getPacketValidTime(rData[idx]) : "undefined",
          //   "LOOKING FOR PACKET BEFORE: ",
          //   time,
          //   " / TOTAL RECORDS: ",
          //   rData.length
          // );
          if (selectedParticipant && Number(selectedParticipant.id) === p) {
            //TODO: update waypoints if necessary...
            //TODO: update participantMarker color (Stage, or NO Stage)
          }
        }
      }
      if (idxHasChanged) {
        //console.log("IDX CHANGE...");
        setReplayIndexByParticipant(newReplayIndexs);
        setReplayRecordByParticipant(newReplayRecords);
      }
    }
    if (replayTime != time) {
      setReplayTime(time);
    }
  };

  const getPacketValidTime = (pos: apiPositionRecord) => {
    return pos.time > 0 ? pos.time : pos.published_at;
  };
  //#endregion

  const [replayQuery, setReplayQuery] = React.useState<
    positionRecordsRequestQuery | undefined
  >(undefined);
  const [activeEvent, setActiveEvent] = React.useState<eventInfo | undefined>(
    undefined
  );
  const [rally, setRally] = React.useState<rallyInfo | undefined>(undefined);
  const [participants, setParticipants] = React.useState<participantInfo[]>([]);
  const [currentParticipantInfo, setCurrentParticipantInfo] = React.useState<
    participantInfo | undefined
  >(undefined);
  const [waypoints, setWaypoints] = React.useState<track_waypoints[]>([]);
  //const [mapHeight, setMapHeight] = useState<number>(200);
  const [trackKmlLayer, setTrackKmlLayer] = useState<
    google.maps.KmlLayer | undefined
  >(undefined);

  const mainContent = useRef(null);
  const alertsDiv = useRef(null);

  const updateMapSize = () => {
    if (mainContent && mainContent.current) {
      const mainDiv = mainContent?.current as HTMLDivElement;
      const bounds = mainDiv.getBoundingClientRect();
      const newHeight = window.innerHeight - bounds.y;
      //console.log("main div boundings: ", mainDiv.getBoundingClientRect());
      //console.log(">> New Height:", newHeight);
      mainDiv.setAttribute("style", "height: " + newHeight.toString() + "px");
      if (alertsDiv && alertsDiv.current) {
        const alertsTable = alertsDiv.current as HTMLDivElement;
        alertsTable.setAttribute(
          "style",
          "height: " + newHeight.toString() + "px"
        );
      }
    }
  };

  useEffect(() => {
    const waypoint_types: waypoint_types[] = superjson.parse(
      props.waypoint_types
    );
    let wpTypes = new Map<bigint, waypoint_types>();
    for (var wpType of waypoint_types) {
      wpTypes.set(wpType.id, wpType);
    }
    setWaypointTypes(wpTypes);
    setWaypointMarkers(initWaypointIconMarkers("v5.1", waypoint_types));

    ppTrackerClient.start();
    ppTrackerClient.on("activeEvents", () => onActiveEvents());
    //ppTrackerClient.on("positions", (rallyId) => onPositions(rallyId));
    ppTrackerClient.on("participants", (rallyId) =>
      onParticipantsUpdate(rallyId)
    );

    function handleResize() {
      //console.log("resized to: ", window.innerWidth, "x", window.innerHeight);
      updateMapSize();
    }
    window.addEventListener("resize", handleResize);
    handleResize();
  }, []);

  const onActiveEvents = (): void => {
    //console.log("RECEIVING ACTIVE EVENTS!!");

    if (ppTrackerClient.activeEventsBySlug.has(props.currentEventSlug)) {
      //LOAD CURRENT EVENT INFO
      const activeEvent = ppTrackerClient.activeEventsBySlug.get(
        props.currentEventSlug
      );
      //console.log("EVENT SLUG IS FOUND!!");
      setActiveEvent(activeEvent);

      if (activeEvent && activeEvent.rallies.length > 0) {
        const r = activeEvent.rallies[0];
        // console.log(
        //   "<<<<<<<<<<<<<<<<< Setting rally: >>>>>>>>>>>>>>>>>>>",
        //   r.name,
        //   r.id
        // );
        setRally(r);
        setParticipants(r.participants);

        let ctaLayer = new google.maps.KmlLayer({
          url:
            "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/tracks/" +
            r.rally_kml_file,
          screenOverlays: true,
          map: undefined,
          zIndex: 2000,
          //preserveViewport: true,
          clickable: false,
        });
        setTrackKmlLayer(ctaLayer);
        const viewport = ctaLayer.getDefaultViewport();
        if (viewport != null) {
          setCenter({
            lat: viewport.getCenter().lat(),
            lng: viewport.getCenter().lng(),
          });
        }
        //onPositions(Number(r.id));
      }
    } else {
      //TODO: ASK SOCKET IO FOR "CLOSED" event info.
    }
  };

  const onParticipantsUpdate = (rallyId: number): void => {
    const hiddenRallyId = document.getElementById(
      "currentRallyId"
    ) as HTMLInputElement;

    if (rallyId === Number(hiddenRallyId.value)) {
      // console.log(
      //   new Date().toTimeString(),
      //   "OK !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! >>>>>>>>>>>>>>>>>>>>>>> PARTICIPANTS UPDATE FROM RALLY ",
      //   rallyId,
      //   hiddenRallyId.value
      // );

      let partId = 0;

      const currentParticipantId = document.getElementById(
        "currentParticipantId"
      ) as HTMLInputElement;
      partId =
        currentParticipantId !== null ? Number(currentParticipantId.value) : 0;

      // const currentOfficialCarId = document.getElementById(
      //   "currentOfficialCarId"
      // ) as HTMLInputElement;
      // officialId =
      //   currentOfficialCarId !== null ? Number(currentOfficialCarId.value) : 0;

      //console.log("current partId / officialId: ", partId, officialId);

      let participants: participantInfo[] = [];
      const pMap = ppTrackerClient.rallyParticipantsById.get(rallyId);
      if (pMap) {
        for (var pInfo of pMap.values()) {
          participants.push(pInfo);
          if (partId === Number(pInfo.id)) {
            setCurrentParticipantInfo(pInfo);
            //set Participant Details Info Object
          }
        }
      }
      setParticipants(participants);
    } else {
      // console.log(
      //   ">>>>>>>>>> INVALID >>>>>>>>>>>>>>>>>>> PARTICIPANTS UPDATE FROM RALLY ",
      //   rallyId,
      //   hiddenRallyId.value
      // );
    }
  };

  const getParticipantMarkerTextColorByStatus = (pInfo: participantInfo) => {
    let partColor: string = "#fff";
    if (replayRecordByParticipant.has(Number(pInfo.id))) {
      const replayData = replayRecordByParticipant.get(Number(pInfo.id));
      if (replayData !== undefined && replayData.stage_id > 0) {
        partColor = "#000";
      }
    }
    return partColor;
  };

  const getParticipantMarkerIconByStatus = (pInfo: participantInfo) => {
    let partColor: string = markers.get("black") as string;
    if (replayRecordByParticipant.has(Number(pInfo.id))) {
      const replayData = replayRecordByParticipant.get(Number(pInfo.id));
      if (replayData !== undefined && replayData.stage_id > 0) {
        partColor = markers.get("white") as string;
      }
    }
    return partColor;
  };

  // const onPositions = (rallyId: number): void => {
  //   //TODO: Change this for a subscription mode to only receive data from the current rally
  //   const posArray = ppTrackerClient.rallyPositions.get(rallyId);
  //   if (posArray) {
  //     //console.log("YEs, valid posArray... setting positions...");
  //     setPositions(posArray);
  //   }
  // };

  const [showParticipantDetails, setShowParticipantDetails] =
    React.useState<boolean>(false);
  const [selectedParticipant, setSelectedParticipant] = React.useState<
    participant | undefined
  >(undefined);

  const [showOfficialCarsBar, setShowOfficialCarsBar] =
    React.useState<boolean>(false);
  const onShowOfficarCarBarButton = () => {
    setShowOfficialCarsBar(!showOfficialCarsBar);
  };

  const [showNewMessage, setShowNewMessage] = React.useState<boolean>(false);
  const onShowNewMessage = () => {
    setShowNewMessage(true);
    console.log(showNewMessage);
  };
  const onHideNewMessage = () => {
    setShowNewMessage(false);
  };

  const [showEntryListBar, setShowEntryListBar] = React.useState<boolean>(true);
  const onShowEntryListBar = () => {
    setShowEntryListBar(!showEntryListBar);
  };

  const [showItineraryBar, setShowItineraryBar] = React.useState<boolean>(true);
  const onShowItineraryBar = () => {
    setShowItineraryBar(!showItineraryBar);
  };

  const onChangeRallyClick = () => {
    if (activeEvent && activeEvent.rallies.length > 2) {
      //TODO: Show Dialog to choose which rally is going to be selected
    } else if (activeEvent) {
      //Only 2 rallies, change automatically to the "second" rally.
      setRally(activeEvent.rallies[1]);
    }
  };

  const findParticipantInfoForId = (participantId: BigInt | undefined) => {
    if (participantId === undefined) {
      return undefined;
    }
    for (var p of participants) {
      if (p.id === participantId) return p;
    }
    return undefined;
  };

  const onNewQueryClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("NEW QUERY REQUEST:", e.currentTarget);
    setShowRequestForm(true);
  };

  const onParticipantClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    //console.log(e.currentTarget.getAttribute("id"));
    //console.log(e.currentTarget);
    if (e.currentTarget.getAttribute("id")) {
      const p = e.currentTarget.getAttribute("id")!;
      //console.log(p);
      setShowParticipantDetails(true);
      const part = ppTrackerClient.getRallyParticipantWithNumber(
        Number(rally?.id),
        p
      );
      setSelectedParticipant(part);
      setCurrentParticipantInfo(findParticipantInfoForId(part?.id));
      centerMapOnParticipantNumber(p);
    }
  };

  const onParticipantMarkerClick = (id: number) => {
    //console.log("CLICK FROM MAIN>> ON PARTICIPANT ID: ", id);
    const part = ppTrackerClient.rallyParticipantsById
      .get(Number(rally?.id))
      ?.get(id);
    if (part !== undefined) {
      if (showParticipantDetails === false) {
        setShowParticipantDetails(true);
      }
      setSelectedParticipant(part);
      setCurrentParticipantInfo(findParticipantInfoForId(part?.id));
      //centerMapOnParticipantNumber(p);
    }
  };

  const centerMapOnParticipantNumber = (participantNumber: string) => {
    console.log("CENTER MAP ON PARTICIPANT NUMBER ", participantNumber);
    if (rally) {
      const participant = ppTrackerClient.getRallyParticipantWithNumber(
        Number(rally.id),
        participantNumber
      );
      if (participant) {
        centerMapOnParticipantId(Number(participant.id));
      }
    }
  };

  const centerMapOnParticipantId = (participantId: number) => {
    if (replayRecordByParticipant.has(participantId)) {
      //console.log("CENTER On PARTICIPANT ID: ", participantId);
      const apiPosition = replayRecordByParticipant.get(participantId);

      if (apiPosition === undefined) return;

      //console.log("current Pos:", apiPosition);
      const newPos = { lat: apiPosition.lat, lng: apiPosition.lon };
      setCenter(newPos);
      console.log("SETTINGS WAYPOINTS FOR STAGE ????", apiPosition.stage_id);
      setWaypointsForStage(apiPosition.stage_id);

      if (zoom < 18) {
        setZoom(17);
      } else if (zoom > 14) {
        setZoom(17);
      }
    }
  };

  const setWaypointsForStage = (stageId: number) => {
    const stage = ppTrackerClient.getRallyStageWithId(
      Number(rally?.id),
      stageId
    );

    if (stage) {
      let wpoints = rally?.waypoints.filter(
        (w) => w.track_id === stage?.track_id
      );
      console.log("SETTINGS WAYPOINTS FOR STAGE ????", stageId, wpoints);
      if (wpoints) {
        setWaypoints(wpoints);
      } else {
        setWaypoints([]);
      }
    } else {
      setWaypoints([]);
    }
  };

  const onParticipantHide = () => {
    setShowParticipantDetails(false);
  };

  const onParticipantCenterMap = () => {
    const participantId = document.getElementById(
      "currentParticipantId"
    ) as HTMLInputElement;
    centerMapOnParticipantId(Number(participantId.value));
  };

  const render = (status: Status) => {
    return <h1>{status}</h1>;
  };

  ///////////////////////////////////////////////////////////////////////////////////////////
  //#region MAPS DATA & STATES
  ///////////////////////////////////////////////////////////////////////////////////////////

  const [zoom, setZoom] = React.useState(15); // initial zoom
  const [center, setCenter] = React.useState<google.maps.LatLngLiteral | null>({
    lat: 0,
    lng: 0,
  });

  const zoomChanged = (m: google.maps.Map) => {
    //console.log("zoom change", m.getZoom());
    const z = m.getZoom();
    if (z) {
      setZoom(z);
    }
  };

  //#endregion

  //#region Replay Path Details Managament

  const [pathDetailsMap, setPathDetailsMap] = React.useState<
    Map<number, pathDetails>
  >(new Map<number, pathDetails>());

  const [replayPathDetails, setReplayPathDetails] =
    React.useState<pathDetailsToShowInTheReplay>({
      lastTimeChange: 0,
      pathDetails: new Map<number, pathDetails>(),
      replayData: [],
    });

  const onPathDetailsChanged = (pathDetails: pathDetails) => {
    const partId = getCurrentParticipantId();
    let pathsMap = pathDetailsMap;
    pathsMap.set(partId, pathDetails);
    setPathDetailsMap(pathsMap);
    console.log("NEW PATH DETAILS???", pathDetails, partId);
    setReplayPathDetails({
      lastTimeChange: new Date().getTime(),
      pathDetails: pathsMap,
      replayData: replayData,
    });
  };

  //#endregion

  //#region Support functions
  const getCurrentParticipantId = () => {
    const participantId = document.getElementById(
      "currentParticipantId"
    ) as HTMLInputElement;
    let partId = Number(participantId.value);
    return isNaN(partId) ? 0 : partId;
  };
  //#endregion

  useEffect(() => {
    updateMapSize();
  }, [showEntryListBar, showItineraryBar, showOfficialCarsBar]);

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
            onChangeRallyClick={onChangeRallyClick}
            showEntryListButton={showEntryListBar}
            onShowEntryListButton={onShowEntryListBar}
            showItineraryButton={false}
            onShowItineraryButton={onShowItineraryBar}
            showOfficialCarButton={false}
            onShowOfficalCarBarButton={onShowOfficarCarBarButton}
            onNewMessageClick={onShowNewMessage}
            showChangeRallyButton={
              activeEvent ? activeEvent.rallies.length > 0 : false
            }
            noAlerts
            noNewMessage
            noOfficialCars
            user={null}
            userProfile={props.userProfile}
          />
          {showEntryListBar ? (
            <ReplayEntryBar
              replayData={replayData}
              replayQuery={replayQuery}
              ev={activeEvent}
              rally={rally}
              participants={participants}
              onParticipantClick={onParticipantClick}
              onNewQueryClick={onNewQueryClick}
              onReplayTime={onReplayTime}
            />
          ) : (
            ""
          )}
          <Row id="mainRowContent" ref={mainContent}>
            {showParticipantDetails ? (
              <Col className="col-auto" style={verticalDivider}>
                <ParticipantReplayDetails
                  onPathDetails={onPathDetailsChanged}
                  ev={activeEvent}
                  participantInfo={currentParticipantInfo}
                  position={replayRecordByParticipant.get(
                    Number(currentParticipantInfo?.id)
                  )}
                  countriesById={ppTrackerClient.countriesById}
                  participant={selectedParticipant}
                  onHide={onParticipantHide}
                  onCenter={onParticipantCenterMap}
                  userIsAdmin={props.loggedIn}
                  rally={rally}
                  ppTrackerClient={ppTrackerClient}
                  pathDetails={
                    currentParticipantInfo &&
                    pathDetailsMap.has(Number(currentParticipantInfo.id))
                      ? pathDetailsMap.get(Number(currentParticipantInfo.id))
                      : undefined
                  }
                />
              </Col>
            ) : (
              ""
            )}
            <Col id="mapColumn" style={verticalDivider} className="p-0">
              <Wrapper
                apiKey={"AIzaSyDv1JFAcNTizcqhVQE2jCN6sd7T0R2_vyc"}
                render={render}
              >
                <ReplayMap
                  kmlTrack={trackKmlLayer}
                  centerTo={center}
                  zoom={zoom}
                  scaleControl={true}
                  style={{
                    height: "100%", //mapHeight.toString() + "px",
                  }}
                  zoomChanged={zoomChanged}
                  //centerChanged={centerChanged}
                  //dragStart={onDragStart}
                  //style={{ flexGrow: "1", width: "100%", height: "100%" }}
                  replayPathDetails={replayPathDetails}
                >
                  {waypoints.map((w) => (
                    <WaypointMarker
                      waypoint={props.loggedIn ? w : undefined}
                      wpType={getWaypointTypeFor(w)}
                      opacity={0.75}
                      zIndex={100 - Number(w.waypoint_type_id)}
                      key={w.id.toString()}
                      icon={
                        waypointMarkers.has(Number(w.waypoint_type_id))
                          ? waypointMarkers.get(Number(w.waypoint_type_id))
                          : waypointMarkerIcon
                      }
                      position={{
                        lat: w.lat / 10000000,
                        lng: w.lon / 10000000,
                      }}
                      title={w.name}
                      label={{
                        fontSize: "18px",
                        color: "#000",
                        fontWeight: "bold",
                        text: waypointMarkers.has(Number(w.waypoint_type_id))
                          ? " "
                          : w.name,
                      }}
                    />
                  ))}
                  {participants
                    .filter(
                      (p) =>
                        replayRecordByParticipant.has(Number(p.id)) &&
                        replayRecordByParticipant.get(Number(p.id)) !==
                          undefined
                    )
                    .map((p) => (
                      <ParticipantMarker
                        participantId={Number(p.id)}
                        onParticipantClick={onParticipantMarkerClick}
                        zIndex={
                          currentParticipantInfo !== undefined &&
                          currentParticipantInfo.id === p.id
                            ? 1500
                            : 1000
                        }
                        key={Number(p.id)}
                        icon={getParticipantMarkerIconByStatus(p)}
                        position={{
                          lat: replayRecordByParticipant.has(Number(p.id))
                            ? (
                                replayRecordByParticipant.get(
                                  Number(p.id)
                                ) as apiPositionRecord
                              ).lat
                            : 0,
                          lng: replayRecordByParticipant.has(Number(p.id))
                            ? (
                                replayRecordByParticipant.get(
                                  Number(p.id)
                                ) as apiPositionRecord
                              ).lon
                            : 0,
                        }}
                        title={p.number}
                        label={{
                          fontSize: "18px",
                          color: getParticipantMarkerTextColorByStatus(p),
                          fontWeight: "bold",
                          text: p.number,
                        }}
                      />
                    ))}
                </ReplayMap>
              </Wrapper>
            </Col>
          </Row>
        </Container>
        {rally !== undefined &&
          (showRequestForm || replayQuery === undefined) && (
            <RequestQueryFormComponent
              ev={activeEvent}
              query={replayQuery}
              onRequestData={onRequestData}
              onHide={onHideNewMessage}
              participants={rally.participants}
              stages={rally?.stages}
              ppTrackerClient={ppTrackerClient}
              rallyId={rally ? rally.id : 0n}
            />
          )}
      </main>

      <footer></footer>
    </Fragment>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const evSlug: string = context.query.eventSlug as string;
  const rallySlug: string =
    "rally" in context.query ? (context.query.rally as string) : "";

  console.log(">> REPLAY QUERY: ", context.query);

  const { req } = context;
  const session = await getSession({ req });
  const prismaClient = new PrismaClient();

  const waypoint_types = await prismaClient.waypoint_types.findMany();

  prismaClient.$disconnect();

  return {
    props: {
      loggedIn: session ? true : false,
      userProfile: session ? session.userProfile : null,
      currentEventSlug: evSlug,
      currentEvent: "",
      currentRallySlug: rallySlug,
      rallies: "",
      waypoint_types: superjson.stringify(waypoint_types),
    },
  };
};

export default Replay;
