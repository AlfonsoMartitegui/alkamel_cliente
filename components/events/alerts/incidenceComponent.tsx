import React from "react";
import { apiIncidence } from "server/shared/socket_io_packets";
import { eventInfo, participantInfo } from "server/ppTrackerdataServerIoClient";
import { Button } from "react-bootstrap";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";
import Image from "next/image";

interface AlertIcon {
  id: number;
  name: string;
  icon: string;
}

interface incidenceAlertProps {
  event: eventInfo | undefined;
  incidence: apiIncidence;
  participants: participantInfo[];
  stages: stage[];
  onDetails: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onCenterMapOnParticipant?: (participantId: number) => void;
  alertIcons: AlertIcon[];
  onParticipantClick: (participantNumber: string) => void;
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
    let iconText = "";

    switch (i.type) {
      case 1:
        iconText = "Overspeeding";
        const icon = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl = icon
          ? icon.icon
          : `/maps/${iconsVersion}/alertIcons/overspeeding.png`;
        return (
          <Image src={iconUrl} alt="Overspeeding" height={35} width={35} />
        );
      case 2:
        iconText = "Reverse";
        const icon2 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl2 = icon2
          ? icon2.icon
          : `/maps/${iconsVersion}/alertIcons/reverse.png`;
        return <Image src={iconUrl2} alt="Reverse" height={35} width={35} />;
      case 3:
        iconText = "Stop Zone";
        const icon3 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl3 = icon3
          ? icon3.icon
          : `/maps/${iconsVersion}/alertIcons/stopZone.png`;
        return <Image src={iconUrl3} alt="Stop Zone" height={35} width={35} />;
      case 4:
        iconText = "DN Min Time";
        const icon4 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl4 = icon4
          ? icon4.icon
          : `/maps/${iconsVersion}/alertIcons/dnMinTime.png`;
        return (
          <Image src={iconUrl4} alt="DN Min Time" height={35} width={35} />
        );
      case 5:
        iconText = "DN Max Time";
        const icon5 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl5 = icon5
          ? icon5.icon
          : `/maps/${iconsVersion}/alertIcons/dnMaxTime.png`;
        return (
          <Image src={iconUrl5} alt="DN Max Time" height={35} width={35} />
        );
      case 6:
        iconText = "DN Invalid Exit";
        const icon6 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl6 = icon6
          ? icon6.icon
          : `/maps/${iconsVersion}/alertIcons/dnInvalidExit.png`;
        return (
          <Image src={iconUrl6} alt="DN Invalid Exit" height={35} width={35} />
        );
      case 7:
        iconText = "DN Overspeeding";
        const icon7 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl7 = icon7
          ? icon7.icon
          : `/maps/${iconsVersion}/alertIcons/dnOverspeeding.png`;
        return (
          <Image src={iconUrl7} alt="DN Overspeeding" height={35} width={35} />
        );
      case 8:
        iconText = "WP Missed";
        const icon8 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl8 = icon8
          ? icon8.icon
          : `/maps/${iconsVersion}/alertIcons/wpMissed.png`;
        return <Image src={iconUrl8} alt="WP Missed" height={35} width={35} />;
      case 9:
        iconText = "DZ Overspeeding";
        const icon9 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl9 = icon9
          ? icon9.icon
          : `/maps/${iconsVersion}/alertIcons/dzOverspeeding.png`;
        return (
          <Image src={iconUrl9} alt="DZ Overspeeding" height={35} width={35} />
        );
      case 10:
        iconText = "Forbidden Waypoint";
        const icon10 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl10 = icon10
          ? icon10.icon
          : `/maps/${iconsVersion}/alertIcons/forbidden.png`;
        return (
          <Image
            src={iconUrl10}
            alt="Forbidden Waypoint"
            height={35}
            width={35}
          />
        );
      case 11:
        iconText = "Stopped";
        const icon11 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl11 = icon11
          ? icon11.icon
          : `/maps/${iconsVersion}/alertIcons/stopped.png`;
        return <Image src={iconUrl11} alt="Stopped" height={35} width={35} />;
      default:
        iconText = "Unknown";
        const icon12 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl12 = icon12
          ? icon12.icon
          : `/maps/${iconsVersion}/alertIcons/unknown.png`;
        return <Image src={iconUrl12} alt="Unknown" height={35} width={35} />;
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
      <td className="m-0 px-3 pt-2- pb-0">
        {getIncidenceTypeAsString(props.incidence)}
      </td>
      <td>
        <Button
          onClick={() =>
            props.onParticipantClick(
              getParticipantIdNumber(BigInt(props.incidence.participantId))
            )
          }
          className={
            "py-0 px-1 link-info link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
          }
          size="sm"
          type="button"
          variant="link"
        >
          {getParticipantIdNumber(BigInt(props.incidence.participantId))}
        </Button>
      </td>
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
