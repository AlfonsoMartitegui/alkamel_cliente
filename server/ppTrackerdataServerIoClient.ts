import { io, Socket } from "socket.io-client";
import {
  country,
  event,
  participant,
  pptracker_shortcodes,
  rally,
  stage,
  track,
  stage_type,
  track_waypoints,
  speed_zones,
  netralization_zones,
  participant_categories,
} from "@prisma/client";
import {
  apiErrorMessage,
  apiEvent,
  apiEventInfo,
  apiRally,
  apiParticipant,
  apiStage,
  apiWaypoint,
  apiWaypointTime,
  apiParticipantWaypointTimes,
  apiWaypointParticipantTime,
} from "lib/apiV1Schema";
import bcrypt from "bcryptjs";
import superjson from "superjson";
import EventEmitter from "events";
import {
  flagCommand,
  messageCommand,
  sosAckCommand,
  ClientToServerEvents,
  ConnectedStatusData,
  ServerToClientEvents,
  apiSosTypeData,
  flagAlert,
  apiFlagAckData,
  apiFlagDisplayedData,
  rallyAlert,
  apiSosAlertMerge,
  positionRecordsRequestQuery,
  apiPositionRecord,
  apiFlagMergeAlert,
  apiStageEvent,
  stageEventQuery,
  incidencesQuery,
  apiIncidence,
  apiMessage,
  apiWaypointEvent,
  apiBlueFlag,
} from "./shared/socket_io_packets";

import { apiLogResponse, apiPosition, logLine } from "./shared/apiSharedTypes";
import { DefaultUser } from "next-auth";

export type rallyInfo = rally & {
  participants: participantInfo[];
  participant_categories: participant_categories[];
  stages: stage[];
  positions: apiPosition[];
  waypoints: track_waypoints[];
  track: trackInfo[];
};
export type trackInfo = track & {
  track_waypoints: track_waypoints[];
  speed_zones: speed_zones[];
  netralization_zones: netralization_zones[];
};

export type participantInfo = participant & {
  position: apiPosition | undefined;
  lastStopTime?: number;
  lastDataTime?: number;
  lastSosTime?: number;
  lastSosHasAck?: boolean;
  lastSosIsFinish?: boolean;
  connected: boolean;
};

export const MOVING_SPEED: number = 5;
export const STOPPED_AFTER_X_SECONDS: number = 60;
export const STOPPED_WARNING_AT_X_SECONDS: number = 15;
export enum participantStatus {
  transport_moving,
  transport_stopped,
  transport_disconnected,
  stage_moving,
  stage_stopped,
  stage_disconnected,
  stage_sos,
  stage_blue_flag_received,
  stage_blue_flag_sent,
  stage_yellow_flag,
  stage_red_flag,
  stage_breakdown,
  stage_breakdown_road_blocked,
  stage_breakdown_road_not_blocked,
  stage_breakdown_tyre_change,
  stage_autodetect_crash,
  stage_autodetect_reverse,
  unknown,
}

export const getParticipantStatus = (
  p: participantInfo,
  stages: Map<bigint, stage>,
  user:
    | (DefaultUser & {
        id: string;
        role: string;
      })
    | undefined
): participantStatus => {
  const d = new Date();
  const dMillis = d.getTime();

  let isTransport = true;

  const isStopped =
    (p.lastStopTime !== undefined &&
      dMillis - STOPPED_AFTER_X_SECONDS * 1000 >= p.lastStopTime) ||
    (p.position && dMillis - STOPPED_AFTER_X_SECONDS * 1000 >= p.position.time);

  const isStoppendWarning =
    !isStopped &&
    ((p.lastStopTime !== undefined &&
      dMillis - STOPPED_WARNING_AT_X_SECONDS * 1000 >= p.lastStopTime) ||
      (p.position &&
        dMillis - STOPPED_WARNING_AT_X_SECONDS * 1000 >= p.position.time));

  const isSos = p.lastSosTime !== undefined && p.lastSosIsFinish;
  let isRedFlag = false;
  let isYellowFlag = false;
  let isBlueFlagSent = false;
  let isBlueFlagReceived = false;

  const isDisconnected =
    p.position && dMillis - STOPPED_AFTER_X_SECONDS * 1000 >= p.position.time;

  if (p.position) {
    if (p.position.stage_id > 0 && stages.has(BigInt(p.position.stage_id))) {
      const st = stages.get(BigInt(p.position.stage_id));
      isTransport = st?.stage_type_id === BigInt(1);
    }
  } else {
    return user !== undefined
      ? participantStatus.unknown
      : participantStatus.transport_stopped;
  }

  if (user !== undefined) {
    if (isSos) {
      //TODO: evaluate for breakDown, or SOS Type
      return participantStatus.stage_sos;
    } else if (isRedFlag) {
      return participantStatus.stage_red_flag;
    } else if (isYellowFlag) {
      return participantStatus.stage_yellow_flag;
    } else if (isBlueFlagReceived) {
      return participantStatus.stage_blue_flag_received;
    } else if (isBlueFlagSent) {
      return participantStatus.stage_blue_flag_sent;
    } else if (isDisconnected) {
      return isTransport
        ? participantStatus.transport_disconnected
        : participantStatus.stage_disconnected;
    } else if (isStoppendWarning) {
      return isTransport
        ? participantStatus.transport_stopped
        : participantStatus.stage_stopped;
    } else if (p.position) {
      return isTransport
        ? participantStatus.transport_moving
        : participantStatus.stage_moving;
    } else {
      return participantStatus.unknown;
    }
    //Race Control Viewer or RC Operator
  } else {
    //Not logged: only basic colors
    if (isTransport) {
      return participantStatus.transport_moving;
    } else {
      return participantStatus.transport_disconnected;
    }
  }
};

export const getParticipantBackgroundColor = (
  p: participantInfo,
  stages: Map<bigint, stage>,
  user:
    | (DefaultUser & {
        id: string;
        role: string;
      })
    | undefined
) => {
  const st = getParticipantStatus(p, stages, user);
  switch (st) {
    case participantStatus.transport_disconnected:
    case participantStatus.stage_disconnected:
      return "#9878bf"; //purple
    case participantStatus.transport_moving:
      return "#000000";
    case participantStatus.stage_stopped:
    case participantStatus.transport_stopped:
      return "#a9b3b2"; //gray
    case participantStatus.stage_blue_flag_sent:
      return "#4598ff";
    case participantStatus.stage_breakdown:
      return "#ffff00";
    case participantStatus.stage_breakdown_road_not_blocked:
    case participantStatus.stage_breakdown_tyre_change:
      return "#00ff00";
    case participantStatus.stage_breakdown_road_blocked:
    case participantStatus.stage_autodetect_crash:
    case participantStatus.stage_autodetect_reverse:
      return "#ff7f00";
    case participantStatus.stage_sos:
      return "#ff0000";
    default:
      return "#ffffff";
  }
};

