import type { NextPage, GetServerSideProps } from "next";
import Head from "next/head";
import { getSession, useSession } from "next-auth/react";
import { Container, Row, Col } from "react-bootstrap";
import CSS from "csstype";
import superjson from "superjson";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import React, { useEffect, useState, useRef, Fragment } from "react";
import {
  messages,
  participant,
  PrismaClient,
  stage,
  stage_statuses,
  track_waypoints,
  waypoint_types,
} from "@prisma/client";
import {
  eventInfo,
  ppTrackerClient,
  rallyInfo,
  participantInfo,
  getParticipantStatus,
  participantStatus,
} from "server/ppTrackerdataServerIoClient";
import {
  flagCommand,
  FlagType,
  rallyAlert,
} from "server/shared/socket_io_packets";
import ParticipantDetails from "components/events/participantDetails";
import StageDetails from "components/events/stageDetails";
import AlertsResume from "components/events/alertsResume";
import CurrentEventBar from "components/events/currentEventBar";
import ItineraryBar from "components/events/itineraryBar";
import EntryListBar from "components/events/entryListBar";
import ParticipantMarker from "components/maps/ParticipantMarker";
import WaypointMarker from "components/maps/WaypointMarker";
import OfficialCarDetails from "components/events/oficialCarDetails";
import OfficialCarsBar from "components/events/oficialCarsBar";
import SendMessageComponent from "components/events/sendMessage";
import TrackingMap from "components/maps/TrackingMap";
import type { DefaultUser } from "next-auth";
import {
  initWaypointIconMarkers,
  initWaypointIconMarkers2,
} from "components/events/maps/resources";
import { Alert } from "bootstrap";
import AlertsResume2 from "components/events/alertsResume2";
import { get } from "http";

interface AlertIcon {
  id: number;
  name: string;
  icon: string;
}

interface EventProps {
  loggedIn: boolean;
  currentEvent: string;
  currentRallySlug: string;
  currentEventSlug: string;
  rallies: string;
  stageStatuses: string;
  waypoint_types: string;
  waypoint_icons_set: string;
  s3PublicPath: string;
  s3RallyKmlFolder: string;
  s3RallyRcKmlFolder: string;
  s3WaypointIconsFolder: string;
  waypointIconsSet: string;
  alertIcons: AlertIcon[];
  user:
    | (DefaultUser & {
        id: string;
        role: string;
      })
    | null;
  userProfile: {
    id: number;
    roleid: number;
    role: string;
  };
  messages: string;
}

const verticalDivider: CSS.Properties = {
  borderRight: "1px solid #777",
};

