export interface apiEvent {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  country: string;
  base_location: string;
  time_zone: string;
  surface: string;
  closed: boolean;
  offsetGMT: number;
}

export interface apiEventInfo extends apiEvent {
  rallies: apiRally[];
}

export interface apiRally {
  id: number;
  name: string;
  slug: string;
  start_date: string;
  end_date: string;
  surface: string;
  closed: boolean;
}

export interface apiParticipant {
  number: string;
  driver: string;
  driverCountry: string;
  coDriver: string;
  coDriverCountry: string;
  vehicle: string;
  team: string;
  tyres: string;
  status: string;
  category: string;
}

export interface apiStage {
  leg: number;
  section: number;
  sector: number;
  idx: number;
  stage_number: number;
  time_control: string;
  name: string;
  distance: string;
  type: string;
  sumer_time_offset: number;
  date: string;
  firstCarAt: string;
  waypoints: apiWaypoint[];
}

export interface apiWaypoint {
  idx: number;
  name: string;
  lon: number;
  lat: number;
  km: number;
}

export interface apiWaypointTime {
  idx: number;
  time: number;
}

export interface apiParticipantWaypointTimes {
  number: string;
  waypoints: apiWaypointTime[];
}

export interface apiErrorMessage {
  message: string;
  details?: string;
}