export const getParticipantBorderColor = (
  p: participantInfo,
  stages: Map<bigint, stage>,
  user:
    | (DefaultUser & {
        id: string;
        role: string;
      })
    | undefined
) => {
  const st = getParticipantStatus(p, stages, user);
  switch (st) {
    case participantStatus.transport_moving:
    case participantStatus.transport_disconnected:
    case participantStatus.transport_stopped:
      return "#a9b3b2"; //gray
    case participantStatus.stage_yellow_flag:
      return "#ffff00";
    case participantStatus.stage_red_flag:
      return "#ff0000";
    default:
      return "#ffffff";
  }
};

export const getParticipantTextColor = (
  p: participantInfo,
  stages: Map<bigint, stage>,
  user:
    | (DefaultUser & {
        id: string;
        role: string;
      })
    | undefined
) => {
  const st = getParticipantStatus(p, stages, user);
  switch (st) {
    case participantStatus.transport_moving:
      return "#a9b3b2";
    case participantStatus.stage_sos:
    case participantStatus.stage_autodetect_crash:
    case participantStatus.stage_autodetect_reverse:
      return "#ffffff";
    default:
      return "#000000";
  }
};

export type eventInfo = event & { rallies: rallyInfo[] };

//export class MyEmitter extends EventEmitter {}

export class PPTrackerDataServerIoClient extends EventEmitter {
  ppTrackerShortCodes = new Map<number, string>();
  serverAddress: string = "";
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  isStarted: boolean = false;
  channelsToJoin: Map<string, string> = new Map<string, string>();
  readonly SERVER_AUTH_TOKEN = "74462E963F079B12CB81BF9453601BF3";

  stageTypes = new Map<number, stage_type>();
  countries: country[] = [];
  countriesById = new Map<number, country>();
  activeEvents: eventInfo[] = [];
  public activeEventsBySlug = new Map<string, eventInfo>();
  //rallyParticipantsByNumber = new Map<number, Map<string, participantInfo>>();

  rallyParticipantsById = new Map<number, Map<number, participantInfo>>();
  //rallySosAlertsByRallyId = new Map<number, apiSosAlertMerge[]>();
  rallySosTypeDataByRallyId = new Map<number, apiSosTypeData[]>();
  rallyRawFlagAlertsByRallyId = new Map<number, apiFlagMergeAlert[]>();
  rallyRawIncidencesByRallyId = new Map<number, apiIncidence[]>();
  rallyRawBlueFlags = new Map<number, apiBlueFlag[]>();
  rallyRawWaypointEvents = new Map<number, apiWaypointEvent[]>();
  rallyRawFlagDisplayedDataByRallyId = new Map<
    number,
    apiFlagDisplayedData[]
  >();
  rallyRawFlagAckDataByRallyId = new Map<number, apiFlagAckData[]>();
  rallyMessages = new Map<number, apiMessage[]>();
  rallyFlagAlerts = new Map<number, flagAlert[]>();
  rallySosAlerts = new Map<number, apiSosAlertMerge[]>();
  rallyAlerts = new Map<number, rallyAlert[]>();

  rallyStages = new Map<number, Map<number, stage>>();
  rallyPositions = new Map<number, apiPosition[]>();
  rallyPositionsByParticipantId = new Map<number, Map<number, apiPosition>>();

  apiActiveEvents: apiEvent[] = [];
  apiActiveEventsBySlug = new Map<string, apiEvent>();
  apiActiveEventsInfoBySlug = new Map<string, apiEventInfo>();
  apiWaypointsMap = new Map<string, apiParticipantWaypointTimes[]>();
  apiWaypointParticipantMap = new Map<string, apiWaypointParticipantTime[]>();
  apiRallyParticipants = new Map<number, apiParticipant[]>();
  apiRallyStages = new Map<number, apiStage[]>();

  constructor(serverAddress: string) {
    super();
    this.serverAddress = serverAddress;
    console.log(
      ">>>>>> STARTING INSTANCE OF 'PPTrackerDataServerIoClient' <<<<",
      serverAddress
    );
  }

