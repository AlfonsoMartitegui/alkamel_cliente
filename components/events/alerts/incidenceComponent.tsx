import React from "react";
import { apiIncidence } from "server/shared/socket_io_packets";
import { eventInfo, participantInfo } from "server/ppTrackerdataServerIoClient";
import { Button } from "react-bootstrap";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";
import Image from "next/image";

interface incidenceAlertProps {
  event: eventInfo | undefined;
  incidence: apiIncidence;
  participants: participantInfo[];
  stages: stage[];
  onDetails: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCenterMapOnParticipant?: (participantId: number) => void;
}

const IncidenceComponent: React.FC<incidenceAlertProps> = (props) => {
  const [showDetails, setShowDetails] = React.useState<boolean>(false);
  const onShowDetails = () => {
    if (props.incidence.type === 11) {
      //Stopped
      if (props.onCenterMapOnParticipant) {
        props.onCenterMapOnParticipant(props.incidence.participantId);
      }
    } else setShowDetails(!showDetails);
  };

  //   const onHide = () => {
  //     setShowDetails(false);
  //   };

  const participantsById = new Map<BigInt, participantInfo>();
  const stagesMap = new Map<number, stage>();

  for (var p of props.participants) {
    participantsById.set(p.id, p);
  }
  for (var s of props.stages) {
    stagesMap.set(Number(s.id), s);
  }

  const evOffsetMillis = props.event ? props.event.offsetGMT * 3600000 : 0;

  const getIncidenceTypeAsString = (i: apiIncidence) => {
    const iconsVersion = "v5.2";
    switch (i.type) {
      case 1:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/overspeeding.png`}
            alt="Overspeeding"
            height={35}
            width={35}
          />
        );
      case 2:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/reverse.png`}
            alt="Stop Zone"
            height={35}
            width={35}
          />
        );
      case 3:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/stopZone.png`}
            alt="Stop Zone"
            height={35}
            width={35}
          />
        );
      case 4:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/dnMinTime.png`}
            alt="DN Min Time"
            height={35}
            width={35}
          />
        );
      case 5:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/dnMaxTime.png`}
            alt="DN Max Time"
            height={35}
            width={35}
          />
        );
      case 6:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/dnInvalidExit.png`}
            alt="DN Invalid Exit"
            height={35}
            width={35}
          />
        );
      case 7:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/dnOverspeeding.png`}
            alt="DN Overspeeding"
            height={35}
            width={35}
          />
        );
      case 8:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/wpMissed.png`}
            alt="WP Missed"
            height={35}
            width={35}
          />
        );
      case 9:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/dzOverspeeding.png`}
            alt="DZ Overspeeding"
            height={35}
            width={35}
          />
        );
      case 10:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/forbidden.png`}
            alt="Forbidden Waypoint"
            height={35}
            width={35}
          />
        );
      case 11:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/stopped.png`}
            alt="Stopped"
            height={35}
            width={35}
          />
        );
      default:
        return (
          <Image
            src={`/maps/${iconsVersion}/alertIcons/unknown.png`}
            alt="Unknown"
            height={35}
            width={35}
          />
        );
    }
  };

  const getStageName = (id: number) => {
    if (stagesMap.has(id)) {
      return stagesMap.get(id)?.time_control;
    } else {
      return "(unknown, id: " + id.toString() + ")";
    }
  };

  const getDetailsByIncidenceType = (i: apiIncidence) => {
    switch (i.type) {
      case 1:
        return "OVERSPEEDING";
      case 2:
        return "REVERSE";
      case 3:
        const stopTime: number = (i.endTime - i.startTime) / 1000;
        return stopTime.toFixed(3) + " s. stopped at ";
      case 4:
        return "";
      case 5:
        return "";
      case 6:
        return "";
      case 7:
        return "";
      case 8:
        return "";
      case 9:
        return "";
      case 10:
        return "";
      case 11:
        return "Stopped at " + getStageName(i.stageId);
      default:
        return "";
    }
  };
  const getParticipantIdNumber = (id: BigInt) => {
    if (participantsById.has(id)) {
      const part = participantsById.get(id) as participantInfo;
      return part.is_officialcar ? part.number : "" + part.number;
    } else {
      return "--" + id.toString();
    }
  };

  return (
    <tr>
      <td>{getIncidenceTypeAsString(props.incidence)}</td>
      <td>{getParticipantIdNumber(BigInt(props.incidence.participantId))}</td>
      <td>
        {millisToCurrentDate(
          props.incidence.startTime,
          evOffsetMillis,
          "DATE_TIME"
        )}
      </td>
      <td>{getDetailsByIncidenceType(props.incidence)}</td>
      <td>
        <Button
          className="py-0 px-1"
          size="sm"
          variant="secondary"
          type="button"
          id={
            "incidence_" +
            props.incidence.startTime +
            "_" +
            props.incidence.stageId.toString() +
            "_" +
            props.incidence.participantId.toString()
          }
          onClick={onShowDetails}
        >
          {props.incidence.type === 11 ? "-" : "+"}
        </Button>
      </td>
    </tr>
  );
};

export default IncidenceComponent;
