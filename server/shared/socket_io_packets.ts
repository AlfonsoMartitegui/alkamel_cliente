import { pptracker_shortcodes, rally } from "@prisma/client";
import { apiLogResponse, logLine } from "./apiSharedTypes";

export interface ServerToClientEvents {
  countries: (countries: string) => void;
  stageTypes: (stageTypes: string) => void;
  activeEvents: (activeEvents: string) => void;
  newActiveEvents: (activeEvents: string) => void;
  noArg: () => void;
  status: (connectionStatus: "connected" | "disconnected") => void;
  basicEmit: (a: number, b: string, c: Buffer) => void;
  withAck: (d: string, callback: (e: number) => void) => void;
  position: (positions: string) => void;
  incidences: (incidences: apiIncidence[]) => void;
  blueFlags: (blueFlags: apiBlueFlag[]) => void;
  waypointEvents: (waypointEvents: apiWaypointEvent[]) => void;
  sosAlertsMerge: (sosAlerts: apiSosAlertMerge[]) => void;
  sosAlerts: (sosAlerts: apiSosAlert[]) => void;
  sosTypeData: (apiSosTypeData: apiSosTypeData[]) => void;
  sosEnd: (apiSosEnd: apiSosEnd[]) => void;
  sosAck: (apiSosAck: apiSosAck[]) => void;
  message: (apiMessage: apiMessage[]) => void;
  messageAck: (apiMessageAck: apiMessageAck[]) => void;
  messageDisplayed: (apiMessageDisplayed: apiMessageDisplayed[]) => void;
  messageResponse: (apiMessageResponse: apiMessageResponse[]) => void;
  flagAlerts: (flagAlerts: apiFlagAlert[]) => void;
  flagMergeAlerts: (flagAlerts: apiFlagMergeAlert[]) => void;
  flagDisplayedData: (flagDisplayedData: apiFlagDisplayedData[]) => void;
  flagAckData: (flagAckData: apiFlagAckData[]) => void;
  connectedStatus: (connectedStatus: string) => void;
  ppTrackerShortCodes: (ppTrackerShortCodes: pptracker_shortcodes[]) => void;
}

export interface ClientToServerEvents {
  status: () => void;
  subscribe: (channel: string) => void;
  setStageStatus: (rallyId: number, stageId: number, status: number) => void;
  setStageClosed: (rallyId: number, stageId: number, closed: number) => void;
  setFlag: (id: string) => void;
  setNewMessage: (
    rallyId: number,
    message: messageCommand,
    callback: (response: apiLogResponse) => void
  ) => void;
  setSosAck: (
    rallyId: number,
    message: sosAckCommand,
    callback: (response: apiLogResponse) => void
  ) => void;
  onSendRallyCalendar: (rallyId: number) => void;
  onSendRallyConfig: (rallyId: number) => void;
  onAssignTransponders: (rallyId: number) => void;
  onAssignStages: (rallyId: number) => void;
  onDatabaseRefreshRequest: (rallyId: number) => void;
  onParticipantsImport: (
    rallyId: number,
    csvData: string,
    callback: (response: apiLogResponse) => void
  ) => void;
  onOfficialCarsImport: (
    rallyId: number,
    csvData: string,
    callback: (response: any) => void
  ) => void;
  onEditPPTracker: (
    rallyId: number,
    partNumber: string,
    ppTrackerId: string,
    action: string,
    callback: (response: any) => void
  ) => void;
  onUpdateTracksWithKml: (
    rallyId: number,
    csvData: string,
    callback: (response: logLine[]) => void
  ) => void;
  onUpdateRally: (
    rallyId: number,
    data: rally,
    callback: (response: logLine[]) => void
  ) => void;
  onUpdateItineraryWithCsv: (
    rallyId: number,
    csvData: string,
    callback: (response: apiLogResponse) => void
  ) => void;
  onUpdateTrainingWindowsWithCsv: (
    rallyId: number,
    csvData: string,
    callback: (response: apiLogResponse) => void
  ) => void;
  onRequestEventData: (
    eventId: number,
    callback: (event: string | undefined) => void
  ) => void;
  onPositionRecordsRequest: (
    rallyId: number,
    startTime: number,
    endTime: number,
    participants: number[],
    callback: (records: apiPositionRecord[], error?: unknown) => void
  ) => void;
  onStageEventsRequest: (
    rallyId: number,
    startTime: number,
    endTime: number,
    participant: number,
    callback: (records: apiStageEvent[], error?: unknown) => void
  ) => void;
  onIncidencesRequest: (
    rallyId: number,
    startTime: number,
    endTime: number,
    participant: number,
    callback: (records: apiIncidence[], error?: unknown) => void
  ) => void;
}