  public updateApiWaypoints(rallyId: number) {
    if (this.rallyRawWaypointEvents.has(rallyId)) {
      const rawWpEvents = this.rallyRawWaypointEvents.get(
        rallyId
      ) as apiWaypointEvent[];

      // console.log("SE HA OBTENIDO LOS WAYPOINTS PARA EL EVENT: ", rawWpEvents);

      const rallyInfo = this.getRallyWithId(rallyId);
      if (rallyInfo === null) return;
      const eventInfo = this.getEventWithId(rallyInfo.event_id);
      if (eventInfo === null) return;

      let waypointsById = new Map<number, track_waypoints>();
      for (var track of rallyInfo?.track) {
        for (var wp of track.track_waypoints) {
          waypointsById.set(Number(wp.id), wp);
        }
      }

      // console.log("WAYPOINTS BY ID: ", waypointsById);

      let participantsById = new Map<number, participant>();
      for (var p of rallyInfo.participants) {
        participantsById.set(Number(p.id), p);
      }

      let stagesById = new Map<number, stage>();
      for (var st of rallyInfo.stages) {
        stagesById.set(Number(st.id), st);
      }
      const preKey = eventInfo.slug + "-" + rallyInfo.slug + "-";

      // declara waypoints por stage que es del tipo key, {index del waypoint, tiempo }
      let waypointsByStage = new Map<string, Map<number, apiWaypointTime[]>>();

      // console.log("Waypoints by Stage: ", waypointsByStage);

      // Crear key que es evento - rally - stageidx - waypoint idx
      // Crear un map con key que tenga de valores un map de key waypoint idx {participante numero, tiempo}

      for (var wpe of rawWpEvents) {
        if (wpe.type === 3 && stagesById.has(wpe.stage_id)) {
          //Waypoint Validated
          const key =
            preKey + (stagesById.get(wpe.stage_id) as stage).idx.toString();
          if (!waypointsByStage.has(key)) {
            waypointsByStage.set(key, new Map<number, apiWaypointTime[]>());
          }

          let wpByStage = waypointsByStage.get(key) as Map<
            number,
            apiWaypointTime[]
          >;
          // console.log("WAYPOINTS BY STAGE:", JSON.stringify(wpByStage));

          let wpData: apiWaypointTime[] = [];

          if (wpByStage.has(wpe.participant)) {
            wpData = wpByStage.get(wpe.participant) as apiWaypointTime[];
          }

          const idx = waypointsById.has(wpe.waypoint_id)
            ? (waypointsById.get(wpe.waypoint_id) as track_waypoints).idx
            : 0;
          const wp: apiWaypointTime = { idx: idx, time: Number(wpe.time) };
          // apiWaypointParticipantTime = {participant numero: string, waypoint time: number}
          // const wpp: apiWaypointParticipantTime = { participant: wp , time: Number(wpe.time) };
          // let wpp: apiWaypointParticipantTime = { participant: wpe.participant, time: Number(wpe.time) };
          wpData.push(wp);
          wpByStage.set(wpe.participant, wpData);
          waypointsByStage.set(key, wpByStage);
        }
      }

      // console.log("WAYPOINTS BY STAGE: ", waypointsByStage.keys());

      // console.log("WAYPOINTS BY STAGE: ", waypointsByStage.get("pozoblanco23-rally-1"));

      //   3460 => [
      //     { idx: 6, time: 1700226914800 },
      //     { idx: 5, time: 1700226850200 },
      //     { idx: 4, time: 1700226667400 },
      //     { idx: 3, time: 1700226582800 },
      //     { idx: 2, time: 1700226467800 },
      //     { idx: 1, time: 1700225614200 },
      //     { idx: 1, time: 1700225187800 },
      //     { idx: 1, time: 1700225116400 },
      //     { idx: 1, time: 1700224393600 },
      //     { idx: 0, time: 1700224243600 },
      //     { idx: 0, time: 1700224243600 }
      //   ]
      // }

      for (var k of waypointsByStage.keys()) {
        let participantTimes: apiParticipantWaypointTimes[] = [];
        const times = waypointsByStage.get(k) as Map<number, apiWaypointTime[]>;

        for (var partId of times.keys()) {
          const partNumber = participantsById.has(partId)
            ? (participantsById.get(partId) as participant).number
            : "unknown";

          participantTimes.push({
            number: partNumber,
            waypoints: times.get(partId) as apiWaypointTime[],
          });
        }

        this.apiWaypointsMap.set(k, participantTimes);
      }

      // AQUI NUEVO API
      // const waypointsGrouped: Record<
      //     string,
      //     { participantNumber: string; time: number }[]
      //   > = {};

      for (var k of waypointsByStage.keys()) {
        let waypointTimes: {
          waypointIdx: number;
          number: string;
          time: number;
        }[] = [];
        const times = waypointsByStage.get(k) as Map<number, apiWaypointTime[]>;

        for (var partId of times.keys()) {
          if (participantsById.has(partId)) {
            const partNumber = participantsById.has(partId)
              ? (participantsById.get(partId) as participant).number
              : "unknown";

            const waypointTimesArray = times.get(partId) as apiWaypointTime[];

            for (const waypointTime of waypointTimesArray) {
              waypointTimes.push({
                waypointIdx: waypointTime.idx,
                number: partNumber,
                time: waypointTime.time,
              });
            }
          }
        }

        // console.log("WAYPOINT TIMES: ", waypointTimes);

        // Agrupar por waypointIdx
        const waypointsGrouped: Record<
          string,
          { number: string; time: number }[]
        > = {};

        for (const item of waypointTimes) {
          const { waypointIdx, number, time } = item;

          const newKey = k + "-" + waypointIdx;

          if (!waypointsGrouped[newKey]) {
            waypointsGrouped[newKey] = [];
          }

          waypointsGrouped[newKey].push({
            number,
            time,
          });
        }

        for (const [key, participants] of Object.entries(waypointsGrouped)) {
          this.apiWaypointParticipantMap.set(key, participants);
        }

        // console.log("WAYPOINT TIMES GROUPED: ", this.apiWaypointParticipantMap);

        // this.apiWaypointsMap.set(k, waypointTimes);
      }
    }
  }

  public getEventWithId(id: bigint) {
    for (var ev of this.activeEvents) {
      if (ev.id === id) {
        return ev;
      }
    }
    return null;
  }

  public getRallyWithId(rallyId: number) {
    for (var ev of this.activeEvents) {
      for (var r of ev.rallies) {
        if (Number(r.id) === rallyId) {
          return r;
        }
      }
    }
    return null;
  }
  public updateAlerts(rallyId: number) {
    let alerts: rallyAlert[] = [];

    if (this.rallyFlagAlerts.has(rallyId)) {
      const flagAlerts = this.rallyFlagAlerts.get(rallyId) as flagAlert[];
      for (var a of flagAlerts) {
        const ra: rallyAlert = { time: a.flag_time, alert: a, alertType: 2 };
        alerts.push(ra);
      }
      //console.log("ADDED ", i, " FLAG ALERTS...");
    } else {
      //console.log("NO ALERT FLAGS FOR ", rallyId);
    }

    if (this.rallySosAlerts.has(rallyId)) {
      //console.log("ADDING SOS ALERTS to rally ", rallyId);
      const sosAlerts = this.rallySosAlerts.get(rallyId) as apiSosAlertMerge[];
      for (var s of sosAlerts) {
        const ra: rallyAlert = { time: s.time, alert: s, alertType: 1 };
        alerts.push(ra);
      }
    }

    if (this.rallyRawIncidencesByRallyId.has(rallyId)) {
      const incidences = this.rallyRawIncidencesByRallyId.get(
        rallyId
      ) as apiIncidence[];
      for (var i of incidences) {
        const ra: rallyAlert = { time: i.startTime, alert: i, alertType: 3 };
        alerts.push(ra);
      }
    }

    if (this.rallyRawBlueFlags.has(rallyId)) {
      const blueFlags = this.rallyRawBlueFlags.get(rallyId) as apiBlueFlag[];
      for (var bf of blueFlags) {
        const ra: rallyAlert = {
          time: bf.blue_flag_request_time,
          alert: bf,
          alertType: 5,
        };
        alerts.push(ra);
      }
    }

    if (this.rallyMessages.has(rallyId)) {
      const messages = this.rallyMessages.get(rallyId) as apiMessage[];
      for (var msg of messages) {
        const raMsg: rallyAlert = {
          time: msg.message_time,
          alert: msg,
          alertType: 4,
        };
        alerts.push(raMsg);
      }
    }
    // for (var s of this.rallySosAlerts) {
    //   alerts.push({s.});
    // }
    //console.log("Settings flags alerts to rally Id ", rallyId, alerts.length);
    this.rallyAlerts.set(rallyId, alerts);
    this.emit("rallyAlerts", rallyId);
  }

