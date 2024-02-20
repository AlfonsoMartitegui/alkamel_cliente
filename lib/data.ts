// QUERIES / ACTUALIZACIONES DE LA BASE DE DATOS / DATOS LIVE
//      - DATOS INICIALES DEL EVENTO ACTUAL (Filtro por campo 'event.slug'), i listado de datos básicos de los rallies (Solo nombres i IDs)
//      - SNAPSHOOT INICIAL DE UN RALLY: Todos los datos completos (Entrylist, Itinerario, Alertas, etc...)
//      - ACTUALIZACION DE ALERTAS i POSICION GPS DE LOS PARTICIPANTES / OFICIAL CARS
//      - Aviso de cambio de datos "estáticos" : Entrylist, campos informacion rally / evento, trazado, etc...
//      - Aviso de coche Stopped (Llegan datos del dispositivo, pero no se esta moviendo)
//      - Aviso de coche "Desconnectado" (Hace más de XXX segundos que no se recibe ningún paqueta de este participante / officialcar)

// COMANDOS A SERVIDOR
//
//      - Cambio d'status de Participante (Contra base de datos)
//      - Nueva bandera Roja / Amarilla en control XXX....
//      - Cambio d'status de Stage / Leg / Section
//      - Nuevo mensaje a Participante/s / OfficialCar/s
//      - Dar por cerrada una Stage / Section / Leg
//      - Dar Alerta por acdeptada (Para saber que "Race Control" la ha visto)
//      - Dar Alerta por finalizada / cerrada
//
//      DESDE BACKOFFICE, O TAMBIEN DESDE VISTA RACE CONTROL???
//              - Abrir / Cerrar Evento <= Vale la pena, o lo gestionamos solo a nivel de Rally?
//              - Abrir / Cerrar Rally

export interface Event {
  id: number;
  name: string;
  slug: string;
  start_date: Date | null;
  end_date: Date | null;
  country_id: bigint;
  base_location: string | null;
  time_zone: string | null;
  surface: string | null;
  website_url: string | null;
  logo: string | null;
  active: number | null;
  public: number | null;
  login_required_for_public_view: number | null;
  promoter_id: bigint;
  rallies: Rally[] | null;
  closed: boolean; //If true get all the information from DB, otherwise mix between DB and Tinybird API.
  offsetGTM: number;
}

export interface Rally {
  id: bigint;
  name: string | null;
  slug: string | null;
  start_date: Date | null;
  end_date: Date | null;
  surface: string | null;
  website_url: string | null;
  event_id: number;
  season_id: bigint;
  entrylist: Participant[];
  officialCars: OfficialCar[];
  itinerary: Stage[];
  closed: boolean; //If true get all the information from DB, otherwise mix between DB and Tinybird API.
}

export interface Stage {
  id: number;
  type: StageType;
  number: number;
  name: string;
  description: string;
  surface: string;
  distance: number;
  status: StageStatus;
  isClosed: boolean;
  section: Section;
  track: Track;
  alerts: AlertDetails[];
}

export enum StageType {
  Shakedown,
  SpecialStage,
  TranspontStage,
  SuperSpecial,
}

export interface Section {
  id: number;
  number: number;
  name: string;
  status: StageStatus;
}

export interface Leg {
  id: number;
  number: number;
  name: string;
  startDate: string;
}

export enum StageStatus {
  ToRun,
  Running,
  Yellow,
  Red,
  Finished,
}

export interface Track {
  kml: string; //URL o Datos del arxivo a cargar en Google Maps
  RaceControlPoints: raceControlPoint[];
}

export interface raceControlPoint {
  name: string;
  index: number;
  trckGPSPosition: GPSPosition;
  trackMeter: number;
  currentFlag: FlagStatus;
}

export enum FlagStatus {
  Red = 1,
  Yellow,
  None,
}

export interface Participant {
  number: string;
  driver: Person;
  codriver: Person;
  vehicle: Vehicle;
  team: Team;
  position: GPSPosition;
  currentStage: Stage;
  status: string;
  alerts: AlertDetails[];
  hasPendingAlerts: boolean;
  currentStatus: ParticipantStatus;
  category: ParticipantTag; //FALTA VER SI LO REJUNTAMOS TODO CON TAGS o NO....
  tags: ParticipantTag[];
}

export interface OfficialCar {
  name: string;
  shortName: string;
  position: GPSPosition;
  alerts: AlertDetails[];
  hasPendingAlerts: boolean;
}

export interface ParticipantTag {
  name: string;
  shortName: string;
  foreColor: string;
  backgroundColor: string;
}

export enum ParticipantStatus {
  Active = 1,
  Excluded,
  Hide,
  Not_Authorized,
  Out,
  Rejoined,
  Retired,
}

export interface GPSPosition {
  lat: number;
  lng: number;
}

export interface Person {
  id: bigint;
  first_name: string | null;
  second_name: string | null;
  birthday: Date | null;
  born_country_id: bigint;
  nationality_country_id: bigint;
}

export interface Team {
  id: number;
  name: string;
  country: Country;
}

export interface Vehicle {
  id: number;
  name: string;
  manufacturer: Manufacturer;
}

export interface Manufacturer {
  id: number;
  name: string;
  country: Country;
}

export interface Country {
  id: number;
  name: string;
  countryCode: string;
}

export interface AlertDetails {
  date: string;
  stage: string;
  participantNumber: string;
  message: string;
}

export interface AlertDetails2 {
  date: string;
  stage: string;
  participantNumber: string;
  alertType: AlertType;
  alertDetails:
    | SOS
    | BlueFlag
    | MessageAlert
    | YellowFlagAlert
    | RedFlagAlert
    | Overspeed
    | StoppedAlert
    | NoDataOrDisconnectedAlert
    | BackTrackAlert
    | OverTrainingAlert;

  accepted: boolean;
  closed: boolean;
}

export enum AlertType {
  SOS,
  BlueFlag,
  Message,
  YellowFlag,
  RedFlag,
  Overspeed,
  Stopped,
  NoDataOrDisconnected,
  Backtrack,
}

export interface OverTrainingAlert {}

export interface BackTrackAlert {}

export interface StoppedAlert {}

export interface NoDataOrDisconnectedAlert {}

export interface SOS {}

export interface BlueFlag {}

export interface MessageAlert {}

export interface Overspeed {}

export interface YellowFlagAlert {}

export interface RedFlagAlert {}

export interface PredefinedMessages {
  id: number;
  message: string;
  responseType: MessageResponseType;
}

export enum MessageResponseType {
  YesNo,
  Ok,
}