export interface apiBlueFlag {
  participant_target: number;
  participant_requester: number;
  rally_id: number;
  stage_id: number;
  blue_flag_request_time: number;
  blue_flag_displayed_time: number;
  blue_flag_response_time: number;
  blue_flag_response_accepted_time: number;
  blue_flag_timeout: number;
  published_at: number;
  blue_flag_pptracker_target: number;
  pptracker_requester_id: number;
  pptracker_target_id: number;
}

export interface apiIncidence {
  rallyId: number;
  participantId: number;
  stageId: number;
  pptrackerId: number;
  startTime: number;
  endTime: number;
  type: number;
  log?: string;
  entity_id: number;
}

export interface apiStageEvent {
  rally_id: number;
  stage_id: number;
  participant_id: number;
  pptracker_id: number;
  type: number;
  time: number;
  lat: number;
  lon: number;
}

export interface positionRecordsRequestQuery {
  rallyId: number;
  startTime: number;
  endTime: number;
  participants: number[];
}

export interface stageEventQuery {
  rallyId: number;
  startTime: number;
  endTime: number;
  participant: number;
}

export interface incidencesQuery {
  rallyId: number;
  startTime: number;
  endTime: number;
  participant: number;
}

export interface apiFlagMergeAlert {
  rally_id: number;
  stage_id: number;
  pptracker_id: number;
  flag_time: number;
  flag_type: number;
  flag_meters: number;
  published_at: number;
  participant_id: number;
  displayed_time: number;
  displayed_lat: number;
  displayed_lon: number;
  flag_auto_displayed: number;
  ack_time: number;
  flag_autoack: number;
  flag_ack_lat: number;
  flag_ack_lon: number;
}

export interface apiPositionRecord {
  participant: number;
  rally_id: number;
  pptracker_id: number;
  stage_id: number;
  time: number;
  published_at: number;
  lat: number;
  lon: number;
  speed: number;
  meter: number;
  GPRSQuality: string | null;
  GPRSBand: string | null;
  GPSStatus: number | null;
  GPSSat: number | null;
  GPSHDOP: number | null;
  batteryVoltage: number | null;
  battery: number | null;
  carVoltage: number | null;
  carCurrent: number | null;
  internalTemperature: number | null;
  course: number;
  altitude: number;
  accelerationX: number;
  accelerationY: number;
  accelerationZ: number;
}

export interface apiWaypointEvent {
  rally_id: number;
  participant: number;
  stage_id: number;
  waypoint_id: number;
  pptrackerId: number;
  pptracker_id: number;
  type: number;
  time: string;
}

// export interface messagesMerge {
//   apiMessage: apiMessage;
//   apiMessageAck: apiMessageAck | undefined;
//   apiMessageDisplayed: apiMessageDisplayed | undefined;
//   apiMessageResponse: apiMessageResponse | undefined;
// }

// export interface apiMessage {
//   participant: number;
//   rally_id: number;
//   pptracker_id: number;
//   message_time: number;
//   message_text: string;
//   message_has_response: number;
//   stage_id: number;
//   message_priority: number;
//   published_at: number;
// }
export interface apiMessage {
  participant: number;
  rally_id: number;
  pptracker_id: number;
  message_time: number;
  message_text: string;
  message_type: number;
  message_has_response: number;
  stage_id: number;
  message_priority: number;
  published_at: number;
  message_received_time: number;
  message_displayed_at: number;
  stage_displayed: number;
  message_response: number;
  message_response_time: number;
}
export interface apiMessageAck {
  participant: number;
  rally_id: number;
  pptracker_id: number;
  message_time: number;
  message_received_time: number;
  published_at: number;
}