  // public updateSosAlerts(rallyId: number) {
  //   let sosAlerts = new Map<string, sosAlert>();
  //   if (this.rallySosAlertsByRallyId.has(rallyId)) {
  //     const sos = this.rallySosAlertsByRallyId.get(rallyId) as apiSosAlert[];
  //     for (var a of sos) {
  //       const key = a.sosTime + "-" + a.requestedSOSParticipantId;
  //       if (!sosAlerts.has(key)) {
  //         sosAlerts.set(key, {
  //           ...a,
  //           sosType: -1,
  //           sosEndTime: 0,
  //           sosAckTime: 0,
  //         });
  //       }
  //     }
  //   }
  //   if (this.rallySosTypeDataByRallyId.has(rallyId)) {
  //     const sosType = this.rallySosTypeDataByRallyId.get(
  //       rallyId
  //     ) as apiSosTypeData[];
  //     for (var st of sosType) {
  //       const key = st.sosTime + "-" + st.requestedSOSParticipantId;
  //       if (sosAlerts.has(key)) {
  //         let alert = sosAlerts.get(key) as sosAlert;
  //         alert.sosType = st.type;
  //         sosAlerts.set(key, alert);
  //       }
  //     }
  //   }

  //   //TODO: GET Sos ENDTIME

  //   //TODO: Get Sos ACK TIME

  //   let rallySosAlerts: apiSosAlertMerge[] = [];
  //   for (var s of sosAlerts.values()) {
  //     rallySosAlerts.push(s);
  //   }
  //   this.rallySosAlerts.set(rallyId, rallySosAlerts);
  //   this.updateAlerts(rallyId);
  // }

  public updateFlagAlerts(rallyId: number) {
    if (this.rallyRawFlagAlertsByRallyId.has(rallyId)) {
      let flagAlerts = new Map<string, flagAlert>();

      const rawFlagAlerts = this.rallyRawFlagAlertsByRallyId.get(
        rallyId
      ) as apiFlagMergeAlert[];

      //#region create raw Alerts
      for (var aDetails of rawFlagAlerts.values()) {
        const key = `${aDetails.stage_id.toString()}-${aDetails.flag_time.toString()}-${
          aDetails.flag_type
        }`;

        let fa: undefined | flagAlert;

        if (flagAlerts.has(key)) {
          fa = flagAlerts.get(key) as flagAlert;
        }
        if (fa === undefined) {
          fa = {
            stage_id: aDetails.stage_id,
            rally_id: aDetails.rally_id,
            flag_time: aDetails.flag_time,
            flag_type: aDetails.flag_type,
            flag_meters: aDetails.flag_meters,
            details: [],
          };
          fa.details.push(aDetails);
          flagAlerts.set(key, fa);
        } else {
          fa = flagAlerts.get(key);
          if (fa) {
            fa?.details.push(aDetails);
            flagAlerts.set(key, fa);
          }
        }
      }
      //#endregion

      let rallyFlagAlerts: flagAlert[] = [];
      for (var f of flagAlerts.values()) {
        rallyFlagAlerts.push(f);
      }
      this.rallyFlagAlerts.set(rallyId, rallyFlagAlerts);
    }

    this.updateAlerts(rallyId);
  }

  public async join(channel: string) {
    this.channelsToJoin.set(channel, channel);
  }

