export type apiLogResponse = {
  log: logLine[];
  status?: string;
  error?: unknown | string;
};

export interface logLine {
  type: logLineType;
  message: string;
  time: number;
  idx: number;
}

export type logLineType = "ERROR" | "SUCCESS" | "INFO" | "WARNING" | "DEBUG";

export const createLogLineFromError = (
  idx: number,
  e: unknown,
  defaultMessage: string
): logLine => {
  let errorMessage = defaultMessage;
  if (typeof e === "string") {
    errorMessage += e.toUpperCase();
  } else if (e instanceof Error) {
    errorMessage += e.message; // works, `e` narrowed to Error
  }
  return {
    idx: idx,
    type: "ERROR",
    time: new Date().getTime(),
    message: errorMessage,
  };
};

export const addMessageToLog = (
  message: string,
  type: logLineType,
  log: logLine[],
  idx?: number
): logLine[] => {
  log.push({
    idx: idx ? idx : log.length + 1,
    type: type,
    time: new Date().getTime(),
    message: message,
  });
  return log;
};

export const createLogLine = (
  idx: number,
  message: string,
  type: logLineType
) => {
  return {
    idx: idx,
    type: type,
    time: new Date().getTime(),
    message: message,
  };
};

export interface apiPositionV0 {
  rallyid: number;
  participantid: number;
  lat: number;
  lon: number;
  meter: number;
  stageid: number;
  speed: number;
  time: number;
  GPRSQuality: string | null;
  GPRSBand: string | null;
  GPSStatus: number | null;
  batteryVoltage: number | null;
  battery: number | null;
  carVoltage: number | null;
  carCurrent: number | null;
  internalTemperature: number | null;
}
export interface apiPosition {
  rally_id: number;
  participant: number;
  pptracker_id: number;
  stage_id: number;
  time: number;
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
