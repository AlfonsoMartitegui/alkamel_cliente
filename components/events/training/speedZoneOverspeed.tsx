import { Fragment, useEffect, useState } from "react";
import React from "react";
import { Table } from "react-bootstrap";

import { event, speed_zones, stage } from "@prisma/client";

import { participantInfo, rallyInfo } from "server/ppTrackerdataServerIoClient";
import { apiIncidence } from "server/shared/socket_io_packets";
import { millisToCurrentDate } from "server/shared/utils";
import { Line } from "react-chartjs-2";
import {
  Chart,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
} from "chart.js";

export interface OverSpeedListProps {
  rally: rallyInfo | undefined;
  event: event | undefined;
  data: apiIncidence[];
  showDetails?: boolean;
  overspeedMargin: number;
  onTotalOverSpeeds: (totalOverSpeeds: number) => void;
}

export interface oversSpeedLogLine {
  lat: number;
  lon: number;
  t: number;
  sp: number;
  m: number;
}
export interface overSpeedData extends apiIncidence {
  logArray: oversSpeedLogLine[];
  duration: number;
  distance: number;
  maxSpeed: number;
  maxAllowedSpeed: number;
  lat: number;
  lng: number;
}

const SpeedZoneOverspeedListComponent: React.FC<OverSpeedListProps> = (
  props
) => {
  Chart.register(
    ArcElement,
    LineElement,
    BarElement,
    PointElement,
    BarController,
    BubbleController,
    DoughnutController,
    LineController,
    PieController,
    PolarAreaController,
    RadarController,
    ScatterController,
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    RadialLinearScale,
    TimeScale,
    TimeSeriesScale,
    Decimation,
    Filler,
    Legend,
    Title,
    Tooltip
  );

  const [overspeedData, setOverspeedData] = useState<overSpeedData[]>([]);
  // Chart.register(point)

  const getStageName = (id: number) => {
    if (stagesById.has(id)) {
      return stagesById.get(id)?.time_control;
    } else {
      return "(id: " + id.toString() + ")";
    }
  };

  const getSpeedZoneName = (id: number) => {
    if (speedZones.has(id)) {
      const sz = speedZones.get(id) as speed_zones;
      return sz.name;
    } else {
      return "(id: " + id.toString() + ")";
    }
  };

  useEffect(() => {
    let newData: overSpeedData[] = [];
    let speedZones = new Map<number, speed_zones>();
    let stagesById = new Map<number, stage>();

    const overspeedMargin = isNaN(props.overspeedMargin)
      ? 0
      : props.overspeedMargin;

    if (props.rally) {
      for (var st of props.rally.stages) {
        stagesById.set(Number(st.id), st);
      }

      for (var t of props.rally.track) {
        for (var sp of t.speed_zones) {
          speedZones.set(Number(sp.id), sp);
        }
      }
      console.log("TOTAL SPEED ZONES: ", speedZones.size, speedZones);
    }

    for (var i of props.data) {
      if (i.type !== 9) {
        continue;
      }

      let maxAllowedSpeed = Number(speedZones.get(i.entity_id)?.maximum_speed);
      if (isNaN(maxAllowedSpeed)) {
        maxAllowedSpeed = 0;
      }
      let overSpeed: overSpeedData = {
        logArray: [],
        duration: 0,
        maxSpeed: 0,
        maxAllowedSpeed: maxAllowedSpeed,
        distance: 0,
        lat: 0,
        lng: 0,
        ...i,
      };

      if (i.startTime > 0 && i.endTime > 0) {
        overSpeed.duration = i.endTime - i.startTime;
      }

      const logString = i.log ? i.log : "";
      if (logString.length > 0) {
        try {
          overSpeed.logArray = JSON.parse(logString);
          let firstOverSpeedDistance = 0;

          for (var l of overSpeed.logArray) {
            if (l.sp > overSpeed.maxSpeed) {
              overSpeed.maxSpeed = l.sp;
            }
            if (
              l.sp / 10 >= overSpeed.maxAllowedSpeed &&
              firstOverSpeedDistance === 0
            ) {
              //console.log("Setting first Distanca from ", l);
              overSpeed.lat = l.lat / 10000000;
              overSpeed.lng = l.lon / 10000000;
              firstOverSpeedDistance = l.m;
            }
          }
          if (firstOverSpeedDistance > 0) {
            const endPosition =
              overSpeed.logArray[overSpeed.logArray.length - 1].m;
            overSpeed.distance = endPosition - firstOverSpeedDistance;
            // console.log(
            //   "Setting total distance:",
            //   endPosition,
            //   overSpeed.distance
            // );
          }
        } catch {
          console.log("ERROR PARCING LOG DATA: ", i.log);
        }
      }
      if (
        overSpeed.maxSpeed / 10 - overspeedMargin >
        overSpeed.maxAllowedSpeed
      ) {
        newData.push(overSpeed);
      }
    }
    setOverspeedData(newData);
    props.onTotalOverSpeeds(newData.length);
  }, [props.data.length, props.data, props.rally, props]);

  const ev = props.event;
  const evOffsetMillis = ev ? ev.offsetGMT * 3600000 : 0;

  let participantsById = new Map<number, participantInfo>();
  let speedZones = new Map<number, speed_zones>();
  let stagesById = new Map<number, stage>();

  if (props.rally) {
    for (var p of props.rally.participants) {
      participantsById.set(Number(p.id), p);
    }
    for (var st of props.rally.stages) {
      stagesById.set(Number(st.id), st);
    }
    for (var t of props.rally.track) {
      for (var sp of t.speed_zones) {
        speedZones.set(Number(sp.id), sp);
      }
    }
  }

  const getIncidenceChartData = (i: overSpeedData) => {
    let speedData: number[] = [];
    let maxSpeedData: number[] = [];
    let labels: string[] = [];
    let startTime: number = 0;
    for (var l of i.logArray) {
      maxSpeedData.push(i.maxAllowedSpeed);
      speedData.push(l.sp / 10);
      labels.push(`${startTime === 0 ? 0 : (l.t - startTime) / 1000}s`);
      if (startTime === 0) {
        startTime = l.t;
      }
    }

    const data = {
      labels: labels,
      datasets: [
        {
          label: "Speed (Kph)",
          data: speedData,
          fill: true,
          backgroundColor: "rgba(75,192,192,0.2)",
          borderColor: "rgba(75,192,192,1)",
        },
        {
          label: "Max speed",
          data: maxSpeedData,
          fill: false,
          borderColor: "#ff0000",
        },
      ],
      options: {
        responsive: true,
        maintainAspectRatio: false,
      },
    };
    return data;
  };

  return (
    <Table striped bordered responsive variant="dark">
      <thead>
        <tr>
          <th>Nr</th>
          <th>Driver</th>
          <th>Codriver</th>
          <th>Stage</th>
          <th>Spd.Zone</th>
          <th>Start</th>
          <th>End</th>
          <th>Duration</th>
          <th>Distance</th>
          <th>Max Speed</th>
          <th>Location</th>
        </tr>
      </thead>
      <tbody>
        {overspeedData
          .sort((a, b) => {
            const partA = participantsById.get(a.participantId);
            const partB = participantsById.get(b.participantId);
            if (a.participantId !== b.participantId) {
              if (partA !== undefined && partB != undefined) {
                if (Number(partA.number) < Number(partB.number)) return -1;
                else return 1;
              } else {
                if (Number(a.participantId) < Number(b.participantId))
                  return -1;
                else return 1;
              }
            } else {
              if (Number(a.startTime) < Number(b.startTime)) return -1;
              else return 1;
            }
          })
          .filter((i) => i.type == 9)
          .map((incidence, index) => (
            <Fragment key={index}>
              <tr key={Number(index)}>
                <td>{participantsById.get(incidence.participantId)?.number}</td>
                <td>
                  {participantsById.get(incidence.participantId)?.driver_name +
                    " " +
                    participantsById.get(incidence.participantId)
                      ?.driver_surname}
                </td>
                <td>
                  {participantsById.get(incidence.participantId)
                    ?.codriver_name +
                    " " +
                    participantsById.get(incidence.participantId)
                      ?.codriver_surname}
                </td>
                <td>{getStageName(incidence.stageId)}</td>
                <td>{getSpeedZoneName(incidence.entity_id)}</td>
                <td>
                  {millisToCurrentDate(
                    incidence.startTime,
                    evOffsetMillis,
                    "DATE_TIME",
                    " "
                  )}
                </td>
                <td>
                  {millisToCurrentDate(
                    incidence.endTime,
                    evOffsetMillis,
                    "DATE_TIME",
                    " "
                  )}
                </td>
                <td>{incidence.duration / 1000}</td>
                <td>
                  {incidence.distance > 0
                    ? `${incidence.distance / 100} m`
                    : "-"}{" "}
                </td>
                <td>{incidence.maxSpeed / 10} Kph</td>
                <td>
                  <a
                    target="_blank"
                    href={`https://www.google.com/maps/search/?api=1&query=${incidence.lat},${incidence.lng}`}
                    rel="noopener noreferrer"
                  >
                    {`${incidence.lat}, ${incidence.lng}`}
                  </a>
                </td>
              </tr>
              <tr className="border-bottom" key={index.toString() + "GFX"}>
                <td className="border-bottom" colSpan={11}>
                  <Line
                    key={index.toString() + "_C"}
                    data={getIncidenceChartData(incidence)}
                    height={50}
                  />
                </td>
              </tr>
            </Fragment>
          ))}
      </tbody>
    </Table>
  );
};

export default SpeedZoneOverspeedListComponent;