  public async start() {
    this.isStarted = true;
    const hashedToken = await this.getHashToken(this.SERVER_AUTH_TOKEN);

    this.socket = io(this.serverAddress, {
      auth: { token: hashedToken },
    });

    this.socket.on("status", (a) => {
      //console.log("NEW STATUS FROM DATA SERVER:", a);
      this.emit("status", a);
      if (a === "connected") {
        for (var channel of this.channelsToJoin.values()) {
          this.socket?.emit("subscribe", channel);
          console.log("Subscribe to ", channel);
        }
      }
    });

    this.socket.on(
      "ppTrackerShortCodes",
      (ppTrackerShortCodes: pptracker_shortcodes[]) => {
        this.ppTrackerShortCodes.clear();
        for (var c of ppTrackerShortCodes) {
          this.ppTrackerShortCodes.set(Number(c.pptracker_id), c.id);
        }
      }
    );

    this.socket.on("countries", (countries) => {
      this.countries = superjson.parse(countries);
      this.countriesById.clear();
      for (var c of this.countries) {
        this.countriesById.set(Number(c.id), c);
      }
      //console.log("TOTAL COUNTRIES BY ID:", this.countriesById.length);
    });

    this.socket.on("stageTypes", (stageTypes) => {
      const stTypes: stage_type[] = superjson.parse(stageTypes);
      this.stageTypes.clear();
      for (var st of stTypes) {
        this.stageTypes.set(Number(st.id), st);
      }
    });

    this.socket.on("incidences", (incidences) => {
      if (incidences.length > 0) {
        const firstIncidence = incidences[0];
        console.log("FIRST INCIDENCE: ", firstIncidence);
        this.rallyRawIncidencesByRallyId.set(
          firstIncidence.rallyId,
          incidences
        );
        this.updateAlerts(firstIncidence.rallyId);
      }
      console.log("Incidences Received: ", incidences.length);
    });

    this.socket.on("blueFlags", (blueFlags) => {
      //console.log("GETTING Blue FLAGS FOR RALLY ?? ");
      if (blueFlags.length > 0) {
        const firstBlueFlag = blueFlags[0];
        // console.log(
        //   "GETTING Blue FLAGS FOR RALLY => ",
        //   blueFlags.length,
        //   firstBlueFlag.rally_id
        // );
        this.rallyRawBlueFlags.set(firstBlueFlag.rally_id, blueFlags);
        this.updateAlerts(firstBlueFlag.rally_id);
      }
    });

    this.socket.on("waypointEvents", (waypointEvents) => {
      if (waypointEvents.length > 0) {
        const firstWp = waypointEvents[0];
        this.rallyRawWaypointEvents.set(firstWp.rally_id, waypointEvents);
        // console.log(
        //   "NEW WAYPOINTS FOR RALLY ???",
        //   firstWp.rally_id,
        //   waypointEvents.length
        // );
        this.updateApiWaypoints(firstWp.rally_id);
      }
    });

    this.socket.on("message", (messages) => {
      if (messages.length > 0) {
        const firstMessage = messages[0];
        let messagesClean = new Map<string, apiMessage>();

        for (var m of messages) {
          const key = m.participant.toString() + m.message_time.toString();
          if (messagesClean.has(key)) {
            const original = messagesClean.get(key);
            if (
              original?.message_received_time === 0 &&
              m.message_received_time !== 0
            ) {
              messagesClean.set(key, m);
              console.log(
                "REPEAT original: ",
                messagesClean.get(key),
                " repeat info: ",
                m
              );
            } else {
              //console.log("IGNORING REPEATED: ", JSON.stringify(m));
            }
          } else {
            messagesClean.set(key, m);
          }
        }

        let msgCleanArray: apiMessage[] = [];
        for (var mm of messagesClean.values()) {
          msgCleanArray.push(mm);
        }

        this.rallyMessages.set(firstMessage.rally_id, msgCleanArray);

        // console.log(
        //   "from 'message':",
        //   firstMessage.rally_id,
        //   messages.length,
        //   JSON.stringify(messages)
        // );
        this.updateAlerts(firstMessage.rally_id);
      }
      //console.log("new MessageS ??", messages.length);
    });
    // this.socket.on("messageAck", (messageAcks) => {
    //   if (messageAcks.length > 0) {
    //     const firstMessage = messageAcks[0];
    //     this.rallyMessageAcks.set(firstMessage.rally_id, messageAcks);
    //     console.log("from 'messageAck'");
    //     this.updateMessagesInfo(firstMessage.rally_id);
    //   }
    //   //console.log("new Message ACKS ??", messageAcks.length);
    // });
    // this.socket.on("messageDisplayed", (messageDisplayed) => {
    //   if (messageDisplayed.length > 0) {
    //     const firstMessage = messageDisplayed[0];
    //     this.rallyMessageDisplayed.set(firstMessage.rally_id, messageDisplayed);
    //     console.log("from 'messageDisplayed'");
    //     this.updateMessagesInfo(firstMessage.rally_id);
    //   }
    //   //console.log(messageDisplayed);
    //   //console.log("new Message Displayed ??", messageDisplayed.length);
    // });
    // this.socket.on("messageResponse", (messageResponses) => {
    //   if (messageResponses.length > 0) {
    //     const firstMessage = messageResponses[0];
    //     this.rallyMessageResponses.set(firstMessage.rally_id, messageResponses);
    //     console.log("from 'messageResponse'");
    //     this.updateMessagesInfo(firstMessage.rally_id);
    //   }
    //   //console.log(messageResponses);
    //   //console.log("new Message Responses ??", messageResponses.length);
    // });

    this.socket.on("activeEvents", (activeEvents) => {
      // console.log(
      //   ">>>>>>>>>>>>>>>>>>>>>>> ACTIVE EVENTS STRING: ",
      //   activeEvents
      // );

      //const activeEv = superjson.parse(activeEvents);
      //console.log(activeEv);

      this.activeEvents = superjson.parse(activeEvents);
      this.activeEventsBySlug.clear();
      //this.rallyParticipantsByNumber.clear();
      this.rallyParticipantsById.clear();
      this.rallyStages.clear();
      this.apiRallyParticipants.clear();
      this.apiRallyStages.clear();

      //console.log(">>>>>>>>>>>>>>>>>>>>>>> ACTIVE EVENTS: ", this.activeEvents);
      for (var ev of this.activeEvents) {
        this.activeEventsBySlug.set(ev.slug, ev);
        var sdate = new Date(Number(ev.start_date));
        var edate = new Date(Number(ev.end_date));
        let start_date = sdate.toISOString().substring(0, 10);
        let end_date = edate.toISOString().substring(0, 10);
        const c: country | undefined = this.countriesById.has(
          Number(ev.country_id)
        )
          ? this.countriesById.get(Number(ev.country_id))
          : undefined;
        //console.log("Country to find: ", ev.country_id, c);
        const apiEvItem: apiEvent = {
          id: Number(ev.id),
          name: ev.name,
          slug: ev.slug,
          start_date: start_date,
          end_date: end_date,
          country: c !== undefined ? c.name_en : "",
          base_location: ev.base_location,
          time_zone: ev.time_zone,
          surface: ev.surface,
          closed: ev.closed === 1 ? true : false,
          offsetGMT: ev.offsetGMT,
        };

        let apiRallies: apiRally[] = [];

        for (var rally of ev.rallies) {
          const startDate = new Date(Number(rally.start_date))
            .toISOString()
            .substring(0, 10);
          const endDate = new Date(Number(rally.end_date))
            .toISOString()
            .substring(0, 10);
          const apiRallyItem: apiRally = {
            id: Number(rally.id),
            name: rally.name,
            slug: rally.slug,
            start_date: startDate,
            end_date: endDate,
            surface: rally.surface,
            closed: rally.closed === 1 ? true : false,
          };
          apiRallies.push(apiRallyItem);

          let apiRallyParticipants: apiParticipant[] = [];
          let rallyParticipantsByNumber = new Map<string, participantInfo>();
          let participantsById = new Map<number, participantInfo>();

          for (var p of rally.participants) {
            const driverCountry = this.countriesById.has(
              Number(p.driver_country_id)
            )
              ? this.countriesById.get(Number(ev.country_id))
              : undefined;
            const codriverCountry = this.countriesById.has(
              Number(p.codriver_country_id)
            )
              ? this.countriesById.get(Number(ev.country_id))
              : undefined;
            const participantStatus = "";
            const rallyParticipant: apiParticipant = {
              number: p.number,
              driver: p.driver_name + " " + p.driver_surname,
              driverCountry: driverCountry ? driverCountry.iso_alpha3_code : "",
              coDriver: p.codriver_name + " " + p.codriver_surname,
              coDriverCountry: codriverCountry
                ? codriverCountry.iso_alpha3_code
                : "",
              vehicle: p.vehicle,
              team: p.team,
              tyres: p.tyres,
              status: participantStatus,
              category: p.category,
            };
            apiRallyParticipants.push(rallyParticipant);
            let pInfo: participantInfo = {
              ...p,
              position: undefined,
              connected: true,
            };
            rallyParticipantsByNumber.set(p.number, pInfo);
            participantsById.set(Number(p.id), pInfo);
          }
          this.apiRallyParticipants.set(Number(rally.id), apiRallyParticipants);
          // this.rallyParticipantsByNumber.set(
          //   Number(rally.id),
          //   rallyParticipantsByNumber
          // );
          this.rallyParticipantsById.set(Number(rally.id), participantsById);

          let apiRallyStages: apiStage[] = [];
          let rallyStages = new Map<number, stage>();
          let rallyTracksById = new Map<bigint, trackInfo>();
          for (var t of rally.track) {
            rallyTracksById.set(t.id, t);
          }
          for (var st of rally.stages) {
            if (st.idx > 0) {
              const stageType = this.stageTypes.has(Number(st.stage_type_id))
                ? <stage_type>this.stageTypes.get(Number(st.stage_type_id))
                : undefined;
              const stageDate = new Date(Number(st.date))
                .toISOString()
                .substring(0, 10);
              let stageApiWaypoints: apiWaypoint[] = [];
              if (st.track_id !== null && rallyTracksById.has(st.track_id)) {
                const tkInfo = rallyTracksById.get(st.track_id) as trackInfo;
                for (var wp of tkInfo.track_waypoints) {
                  stageApiWaypoints.push({
                    idx: wp.idx,
                    km: wp.km !== 0 ? wp.km / 1000 : 0,
                    lat: wp.lat !== 0 ? wp.lat / 10000000 : 0,
                    lon: wp.lon !== 0 ? wp.lon / 10000000 : 0,
                    name: wp.name,
                  });
                }
              }
              const rallyStage: apiStage = {
                leg: st.leg,
                section: st.section,
                sector: st.sector,
                idx: st.idx,
                stage_number: st.stage_number,
                time_control: st.time_control,
                name: st.name,
                distance: st.distance,
                type: stageType ? stageType.name_en : "-",
                sumer_time_offset: st.summer_time !== null ? st.summer_time : 0,
                date: stageDate,
                firstCarAt: st.first_car_at,
                waypoints: stageApiWaypoints,
              };
              apiRallyStages.push(rallyStage);
              rallyStages.set(Number(st.id), st);
            }
          }
          this.apiRallyStages.set(Number(rally.id), apiRallyStages);
          this.rallyStages.set(Number(rally.id), rallyStages);
        }

        const apiEvInfoItem: apiEventInfo = {
          ...apiEvItem,
          rallies: apiRallies,
        };
        this.apiActiveEvents.push(apiEvItem);
        this.apiActiveEventsBySlug.set(ev.slug, apiEvItem);
        this.apiActiveEventsInfoBySlug.set(ev.slug, apiEvInfoItem);
      }
      //console.log(this.apiActiveEvents);
      this.emit("activeEvents");
    });

    this.socket.on("connectedStatus", (connectedStatus) => {
      try {
        //console.log("NEw Connected PPTrackres Update...");
        if (connectedStatus === "") {
          console.log("processing empty connectedStatus data ???");
        } else {
          // console.log(
          //   "connectedStatus data to process: ",
          //   connectedStatus.length
          // );
        }
        const data: ConnectedStatusData = JSON.parse(connectedStatus);

        if (this.rallyParticipantsById.has(data.rallyId)) {
          //PROCESS POSITIONS, BECAUSE THEY ARE FROM AN ACTIVE RALLY
          let participants = this.rallyParticipantsById.get(data.rallyId);

          if (participants) {
            for (var st of data.statusArray) {
              let pInfo = participants.get(st.participantId);
              if (pInfo) {
                pInfo.connected = st.status;
              }
            }
            this.rallyParticipantsById.set(data.rallyId, participants);
            this.emit("participants", data.rallyId);
          }
        }
      } catch (error) {
        console.log(
          "Error procesing new connection status packet:",
          connectedStatus
        );
      }
    });

    this.socket.on("flagMergeAlerts", (alerts) => {
      try {
        if (alerts.length > 0) {
          const firstAlert = alerts[0];
          this.rallyRawFlagAlertsByRallyId.set(firstAlert.rally_id, alerts);
          // console.log(
          //   "FlagAlerts Merge NEW ALERTS...",
          //   firstAlert.rally_id,
          //   alerts.length
          // );
          this.updateFlagAlerts(firstAlert.rally_id);
          //this.updateAlerts(firstAlert.rally_id);
        }
      } catch (error) {
        console.log("Error processing flagAlerts Merge...", alerts);
      }
    });

    // this.socket.on("flagAlerts", (alerts) => {
    //   try {
    //     if (alerts.length > 0) {
    //       const firstAlert = alerts[0];
    //       this.rallyRawFlagAlertsByRallyId.set(firstAlert.rallyid, alerts);
    //       this.updateFlagAlerts(firstAlert.rallyid);
    //     }
    //   } catch (error) {
    //     console.log("Error processing flagAlerts", alerts);
    //   }
    // });

    // this.socket.on("flagDisplayedData", (alerts) => {
    //   try {
    //     if (alerts.length > 0) {
    //       const firstAlert = alerts[0];
    //       this.rallyRawFlagDisplayedDataByRallyId.set(
    //         firstAlert.rallyid,
    //         alerts
    //       );
    //       this.updateFlagAlerts(firstAlert.rallyid);
    //     }
    //   } catch (error) {
    //     console.log("Error processing flag Displayed Data", alerts);
    //   }
    // });

    // this.socket.on("flagAckData", (alerts) => {
    //   try {
    //     if (alerts.length > 0) {
    //       const firstAlert = alerts[0];
    //       this.rallyRawFlagAckDataByRallyId.set(firstAlert.rallyid, alerts);
    //       this.updateFlagAlerts(firstAlert.rallyid);
    //     }
    //   } catch (error) {
    //     console.log("Error processing flag ACK Alerts update", alerts);
    //   }
    // });

    // this.socket.on("sosAlerts", (alerts) => {
    //   try {
    //     // console.log(
    //     //   "SOS Alert Types data Received, total alert tyoess:",
    //     //   alertTypes.length,
    //     //   alertTypes
    //     // );
    //     if (alerts.length > 0) {
    //       const firstAlert = alerts[0];
    //       this.rallySosAlertsByRallyId.set(firstAlert.rallyid, alerts);
    //       this.updateSosAlerts(firstAlert.rallyid);
    //       //this.emit("sosTypeData", firstAlert.rallyid);
    //     }
    //   } catch (error) {
    //     console.log("Error processing sosTypeData", alerts);
    //   }
    // });

    this.socket.on("sosAlertsMerge", (alerts) => {
      try {
        // console.log(
        //   "SOS Alert Merge data Received, total alerts:",
        //   alerts.length,
        //   alerts
        // );

        if (alerts.length > 0) {
          const firstAlert = alerts[0];
          this.rallySosAlerts.set(firstAlert.rally_id, alerts);
          this.updateAlerts(firstAlert.rally_id);
        }
      } catch (error) {
        console.log("Error processing sosAlertsMerge", alerts);
      }
    });

    // this.socket.on("sosTypeData", (alertTypes) => {
    //   try {
    //     // console.log(
    //     //   "SOS Alert Types data Received, total alert tyoess:",
    //     //   alertTypes.length,
    //     //   alertTypes
    //     // );
    //     if (alertTypes.length > 0) {
    //       const firstAlert = alertTypes[0];
    //       this.rallySosTypeDataByRallyId.set(firstAlert.rallyid, alertTypes);
    //       this.updateSosAlerts(firstAlert.rallyid);
    //       //this.emit("sosTypeData", firstAlert.rallyid);
    //     }
    //   } catch (error) {
    //     console.log("Error processing sosTypeData", alertTypes);
    //   }
    // });

    this.socket.on("position", (positions) => {
      try {
        // console.log(
        //   new Date().toTimeString(),
        //   "NEW POSITIONS RECEIVED..., for rally..."
        // );
        let posArray: apiPosition[] = [];
        try {
          posArray = JSON.parse(positions);
        } catch (parseError) {
          console.log("ERROR PARSING positions to apiPosition[]: ", positions);
        }

        if (posArray.length > 0) {
          const first = posArray[0];
          //console.log("..... for rally...", first.rally_id);
          if (this.rallyParticipantsById.has(first.rally_id)) {
            //PROCESS POSITIONS, BECAUSE THEY ARE FROM AN ACTIVE RALLY
            let participants = this.rallyParticipantsById.get(first.rally_id);

            if (participants) {
              for (var pos of posArray) {
                let pInfo = participants.get(pos.participant);
                if (pInfo) {
                  if (pInfo.position && pos.time < pInfo.position.time) {
                    // console.log(
                    //   ">>>>>>>>>>>>>>>>>>>>>>ERRROR INVALID TIME POSITION:",
                    //   pInfo.number,
                    //   pos,
                    //   pInfo.position,
                    //   pos.time - pInfo.position.time
                    // );
                  }
                  if (
                    pInfo.position === undefined ||
                    pos.time >= pInfo.position.time
                  ) {
                    // if (pInfo.number === "23") {
                    //   console.log(
                    //     "GETTING POS FOR PARTICIPANT 23:",
                    //     pos,
                    //     pInfo.position
                    //   );
                    // }
                    pInfo.position = pos;
                    pInfo.lastDataTime = pos.time;
                    if (pos.speed < MOVING_SPEED) {
                      if (pInfo.lastStopTime === undefined) {
                        pInfo.lastStopTime = pos.time;
                      }
                    } else {
                      pInfo.lastStopTime = undefined;
                    }
                    participants.set(pos.participant, pInfo);
                  } else {
                    // console.log(
                    //   "DISCARtING POSITION PACKET FOR PARTICIPANT Nr",
                    //   pInfo.number,
                    //   ": ",
                    //   pos
                    // );
                  }
                }
              }
              this.rallyParticipantsById.set(first.rally_id, participants);
              // console.log(
              //   "NEW POSITIONS FOR RALLY ",
              //   first.rallyid,
              //   ", totalRecords:",
              //   participants.size
              // );
              this.emit("participants", first.rally_id);
            }
          }

          this.rallyPositions.set(first.rally_id, posArray);
          let rallyPos = new Map<number, apiPosition>();
          for (var p of posArray) {
            rallyPos.set(p.participant, p);
          }
          this.rallyPositionsByParticipantId.set(first.rally_id, rallyPos);
          this.emit("positions", first.rally_id);
        }
      } catch (error) {
        console.log("Error procesing new positions:", positions, error);
      }
    });

    this.socket.on("connect_error", (err) => {
      console.log(err.message); // prints the message associated with the error
      setTimeout(() => {
        if (this.socket) this.socket.connect();
      }, 5000);
    });
  }