export interface apiMessageDisplayed {
  participant: number;
  rally_id: number;
  pptracker_id: number;
  message_time: number;
  message_displayed_at: number;
  stage_id: number;
  published_at: number;
}

export interface apiMessageResponse {
  participant: number;
  rally_id: number;
  pptracker_id: number;
  message_time: number;
  message_response_time: number;
  message_response: number;
  published_at: number;
}

export interface apiConnectedData {
  participantId: number;
  status: boolean;
}

export interface ConnectedStatusData {
  rallyId: number;
  statusArray: apiConnectedData[];
}

export interface apiFlagAlert {
  stageid: number;
  participantid: number;
  rallyid: number;
  fTime: number;
  type: number;
  meter: number;
}

export interface flagAlertDetails extends apiFlagAlert {
  displayedTime: number;
  ackTime: number;
}

export interface apiFlagDisplayedData {
  stageid: number;
  participantid: number;
  rallyid: number;
  fTime: number;
  type: number;
  displayedTime: number;
}

export interface apiFlagAckData {
  stageid: number;
  participantid: number;
  rallyid: number;
  fTime: number;
  type: number;
  ackTime: number;
}

export interface flagAlert {
  stage_id: number;
  rally_id: number;
  flag_time: number;
  flag_type: number;
  flag_meters: number;
  details: apiFlagMergeAlert[];
}

export interface apiSosAlert {
  stageid: number;
  participantid: number;
  rallyid: number;
  lat: number;
  lon: number;
  requestedSOSParticipantId: number;
  sosTime: number;
  type: number;
}

export interface apiSosAck {
  stageid: number;
  rallyid: number;
  sosTime: number;
  requestedSOSParticipantId: number;
  sosAckTime: number;
}

export interface apiSosAlertMerge {
  rally_id: number;
  stage_id: number;
  time: number;
  type: number;
  subtype: number;
  ack_time: number;
  end_time: number;
  participant: number;
  pptracker_id: number;
  participant_sender: number;
  participant_sender_id: number;
  lat: number;
  lon: number;
}

export interface apiSosEnd {
  stageid: number;
  participantid: number;
  rallyid: number;
  lat: number;
  lon: number;
  requestedSOSParticipantId: number;
  sosTime: number;
  type: number;
}

export interface apiSosTypeData {
  stageid: number;
  participantid: number;
  rallyid: number;
  sosTime: number;
  requestedSOSParticipantId: number;
  type: number;
}

export interface sosAlert extends apiSosAlert {
  sosType: number;
  sosEndTime: number;
  sosAckTime: number;
}

export interface rallyAlert {
  time: number;
  alertType: number;
  alert: flagAlert | apiSosAlertMerge | apiIncidence | apiMessage | apiBlueFlag;
}

export function isFlagAlert(object: any): object is flagAlert {
  if ("flag_time" in object) {
    console.log("IS FLAG ALERT!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  }
  return "details" in object;
}

export function isSosAlert(object: any): object is apiSosAlertMerge {
  return "subtype" in object && "participant_sender" in object;
}

export function isIncidenceAlert(object: any): object is apiIncidence {
  return "entity_id" in object && "type" in object;
}

export function isBlueFlagAlert(object: any): object is apiBlueFlag {
  return "blue_flag_request_time" in object;
}

export function isMessageAlert(object: any): object is apiMessage {
  return "message_response" in object && "message_time" in object;
}

export interface flagCommand {
  rallyId: number;
  stageId: number;
  waypointId: number;
  flag: FlagType;
}
export interface stageCloseCommand {
  rallyId: number;
  stageId: number;
  closed: number;
}

export interface stageStatusCommand {
  rallyId: number;
  stageId: number;
  status: number;
}

export interface messageCommand {
  rallyId: number;
  stageId: number;
  participantsId: number[];
  hasResponse: boolean;
  type: "FREE" | "PREDEFINED";
  priority: "SOS" | "NORMAL" | "INFO";
  message: string;
}

export interface sosAckCommand {
  rallyId: number;
  participantId: number;
  ppTrackerId: number;
  sosTime: number;
  ackTime: number;
}

export enum FlagType {
  NoFlag = 0,
  RedFlag = 1,
  YellowFlag = 2,
}