const Rally: NextPage<EventProps> = (props) => {
  const waypointMarkerIcon =
    "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/WaypointMarker.png";
  const officialCarMarkerIcon =
    "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/officialCarMarker.png";

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

  const session = useSession();
  const profile = session ? session.data?.userProfile : null;

  const getParticipantMarkerTextColorByStatus = (pInfo: participantInfo) => {
    if (pInfo.is_officialcar) {
      return "#000";
    } else {
      const st = getParticipantStatus(
        pInfo,
        rallyStages,
        props.user !== null ? props.user : undefined
      );

      switch (st) {
        case participantStatus.transport_disconnected:
          return "#ffc107"; //warning
        case participantStatus.transport_moving:
          return "#fff";
        case participantStatus.transport_stopped:
          return "#fff";
        case participantStatus.stage_moving:
          return "#000";
        case participantStatus.stage_stopped:
          return "#000";
        case participantStatus.stage_stopped_warning:
          return "#ffc107"; //warning
        case participantStatus.stage_sos:
          return "#fff";
        case participantStatus.stage_sos_viewer:
          return "#000";
        case participantStatus.stage_sos_ok:
          return "#fff";
        case participantStatus.stage_sos_ok_viewer:
          return "#000";
        case participantStatus.unknown:
          return "#000";
      }

      // let isTransport = true;
      // if (pInfo.position) {
      //   //Calculate isTransport
      //   if (
      //     rInfo &&
      //     pInfo.position?.stage_id > 0 &&
      //     rInfo.stages !== undefined
      //   ) {
      //     for (var st of rInfo.stages) {
      //       if (Number(st.id) === pInfo.position.stage_id) {
      //         isTransport = st.stage_type_id !== 2n;
      //       }
      //     }
      //   }
      //   //Calculate isStopped
      //   const d = new Date();
      //   const dMillis = d.getTime();
      //   if (dMillis - 60 * 1000 < pInfo.position.time) {
      //     //RUNNING
      //     return isTransport ? "#fff" : "#000";
      //   } else {
      //     //STOPPED
      //     return isTransport ? "#000" : "#000";
      //   }
      // } else {
      //   return markers.get("gray") as string;
      // }
    }
  };

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

  const showParticipantMarker = (p: participantInfo) => {
    if (p.is_officialcar === true) return false;
    if (p.position && p.position.time >= new Date().getTime() - 30 * 60000) {
      return true;
    } else if (
      currentParticipantInfo !== undefined &&
      p.id === currentParticipantInfo.id
    ) {
      return true;
    } else {
      return false;
    }
  };

  const showOfficialCarMarker = (p: participantInfo) => {
    if (
      p.is_officialcar === false ||
      props.user === null ||
      (props.user && props.user.role === "viewer")
    ) {
      return false;
    }
    if (p.position && p.position.time >= new Date().getTime() - 30 * 60000) {
      return true;
    } else if (
      selectedOfficialCar !== undefined &&
      p.id === selectedOfficialCar.id
    ) {
      return true;
    }
    return false;
    /*        
    if (
      p.is_officialcar === false ||
      props.user === null ||
      (props.user && props.user.role === "viewer")
    ) {
      return false;
    }
    if (
      p.position &&
      p.lastStopTime &&
      p.lastStopTime >= new Date().getTime() - 2 * 60000
    ) {
      return true;
    } else if (
      selectedOfficialCar !== undefined &&
      p.id === selectedOfficialCar.id
    ) {
      return true;
    } else {
      return false;
    }*/
  };

  const getParticipantMarkerIconByStatus = (pInfo: participantInfo) => {
    if (pInfo.is_officialcar) {
      return officialCarMarkerIcon;
    } else {
      const st = getParticipantStatus(
        pInfo,
        rallyStages,
        props.user !== null ? props.user : undefined
      );

      switch (st) {
        case participantStatus.transport_disconnected:
          return markers.get("gray") as string;
        case participantStatus.transport_moving:
          return markers.get("black") as string;

        case participantStatus.transport_stopped:
          return markers.get("gray") as string;

        case participantStatus.stage_moving:
          return markers.get("white") as string;

        case participantStatus.stage_stopped:
          return markers.get("yellow") as string;

        case participantStatus.stage_stopped_warning:
          return markers.get("white") as string;

        case participantStatus.stage_sos:
          return markers.get("red") as string;

        case participantStatus.stage_sos_viewer:
          return markers.get("white") as string;

        case participantStatus.stage_sos_ok:
          return markers.get("green") as string;

        case participantStatus.stage_sos_ok_viewer:
          return markers.get("white") as string;

        case participantStatus.unknown:
          return markers.get("gray") as string;
      }

      // let isTransport = true;
      // if (pInfo.position) {
      //   //Calculate isTransport
      //   if (
      //     rInfo &&
      //     pInfo.position?.stage_id > 0 &&
      //     rInfo.stages !== undefined
      //   ) {
      //     for (var st of rInfo.stages) {
      //       if (Number(st.id) === pInfo.position.stage_id) {
      //         isTransport = st.stage_type_id !== 2n;
      //       }
      //     }
      //   }
      //   //Calculate isStopped
      //   const d = new Date();
      //   const dMillis = d.getTime();
      //   if (dMillis - 60 * 1000 < pInfo.position.time) {
      //     //RUNNING
      //     return isTransport
      //       ? (markers.get("black") as string)
      //       : (markers.get("white") as string);
      //   } else {
      //     //STOPPED
      //     return isTransport
      //       ? (markers.get("gray") as string)
      //       : (markers.get("yellow") as string);
      //   }
      // } else {
      //   return markers.get("gray") as string;
      // }
    }
  };

  const [messages, setMessages] = useState<messages[]>([]);

  let stageWaypointRef = useRef();

  const [activeEvent, setActiveEvent] = React.useState<eventInfo | undefined>(
    undefined
  );
  const [rally, setRally] = React.useState<rallyInfo | undefined>(undefined);
  const [stageStatuses, setStageStatuses] = React.useState<stage_statuses[]>(
    []
  );
  const [waypointMarkers, setWaypointMarkers] = React.useState<
    Map<number, string>
  >(new Map<number, string>());
  const [waypointTypes, setWaypointTypes] = React.useState<
    Map<bigint, waypoint_types>
  >(new Map<bigint, waypoint_types>());
  const [rallyStages, setRallyStages] = React.useState<Map<bigint, stage>>(
    new Map<bigint, stage>()
  );
  const [participants, setParticipants] = React.useState<participantInfo[]>([]);
  const [rallyAlerts, setRallyAlerts] = React.useState<rallyAlert[]>([]);
  // const [filteredRallyAlerts, setFilteredRallyAlerts] = React.useState<rallyAlert[]>([]);
  //const [sosAlerts, setSosAlerts] = React.useState<apiSosAlert[]>([]);
  //const [sosTypeData, setSosTypeData] = React.useState<apiSosTypeData[]>([]);
  const [currentParticipantInfo, setCurrentParticipantInfo] = React.useState<
    participantInfo | undefined
  >(undefined);
  const [currentOfficialCarInfo, setCurrentOfficialCarInfo] = React.useState<
    participantInfo | undefined
  >(undefined);

  //const [positions, setPositions] = React.useState<apiPosition[]>([]);
  const [waypoints, setWaypoints] = React.useState<track_waypoints[]>([]);
  //const [mapHeight, setMapHeight] = useState<number>(200);
  const [contentHeight, setContentHeight] = useState<number>(200);
  const [trackKmlLayer, setTrackKmlLayer] = useState<
    google.maps.KmlLayer | undefined
  >(undefined);

  const [rctrackKmlLayer, setRcTrackKmlLayer] = useState<
    google.maps.KmlLayer | undefined
  >(undefined);

  // useLayoutEffect(() => {
  //   function updateSize() {
  //     setMapHeight(window.innerHeight - 250);
  //     //console.log("SCREEN RESIZE, NEW SIZE...", mapHeight);
  //   }
  //   window.addEventListener("resize", updateSize);
  //   updateSize();
  //   return () => window.removeEventListener("resize", updateSize);
  // }, []);

  const mainContent = useRef(null);
  const alertsDiv = useRef(null);

  const updateMapSize = () => {
    //setMapHeight(window.innerHeight - 250);
    //console.log(mainContent);
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
      setContentHeight(newHeight);
    }

    //console.log("SCREEN RESIZE, NEW SIZE...", mapHeight);
  };

  useEffect(() => {
    console.log(
      ">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> EXECUTING useEffect <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
    );

    const eventsMessages: messages[] = superjson.parse(props.messages);
    setMessages(eventsMessages);

    const statuses: stage_statuses[] = superjson.parse(props.stageStatuses);
    setStageStatuses(statuses);
    const waypoint_types: waypoint_types[] = superjson.parse(
      props.waypoint_types
    );
    let wpTypes = new Map<bigint, waypoint_types>();
    for (var wpType of waypoint_types) {
      wpTypes.set(wpType.id, wpType);
    }
    setWaypointTypes(wpTypes);
    // setWaypointMarkers(initWaypointIconMarkers("v5.1", waypoint_types));
    console.log("THIS IS THE WAYPOINT ICONS SET: ", props.waypointIconsSet);
    setWaypointMarkers(
      initWaypointIconMarkers2(
        props.s3PublicPath,
        props.s3WaypointIconsFolder,
        props.waypointIconsSet,
        waypoint_types
      )
    );
    if (props.loggedIn) {
      console.log("ADDING JOIN TO CHANNEL: incidences");
      ppTrackerClient.join("incidences");
    }
    ppTrackerClient.start();
    ppTrackerClient.on("activeEvents", () => onActiveEvents());
    //ppTrackerClient.on("positions", (rallyId) => onPositions(rallyId));
    ppTrackerClient.on("participants", (rallyId) =>
      onParticipantsUpdate(rallyId)
    );
    ppTrackerClient.on("rallyAlerts", (rallyId) =>
      onRallyAlertsUpdate(rallyId)
    );

    function handleResize() {
      //console.log("resized to: ", window.innerWidth, "x", window.innerHeight);
      updateMapSize();
    }
    window.addEventListener("resize", handleResize);
    handleResize();
  }, []);

  const onActiveEvents = (): void => {
    console.log("RECEIVING ACTIVE EVENTS!!");

    if (ppTrackerClient.activeEventsBySlug.has(props.currentEventSlug)) {
      //LOAD CURRENT EVENT INFO
      const activeEvent = ppTrackerClient.activeEventsBySlug.get(
        props.currentEventSlug
      );
      //console.log("EVENT SLUG IS FOUND!!");
      const previousSelectedStage = selectedStage;

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
        console.log(
          "<<<<<<<<<<<<<<<<< Setting rally: >>>>>>>>>>>>>>>>>>>",
          r.name,
          r.id
        );
        setRally(r);
        let stages = new Map<bigint, stage>();
        let newSelectedStage: stage | undefined = undefined;
        for (var st of r.stages) {
          stages.set(st.id, st);
          if (previousSelectedStage && previousSelectedStage.id == st.id) {
            newSelectedStage = st;
          }
        }
        setSelectedStage(newSelectedStage);
        setRallyStages(stages);
        setParticipants(r.participants);
        if (ppTrackerClient.rallyAlerts.has(Number(r.id))) {
          console.log(">>>>>>>>>>>>>>>>>>> SETTINGS INITIAL RALLY ALERTS.....");
          setRallyAlerts(
            ppTrackerClient.rallyAlerts.get(Number(r.id)) as rallyAlert[]
          );
        } else {
          console.log(
            ">>>>>>>>>>>>>>>>>>>>>> NO SOS ALERTS AVAILABLE FOR RALLY ",
            r.id
          );
        }

        let ctaLayer = new google.maps.KmlLayer({
          url:
            props.s3PublicPath + "/" + props.s3RallyKmlFolder + "/" + r.id + "/" + r.rally_kml_file,
          screenOverlays: true,
          map: undefined,
          zIndex: 2000,
          //preserveViewport: true,
          clickable: false,
        });
        if (props.loggedIn || r.show_track_on_viewers) {
          setTrackKmlLayer(ctaLayer);
        }
        const viewport = ctaLayer.getDefaultViewport();
        if (viewport != null) {
          setCenter({
            lat: viewport.getCenter().lat(),
            lng: viewport.getCenter().lng(),
          });
        }

        let ctaRCLayer = new google.maps.KmlLayer({
          url:
          props.s3PublicPath + "/" + props.s3RallyRcKmlFolder + "/" + r.id + "/" + r.rally_rc_kml_file,
            // "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/tracks/" +
            // r.rally_rc_kml_file,
          screenOverlays: true,
          map: undefined,
          zIndex: 2000,
          //preserveViewport: true,
          clickable: false,
        });
        // if (props.loggedIn || r.show_track_on_viewers) {
        //   setRcTrackKmlLayer(ctaRCLayer);
        // }
        if (props.loggedIn && (props.userProfile.role === "Race Control Operator" || props.userProfile.role === "Race Control Viewer")) {
          setRcTrackKmlLayer(ctaRCLayer);
        }
        const rcviewport = ctaRCLayer.getDefaultViewport();
        if (rcviewport != null) {
          setCenter({
            lat: rcviewport.getCenter().lat(),
            lng: rcviewport.getCenter().lng(),
          });
        }

        //onPositions(Number(r.id));
      }
    } else {
      //TODO: ASK SOCKET IO FOR "CLOSED" event info.
    }
  };

  const onRallyAlertsUpdate = (rallyId: number): void => {
    console.log("SETTING NEW RALLY ALERTS....????");

    const hiddenRallyId = document.getElementById(
      "currentRallyId"
    ) as HTMLInputElement;

    if (
      rallyId === Number(hiddenRallyId.value) &&
      ppTrackerClient.rallyAlerts.has(rallyId)
    ) {
      setRallyAlerts(ppTrackerClient.rallyAlerts.get(rallyId) as rallyAlert[]);
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
      let officialId = 0;

      const currentParticipantId = document.getElementById(
        "currentParticipantId"
      ) as HTMLInputElement;
      partId =
        currentParticipantId !== null ? Number(currentParticipantId.value) : 0;

      const currentOfficialCarId = document.getElementById(
        "currentOfficialCarId"
      ) as HTMLInputElement;
      officialId =
        currentOfficialCarId !== null ? Number(currentOfficialCarId.value) : 0;

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
          if (officialId === Number(pInfo.id)) {
            //set Official Details Info Object
            setCurrentOfficialCarInfo(pInfo);
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

  const [showStageDetails, setShowStageDetails] =
    React.useState<boolean>(false);
  const [selectedStage, setSelectedStage] = React.useState<stage | undefined>(
    undefined
  );

  const [showOfficialCarDetails, setShowOfficialCarDetails] =
    React.useState<boolean>(false);
  const [selectedOfficialCar, setSelectedOfficialCar] = React.useState<
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

  const [showAlertsBar, setShowAlertsBar] = React.useState<boolean>(false);
  const onShowAlertsBar = () => {
    setShowAlertsBar(!showAlertsBar);
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

  const onParticipantClick2 = (participantNumber: string) => {
    setShowParticipantDetails(true);
    const part = ppTrackerClient.getRallyParticipantWithNumber(
      Number(rally?.id),
      participantNumber
    );
    setSelectedParticipant(part);
    setCurrentParticipantInfo(findParticipantInfoForId(part?.id));
    centerMapOnParticipantNumber(participantNumber);
  };

  const centerMapOnParticipantNumber = (participantNumber: string) => {
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
    const part = ppTrackerClient.rallyParticipantsById
      .get(Number(rally?.id))
      ?.get(participantId);
    if (part && part.position) {
      const p = { lat: part.position.lat, lng: part.position.lon };
      //console.log("center participant to...", p);
      setCenter(p);
      const stage = ppTrackerClient.getRallyStageWithId(
        Number(rally?.id),
        part.position.stage_id
      );
      if (stage) {
        setSelectedStage(stage);
        let wpoints = rally?.waypoints.filter(
          (w) => w.track_id === stage?.track_id
        );
        if (wpoints) {
          setWaypoints(wpoints);
        } else {
          setWaypoints([]);
        }
      } else {
        setWaypoints([]);
      }
      if (zoom < 18) {
        setZoom(17);
      } else if (zoom > 14) {
        setZoom(17);
      }
    }

    // const rallyPositions = ppTrackerClient.rallyPositionsByParticipantId.get(
    //   Number(rally?.id)
    // );

    // if (rallyPositions) {
    //   const apiPosition = rallyPositions?.get(participantId);

    //   if (apiPosition) {
    //     const p = { lat: apiPosition.lat, lng: apiPosition.lon };
    //     console.log("center participant to...", p);
    //     setCenter(p);

    //     apiPosition.stage_id;

    //     const stage = ppTrackerClient.getRallyStageWithId(
    //       Number(rally?.id),
    //       apiPosition.stage_id
    //     );
    //     if (stage) {
    //       setSelectedStage(stage);

    //       //console.log("Selected Stage is....", stage);

    //       let wpoints = rally?.waypoints.filter(
    //         (w) => w.track_id === stage?.track_id
    //       );
    //       //console.log("STAGE WAYPOINTS:", wpoints);
    //       if (wpoints) {
    //         //console.log("SETTING WAYPOINTS....");
    //         setWaypoints(wpoints);
    //       } else {
    //         setWaypoints([]);
    //       }
    //     } else {
    //       setWaypoints([]);
    //     }
    //     if (zoom < 18) {
    //       setZoom(17);
    //     } else if (zoom > 14) {
    //       setZoom(17);
    //     }
    //   }
    // }
  };

  const onParticipantHide = () => {
    setShowParticipantDetails(false);
  };

  const onCenterMapOnParticipant = (participantId: number) => {
    centerMapOnParticipantId(participantId);
  };
  const onParticipantCenterMap = () => {
    const participantId = document.getElementById(
      "currentParticipantId"
    ) as HTMLInputElement;
    centerMapOnParticipantId(Number(participantId.value));
  };

  const onOfficialCarCenterMap = () => {
    const participantId = document.getElementById(
      "currentOfficialCarId"
    ) as HTMLInputElement;
    centerMapOnParticipantId(Number(participantId.value));
  };

  const latlngToKm = (pos: number) => {
    return pos / 10000000;
  };

  const onStageClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.currentTarget.getAttribute("id")) {
      const st = e.currentTarget.getAttribute("id")!;
      setShowStageDetails(true);

      const stage = ppTrackerClient.getRallyStageWithId(
        Number(rally?.id),
        parseInt(st, 10)
      );
      if (stage) {
        setSelectedStage(stage);

        console.log("Selected Stage is....", stage);

        let wpoints = rally?.waypoints.filter(
          (w) => w.track_id === stage?.track_id
        );
        //console.log("STAGE WAYPOINTS:", wpoints);
        if (wpoints) {
          console.log("SETTING WAYPOINTS....");
          setWaypoints(wpoints);

          if (wpoints.length > 0) {
            let isFirst: boolean = true;
            let minLat: number = 0;
            let maxLat: number = 0;
            let minLon: number = 0;
            let maxLon: number = 0;
            for (var wp of wpoints) {
              if (isFirst || wp.lat < minLat) {
                minLat = wp.lat;
              }
              if (isFirst || wp.lat > maxLat) {
                maxLat = wp.lat;
              }
              if (isFirst || wp.lon < minLon) {
                minLon = wp.lon;
              }
              if (isFirst || wp.lon > maxLon) {
                maxLon = wp.lon;
              }
              isFirst = false;
            }
            const p = {
              lat: latlngToKm(minLat + (maxLat - minLat) / 2),
              lng: latlngToKm(minLon + (maxLon - minLon) / 2),
            };
            console.log(">>>>>>>>> at position ..... ", p);
            setCenter(p);
          }
        } else {
          setWaypoints([]);
        }
      } else {
        console.log("NO STAGE FOUND WITH ID ", st, rally);
        setWaypoints([]);
      }
    }
  };

  const onStageHide = () => {
    console.log("HIDDING STAGE....");
    setShowStageDetails(false);
  };

  const onStageRedFlag = () => {
    const w = document.getElementById("stageWaypoint") as HTMLSelectElement;
    const stageId = document.getElementById(
      "currentStageId"
    ) as HTMLInputElement;

    const cmd: flagCommand = {
      rallyId: rally ? Number(rally.id) : 0,
      flag: FlagType.RedFlag,
      stageId: Number(stageId.value),
      waypointId: Number(w.value),
    };

    ppTrackerClient.setStageFlag(cmd);
  };

  const onStageYellowFlag = () => {
    const w = document.getElementById("stageWaypoint") as HTMLSelectElement;
    const stageId = document.getElementById(
      "currentStageId"
    ) as HTMLInputElement;

    console.log(stageId);
    const cmd: flagCommand = {
      rallyId: rally ? Number(rally.id) : 0,
      flag: FlagType.YellowFlag,
      stageId: Number(stageId.value),
      waypointId: Number(w.value),
    };

    ppTrackerClient.setStageFlag(cmd);

    // if (e.currentTarget.getAttribute("id")) {
    //   const id = e.currentTarget.getAttribute("id")!;
    //   setStageFlag(id);
    // }
  };

  const onStageClosed = (closed: number) => {
    console.log("On Stage Closed:", closed);
    const stageId = document.getElementById(
      "currentStageId"
    ) as HTMLInputElement;

    ppTrackerClient.setStageClosed(
      rally ? Number(rally.id) : 0,
      Number(stageId.value),
      closed
    );
  };

  const onStageStatus = (newStatus: number) => {
    console.log("On Stage Status:", newStatus);
    const stageId = document.getElementById(
      "currentStageId"
    ) as HTMLInputElement;
    ppTrackerClient.setStageStatus(
      rally ? Number(rally.id) : 0,
      Number(stageId.value),
      newStatus
    );
  };

  const onNoFlag = () => {
    const w = document.getElementById("stageWaypoint") as HTMLSelectElement;
    const stageId = document.getElementById(
      "currentStageId"
    ) as HTMLInputElement;

    console.log(stageId);
    const cmd: flagCommand = {
      rallyId: rally ? Number(rally.id) : 0,
      flag: FlagType.NoFlag,
      stageId: Number(stageId.value),
      waypointId: Number(w.value),
    };
    ppTrackerClient.setStageFlag(cmd);
  };

  const onOfficialCarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.currentTarget.getAttribute("id")) {
      const p = e.currentTarget.getAttribute("id")!;
      //console.log(p);
      setShowOfficialCarDetails(true);
      const part = ppTrackerClient.getRallyParticipantWithNumber(
        Number(rally?.id),
        p
      );
      setSelectedOfficialCar(part);
      centerMapOnParticipantNumber(p);
      setCurrentOfficialCarInfo(findParticipantInfoForId(part?.id));
    }
  };

  const onOfficialCarHide = () => {
    setShowOfficialCarDetails(false);
  };

  //const [showEntryList, setShowEntrylist] = React.useState<boolean>(false); //DEPRECATED

  ///////////////////////////////////////////////////////////////////////////////////////////
  // FAKE DATA SECTION
  ///////////////////////////////////////////////////////////////////////////////////////////
  // const participantIntervals = {
  //   number: "23",
  //   intervals: [
  //     { idx: 1, time: 1643712068807 },
  //     { idx: 2, time: 1643712071807 },
  //     { idx: 3, time: undefined },
  //     { idx: 4, time: 1643712292137 },
  //     { idx: 5, time: undefined },
  //   ],
  //   startTime: 1643712068807,
  //   endTime: undefined,
  // };

  //const leg1: LegData = { day: 1, date: "15/1/2021", number: 1 };
  const render = (status: Status) => {
    return <h1>{status}</h1>;
  };

  //const [showItinerary, setShowItinerary] = React.useState<boolean>(false);
  //const [showAdminTools, setShowAdminTools] = React.useState<boolean>(false);

  ///////////////////////////////////////////////////////////////////////////////////////////
  // MAPS DATA & STATES
  ///////////////////////////////////////////////////////////////////////////////////////////
  //const [clicks, setClicks] = React.useState<google.maps.LatLng[]>([]);
  const [zoom, setZoom] = React.useState(15); // initial zoom
  const [center, setCenter] = React.useState<google.maps.LatLngLiteral | null>({
    lat: 0,
    lng: 0,
  });

  const zoomChanged = (m: google.maps.Map) => {
    //console.log("zoom", m.getZoom());
    const z = m.getZoom();
    if (z) {
      setZoom(z);
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

  const hasFilteredAlerts = () => {
    const filteredAlerts = rallyAlerts.filter((alert) => {
      if ("ack_time" in alert.alert && "end_time" in alert.alert) {
        // alert es de tipo apiSosAlertMerge
        return !alert.alert.ack_time && !alert.alert.end_time;
      }
      return false; // Si alert no es de tipo apiSosAlertMerge, incluir en los resultados
    });

    if (filteredAlerts.length > 0) {
      return true;
    }
    // console.log("filteredAlerts", filteredAlerts.length, filteredAlerts);
    return false;
  };

  const alertsExist = hasFilteredAlerts();

  useEffect(() => {
    updateMapSize();
  }, [showAlertsBar, showEntryListBar, showItineraryBar, showOfficialCarsBar]);

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
            showAlertsButton={showAlertsBar}
            onShowAlertsButton={onShowAlertsBar}
            showEntryListButton={showEntryListBar}
            onShowEntryListButton={onShowEntryListBar}
            showItineraryButton={showItineraryBar}
            onShowItineraryButton={onShowItineraryBar}
            showOfficialCarButton={showOfficialCarsBar}
            onShowOfficalCarBarButton={onShowOfficarCarBarButton}
            onNewMessageClick={onShowNewMessage}
            showChangeRallyButton={
              activeEvent ? activeEvent.rallies.length > 0 : false
            }
            user={props.user}
            userProfile={props.userProfile}
          />
          {showEntryListBar ? (
            <EntryListBar
              rally={rally}
              participants={participants}
              onParticipantClick={onParticipantClick}
              user={props.user != null ? props.user : undefined}
            />
          ) : (
            ""
          )}
          {showItineraryBar ? (
            <ItineraryBar rally={rally} onStageClick={onStageClick} />
          ) : (
            ""
          )}
          {showOfficialCarsBar ? (
            <OfficialCarsBar rally={rally} onClick={onOfficialCarClick} />
          ) : (
            ""
          )}
          <Row id="mainRowContent" ref={mainContent}>
            {showStageDetails ? (
              <Col xs="12" sm="12" md="4" lg="2" xl="2" style={verticalDivider}>
                <StageDetails
                  userIsAdmin={props.loggedIn}
                  waypointRef={stageWaypointRef}
                  rally={rally}
                  stage={selectedStage}
                  onHide={onStageHide}
                  onRedFlag={onStageRedFlag}
                  onYellowFlag={onStageYellowFlag}
                  onNoFlag={onNoFlag}
                  onStageClosed={onStageClosed}
                  onStageStatus={onStageStatus}
                  stageStatuses={stageStatuses}
                  user={props.user}
                />
              </Col>
            ) : (
              ""
            )}
            {showParticipantDetails ? (
              <Col xs="12" sm="12" md="4" lg="2" xl="2" style={verticalDivider}>
                <ParticipantDetails
                  ev={activeEvent}
                  participantInfo={currentParticipantInfo}
                  countriesById={ppTrackerClient.countriesById}
                  participant={selectedParticipant}
                  onHide={onParticipantHide}
                  onCenter={onParticipantCenterMap}
                  userIsAdmin={props.loggedIn}
                  rally={rally}
                  ppTrackerClient={ppTrackerClient}
                />
              </Col>
            ) : (
              ""
            )}
            {showOfficialCarDetails ? (
              <Col xs="12" sm="12" md="4" lg="2" xl="2" style={verticalDivider}>
                <OfficialCarDetails
                  ev={activeEvent}
                  participantInfo={currentOfficialCarInfo}
                  officialCar={selectedOfficialCar}
                  onHide={onOfficialCarHide}
                  onCenter={onOfficialCarCenterMap}
                  userIsAdmin={props.loggedIn}
                  rally={rally}
                  ppTrackerClient={ppTrackerClient}
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
                <TrackingMap
                  isFractionalZoomEnabled={true}
                  kmlTrack={trackKmlLayer}
                  rckmlTrack={rctrackKmlLayer}
                  centerTo={center}
                  scaleControl={true}
                  zoom={zoom}
                  style={{
                    height: "100%",
                  }}
                  zoomChanged={zoomChanged}
                >
                  {(props.loggedIn ||
                    (rally && rally.show_waypoints_on_viewers)) &&
                    waypoints.map((w) => (
                      <WaypointMarker
                        waypoint={props.loggedIn ? w : undefined}
                        wpType={getWaypointTypeFor(w)}
                        opacity={0.9}
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
                        p.position &&
                        p.position.lat !== 0 &&
                        p.position.lon !== 0 &&
                        (showParticipantMarker(p) || showOfficialCarMarker(p))
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
                          lat: p.position ? p.position.lat : 0,
                          lng: p.position ? p.position.lon : 0,
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
                  {/*positions
                    .filter(
                      (p) =>
                        p.rallyid === Number(rally?.id) &&
                        p.lat !== 0 &&
                        p.lon !== 0
                    )
                    .map((p) => (
                      <ParticipantMarker
                        zIndex={1000}
                        key={p.participantid}
                        icon={participantMarkerIcon}
                        position={{ lat: p.lat, lng: p.lon }}
                        title={
                          ppTrackerClient.rallyParticipantsById
                            .get(Number(rally?.id))
                            ?.get(p.participantid)?.number
                        }
                        label={{
                          fontSize: "18px",
                          color: "#000",
                          fontWeight: "bold",
                          text: undefinedToEmptyText(
                            ppTrackerClient.rallyParticipantsById
                              .get(Number(rally?.id))
                              ?.get(p.participantid)?.number
                          ),
                        }}
                      />
                      ))*/}
                </TrackingMap>
              </Wrapper>
              {/* Basic form for controlling center and zoom of map. */}
              {/*form*/}
            </Col>
            { profile && (showAlertsBar || alertsExist) ? (
              <Col
                xs="12"
                sm="12"
                md="7"
                lg="7"
                xl="4"
                xxl="4"
                className="bg-dark px-0"
                ref={alertsDiv}
              >
                {alertsExist && (profile && profile.role === "Race Control Operator" || profile.role === "Race Control Viewer") && (
                  <div
                    className="mb-2"
                    style={{ height: "400px", overflow: "auto" }}
                  >
                    <AlertsResume2
                      event={activeEvent}
                      maxHeight={contentHeight}
                      alerts={rallyAlerts}
                      participants={participants}
                      stages={rally ? rally.stages : []}
                      ppTrackerClient={ppTrackerClient}
                      onCenterMapOnParticipant={onCenterMapOnParticipant}
                      alertIcons={props.alertIcons}
                      onParticipantClick={onParticipantClick2}
                    ></AlertsResume2>
                  </div>
                )}

                {showAlertsBar && (
                  <AlertsResume
                    event={activeEvent}
                    maxHeight={contentHeight}
                    alerts={rallyAlerts}
                    participants={participants}
                    stages={rally ? rally.stages : []}
                    ppTrackerClient={ppTrackerClient}
                    onCenterMapOnParticipant={onCenterMapOnParticipant}
                    alertIcons={props.alertIcons}
                    onParticipantClick={onParticipantClick2}
                  ></AlertsResume>
                )}
              </Col>
            ) : (
              ""
            )}
          </Row>
          {/*<Row>
            <Col className="m-3">
              <Alert variant="danger" className="fw-bold">
                <Row>
                  <Col className="col-auto display-5  mx-5 fw-bold">
                    S.O.S. from participant{" "}
                    <span className="fw-bolder text-black">33</span> at Stage
                    <span className="fw-bolder text-black"> SS2</span>
                  </Col>
                  <Col className="col-auto px-0 my-2 ml-5 mr-1">
                    <Button variant="danger" className="fw-bold btn-lg">
                      Details
                    </Button>
                  </Col>
                  <Col className="col-auto px-0 my-2 mx-1 ">
                    <Button variant="danger" className="btn-lg fw-bold">
                      Dismiss
                    </Button>
                  </Col>
                </Row>
              </Alert>
            </Col>
          </Row>*/}
        </Container>
        {showNewMessage && rally !== undefined && (
          <SendMessageComponent
            onHide={onHideNewMessage}
            participants={rally?.participants}
            stages={rally?.stages}
            priority={"NORMAL"}
            ppTrackerClient={ppTrackerClient}
            rallyId={rally ? rally.id : 0n}
            messages={messages}
          />
        )}
      </main>

      <footer></footer>
    </Fragment>
  );
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  const emptyProps = {
    props: {
      loggedIn: false,
      currentEvent: "",
      currentEventSlug: "",
      currentRallySlug: "",
      rallies: "",
      stageStatuses: "",
      waypoint_types: "",
      waypoint_icons_set: "",
      s3PublicPath: "",
      s3RallyKmlFolder: "",
      s3RallyRcKmlFolder: "",
      s3WaypointIconsFolder: "",
      waypointIconsSet: "",
      alertIcons: "",
      user: null,
      userProfile: null,
      messages: "",
    },
  };

  const slug: string[] = Array.isArray(context.query.slug)
    ? context.query.slug
    : [];
  if (slug.length === 0) return emptyProps;

  const evSlug = slug[0];
  const rallySlug = slug.length > 1 ? slug[1] : "";

  const { req } = context;
  const session = await getSession({ req });
  console.log("session from server SIDE:", session);
  console.log("session.user", session?.user);

  const prismaClient = new PrismaClient();

  const stage_statuses = await prismaClient.stage_statuses.findMany();
  const waypoint_types = await prismaClient.waypoint_types.findMany();
  const waypoint_icons_set = await prismaClient.waypoint_icon_set.findMany();

  const options = await prismaClient.application_settings.findFirst({
    orderBy: {
      id: 'asc',
    },
  });

  const messageSetId = options?.message_set_id;

  const s3PublicPath = options?.s3_public_path;
  const s3WaypointIconsFolder = options?.s3_waypoint_icons_folder;
  const s3AlertIconsFolder = options?.s3_alert_icons_folder;
  const s3RallyKmlFolder = options?.s3_rally_kml_folder;
  const s3RallyRcKmlFolder = options?.s3_rc_kml_folder;

  const s3DefaultWaypointIconSetId = options?.waypoints_icons_id;
  const s3DefaultWaypointIconSet =
    await prismaClient.waypoint_icon_set.findFirst({
      where: { id: s3DefaultWaypointIconSetId || 1 },
    });
  const s3DefaultAlertIconSetId = options?.alert_icons_id;
  const s3DefaultAlertIconSet = await prismaClient.alert_icon_set.findFirst({
    where: { id: s3DefaultAlertIconSetId || 1 },
  });

  const currentEventData = await prismaClient.event.findMany({
    where: { slug: evSlug },
  });
  console.log("CURRENT EVENT DATA:", currentEventData[0]);

  const currentRallyData = await prismaClient.rally.findFirst({
    where: { event_id: currentEventData[0]?.id || 0 },
  });
  console.log("CURRENT RALLY DATA:", currentRallyData);

  const currentRallyWaypointIconsSet =
    await prismaClient.waypoint_icon_set.findFirst({
      where: { id: currentRallyData?.waypoints_icons_id || 1 },
    });
  const currentRallyWaypointIconsSetFolder =
    currentRallyWaypointIconsSet?.name || "";
  // console.log(
  //   "CURRENT RALLY WAYPOINT ICONS SET FOLDER:",
  //   currentRallyWaypointIconsSetFolder
  // );
  const waypointIconsSet =
    currentRallyWaypointIconsSetFolder !== null &&
    currentRallyWaypointIconsSetFolder !== ""
      ? currentRallyWaypointIconsSetFolder
      : s3DefaultWaypointIconSet?.name || "";

  const currentRallyAlertIconsSet = await prismaClient.alert_icon_set.findFirst(
    {
      where: { id: currentRallyData?.alert_icons_id || 1 },
    }
  );
  const currentRallyAlertIconsSetFolder = currentRallyAlertIconsSet?.name || "";
  const alertIconsSet =
    currentRallyAlertIconsSetFolder !== null &&
    currentRallyAlertIconsSetFolder !== ""
      ? currentRallyAlertIconsSetFolder
      : s3DefaultAlertIconSet?.name || "";

  const baseAlertIconsPath =
    s3PublicPath + "/" + s3AlertIconsFolder + "/" + alertIconsSet + "/";

  const alertTypes = await prismaClient.alert_types.findMany();

  const alertIcons = alertTypes.map((at) => {
    return {
      id: Number(at.id),
      name: at.name,
      icon: baseAlertIconsPath + at.id + ".png",
    };
  });

  const messages = await prismaClient.messages.findMany({
    where: { message_set_id: messageSetId || 0 },
  });

  const messagestest = superjson.stringify(messages);
  const testset = superjson.parse(messagestest);

  console.log ("SET DE MENSAJES DE ALERTA:" , testset);
  // console.log("ALERT ICONS:", alertIcons);

  prismaClient.$disconnect();

  console.log("LOADING CURRENT RALLY SLUG, EVENT sLUG:", rallySlug, evSlug);
  return {
    props: {
      loggedIn: session ? true : false,
      user: session ? session.user : null,
      userProfile: session ? session.userProfile : null,
      currentEventSlug: evSlug,
      currentEvent: "",
      currentRallySlug: rallySlug,
      rallies: "",
      stageStatuses: superjson.stringify(stage_statuses),
      waypoint_types: superjson.stringify(waypoint_types),
      waypoint_icons_set: superjson.stringify(waypoint_icons_set),
      s3PublicPath: s3PublicPath,
      s3RallyKmlFolder: s3RallyKmlFolder,
      s3RallyRcKmlFolder: s3RallyRcKmlFolder,
      s3WaypointIconsFolder: s3WaypointIconsFolder,
      waypointIconsSet: waypointIconsSet,
      alertIcons: alertIcons,
      messages: superjson.stringify(messages),
    },
  };
};

export default Rally;