  // updateMessagesInfo(rally_id: number) {
  //   console.log("Updating Message Info for rally: ", rally_id);
  //   let messages = new Map<string, messagesMerge>();

  //   if (this.rallyMessages.has(rally_id)) {
  //     const apiMessages = this.rallyMessages.get(rally_id);
  //     if (apiMessages !== undefined) {
  //       for (var m of apiMessages.values()) {
  //         let mes: messagesMerge = {
  //           apiMessage: m,
  //           apiMessageAck: undefined,
  //           apiMessageDisplayed: undefined,
  //           apiMessageResponse: undefined,
  //         };
  //         messages.set(
  //           m.message_time.toString() + "-" + m.participant.toString(),
  //           mes
  //         );
  //       }
  //     }
  //   }

  //   let messagesArray: messagesMerge[] = [];
  //   for (var mm of messages.values()) {
  //     messagesArray.push(mm);
  //   }
  //   this.rallyMessagesMerge.set(rally_id, messagesArray);
  //   this.updateAlerts(rally_id);
  // }

  public setStageClosed(rallyId: number, stageId: number, closed: number) {
    if (this.socket) {
      console.log("EMMITING SET STAGE CLOSED...");
      this.socket.emit("setStageClosed", rallyId, stageId, closed);
    }
  }

  public setStageStatus(rallyId: number, stageId: number, status: number) {
    if (this.socket) {
      this.socket.emit("setStageStatus", rallyId, stageId, status);
    }
  }

  public setStageFlag(cmd: flagCommand) {
    if (this.socket) {
      //console.log("SENDING FLAG CMD...", cmd);
      this.socket?.emit("setFlag", JSON.stringify(cmd));
    } else {
      console.log("SOCKET IO NOT CONNECTED...");
    }
  }

  public setSosAck(
    cmd: sosAckCommand,
    rallyId: number,
    callback: (response: apiLogResponse) => void
  ) {
    let log: logLine[] = [];

    if (this.socket) {
      this.socket?.emit("setSosAck", rallyId, cmd, callback);
    } else {
      callback({
        log: log,
        status: "ERROR",
        error: "Socket IO is not Connected to PPTracker DATA SERVER",
      });
    }
  }

  public getReplayData(
    query: positionRecordsRequestQuery,
    callback: (data: apiPositionRecord[], error?: unknown) => void
  ) {
    if (this.socket) {
      this.socket?.emit(
        "onPositionRecordsRequest",
        query.rallyId,
        query.startTime,
        query.endTime,
        query.participants,
        callback
      );
    } else {
      callback([], "Socket IO is not Connected to PPTracker DATA SERVER");
    }
  }

  public getStageEventsData(
    query: stageEventQuery,
    callback: (data: apiStageEvent[], error?: unknown) => void
  ) {
    if (this.socket) {
      this.socket?.emit(
        "onStageEventsRequest",
        query.rallyId,
        query.startTime,
        query.endTime,
        query.participant,
        callback
      );
    } else {
      callback([], "Socket IO is not Connected to PPTracker DATA SERVER");
    }
  }

  public getIncidencesData(
    query: incidencesQuery,
    callback: (data: apiIncidence[], error?: unknown) => void
  ) {
    if (this.socket) {
      this.socket?.emit(
        "onIncidencesRequest",
        query.rallyId,
        query.startTime,
        query.endTime,
        query.participant,
        callback
      );
    } else {
      callback([], "Socket IO is not Connected to PPTracker DATA SERVER");
    }
  }

  public setNewMessage(
    cmd: messageCommand,
    rallyId: number,
    callback: (response: apiLogResponse) => void
  ) {
    let log: logLine[] = [];

    if (this.socket) {
      this.socket?.emit("setNewMessage", rallyId, cmd, callback);
    } else {
      callback({
        log: log,
        status: "ERROR",
        error: "Socket IO is not Connected to PPTracker DATA SERVER",
      });
    }
  }

  private async getHashToken(token: string): Promise<string> {
    const salt = await bcrypt.genSalt(8);
    const hashed = await bcrypt.hash(token, salt);
    return hashed;
  }

  public getAPIActiveEvents(): apiEvent[] {
    return this.apiActiveEvents;
  }

  public getAPIEventInfoFor(slug: string): apiEventInfo | apiErrorMessage {
    if (this.apiActiveEventsInfoBySlug.has(slug)) {
      return <apiEventInfo>this.apiActiveEventsInfoBySlug.get(slug);
    } else return { message: "Invalid Event Slug" };
  }

  public getAPIRallyInfoForEvent(
    evSlug: string,
    rallySlug: string
  ): apiRally | apiErrorMessage {
    if (this.apiActiveEventsInfoBySlug.has(evSlug)) {
      const apiEv = <apiEventInfo>this.apiActiveEventsInfoBySlug.get(evSlug);
      for (var rally of apiEv.rallies) {
        if (rally.slug === rallySlug) {
          return rally;
        }
      }
      return { message: "Invalid Rally Slug" };
    } else return { message: "Invalid Event Slug" };
  }

  public getAPIRallyParticipants(
    evSlug: string,
    rallySlug: string
  ): apiParticipant[] | apiErrorMessage {
    if (this.apiActiveEventsInfoBySlug.has(evSlug)) {
      const apiEv = <apiEventInfo>this.apiActiveEventsInfoBySlug.get(evSlug);
      for (var rally of apiEv.rallies) {
        if (rally.slug === rallySlug) {
          return <apiParticipant[]>this.apiRallyParticipants.get(rally.id);
        }
      }
      return { message: "Invalid Rally Slug" };
    } else return { message: "Invalid Event Slug" };
  }

  public getAPIRallyStages(
    evSlug: string,
    rallySlug: string
  ): apiStage[] | apiErrorMessage {
    if (this.apiActiveEventsInfoBySlug.has(evSlug)) {
      const apiEv = <apiEventInfo>this.apiActiveEventsInfoBySlug.get(evSlug);
      for (var rally of apiEv.rallies) {
        if (rally.slug === rallySlug) {
          return <apiStage[]>this.apiRallyStages.get(rally.id);
        }
      }
      return { message: "Invalid Rally Slug" };
    } else return { message: "Invalid Event Slug" };
  }

  public getAPIRallyStageTimes(
    evSlug: string,
    rallySlug: string,
    stageIdx: string
  ): apiParticipantWaypointTimes[] | apiErrorMessage {
    const key = evSlug + "-" + rallySlug + "-" + stageIdx;
    if (this.apiWaypointsMap.has(key)) {
      return <apiParticipantWaypointTimes[]>this.apiWaypointsMap.get(key);
    } else return { message: "Invalid Parameters" };
  }

  public getAPIRallyWaypointTimes(
    evSlug: string,
    rallySlug: string,
    stageIdx: string,
    wpIdx: string
  ): apiWaypointParticipantTime[] | apiErrorMessage {
    const key = evSlug + "-" + rallySlug + "-" + stageIdx + "-" + wpIdx;
    if (this.apiWaypointParticipantMap.has(key)) {
      const waypointTimes = <apiWaypointParticipantTime[]>(
        this.apiWaypointParticipantMap.get(key)
      );
      return waypointTimes.sort((a, b) => b.time - a.time);
    } else return { message: "Invalid Parameters" };
  }

  public getRallyParticipantWithNumber(
    rallyId: number,
    participantNumber: string
  ): participantInfo | undefined {
    const pMap = this.rallyParticipantsById.get(rallyId);
    if (pMap) {
      for (var pInfo of pMap.values()) {
        if (pInfo.number === participantNumber) {
          return pInfo;
        }
      }
    }
    return undefined;
  }

  public getRallyStageWithId(
    rallyId: number,
    stageId: number
  ): stage | undefined {
    //console.log("STAGES???", this.rallyStages.get(rallyId));

    if (this.rallyStages.has(rallyId)) {
      const sMap = this.rallyStages.get(rallyId);
      if (sMap?.has(stageId)) {
        return sMap.get(stageId);
      }
    }
    return undefined;
  }
}

export const ppTrackerClient = new PPTrackerDataServerIoClient(
  process.env.NODE_ENV === "production"
    ? "https://backoffice.pp-tracker.com"
    : "http://127.0.0.1:3005"
  //  : "http://10.254.254.233:3005"
);
