import React, { useEffect } from "react";
import { apiSosAlertMerge } from "server/shared/socket_io_packets";
import {
  eventInfo,
  participantInfo,
  PPTrackerDataServerIoClient,
} from "server/ppTrackerdataServerIoClient";
import { Button } from "react-bootstrap";
import SosDetailsComponent from "./sosAlertDetailsComponent";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";
import Image from "next/image";
import { icon } from "@fortawesome/fontawesome-svg-core";

interface AlertIcon {
  id: number;
  name: string;
  icon: string;
}

interface sosAlertComponentProps {
  event: eventInfo | undefined;
  alert: apiSosAlertMerge;
  participants: participantInfo[];
  stages: stage[];
  onDetails: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ppTrackerClient: PPTrackerDataServerIoClient;
  alertIcons: AlertIcon[];
}

const SosAlertComponent: React.FC<sosAlertComponentProps> = (props) => {
  const ev = props.event;
  const evOffsetMillis = ev ? ev.offsetGMT * 3600000 : 0;
  const [showDetails, setShowDetails] = React.useState<boolean>(false);
  const onShowDetails = () => {
    setShowDetails(!showDetails);
  };
  const onHide = () => {
    setShowDetails(false);
  };
  const participantsById = new Map<BigInt, participantInfo>();
  const getParticipantIdNumber = (id: BigInt) => {
    if (participantsById.has(id)) {
      const part = participantsById.get(id) as participantInfo;
      return part.is_officialcar ? part.number : "" + part.number;
    } else {
      return "" + id.toString();
    }
  };
  for (var p of props.participants) {
    participantsById.set(p.id, p);
  }
  const getSosTypeAsString = (s: apiSosAlertMerge) => {
    const iconsVersion = "v4";
    let iconText = "";

    if (s.subtype > 0) {
      switch (s.subtype) {
        case 1:
          iconText = "SOS Fire";
          const icon = props.alertIcons.find((icon) => icon.name === iconText);
          const iconUrl = icon
            ? icon.icon
            : `/maps/${iconsVersion}/alertIcons/sosFire.png`;
          return <Image src={iconUrl} alt="SOS Fire" height={35} width={35} />;
        case 2:
          iconText = "SOS Medical";
          const icon2 = props.alertIcons.find((icon) => icon.name === iconText);
          const iconUrl2 = icon2
            ? icon2.icon
            : `/maps/${iconsVersion}/alertIcons/sosMedical.png`;
          return (
            <Image src={iconUrl2} alt="SOS Medical" height={35} width={35} />
          );
        case 3:
          iconText = "Mechanical Blocked";
          const icon3 = props.alertIcons.find((icon) => icon.name === iconText);
          const iconUrl3 = icon3
            ? icon3.icon
            : `/maps/${iconsVersion}/alertIcons/mechanicalBloqued.png`;
          return (
            <Image
              src={iconUrl3}
              alt="Mechanical Blocked"
              height={35}
              width={35}
            />
          );
        case 4:
          iconText = "Mechanical Not Blocked";
          const icon4 = props.alertIcons.find((icon) => icon.name === iconText);
          const iconUrl4 = icon4
            ? icon4.icon
            : `/maps/${iconsVersion}/alertIcons/mechanicalNotBlocked.png`;
          return (
            <Image
              src={iconUrl4}
              alt="Mechanical Not Blocked"
              height={35}
              width={35}
            />
          );
        default:
          return "SOS";
      }
    } else {
      iconText = s.type == 0 ? "SOS" : "Mechanical";
      const icon = props.alertIcons.find((icon) => icon.name === iconText);
      const iconUrl = icon
        ? icon.icon
        : s.type == 0
        ? `/maps/${iconsVersion}/alertIcons/sos.png`
        : `/maps/${iconsVersion}/alertIcons/mechanical.png`;
      return s.type == 0 ? (
        <Image
          src={iconUrl}
          alt="SOS"
          height={35}
          width={35}
        />
      ) : (
        <Image
          src={iconUrl}
          alt="Mechanical"
          height={35}
          width={35}
        />
      );
    }
  };

  useEffect(() => {
    if (props.alert.ack_time === 0) {
      // setShowDetails(true);
    }
  }, [props.alert]);

  // 1: Fire, 2:Medical, 3: Blocked, 4:NotBlocked

  return (
    <tr>
      <td>{getSosTypeAsString(props.alert)}</td>
      <td>{getParticipantIdNumber(BigInt(props.alert.participant))}</td>
      <td>
        {millisToCurrentDate(props.alert.time, evOffsetMillis, "DATE_TIME")}
      </td>
      <td>
        At {props.alert.lat / 10000000}, {props.alert.lon / 10000000}
      </td>
      <td>
        <Button
          className="py-0 px-1"
          size="sm"
          variant="secondary"
          type="button"
          id={
            "sosDetails_" +
            props.alert.participant +
            "_" +
            props.alert.time.toString()
          }
          onClick={onShowDetails}
        >
          +
        </Button>
      </td>
      {showDetails && (
        <SosDetailsComponent
          ev={props.event}
          participants={props.participants}
          ppTrackerClient={props.ppTrackerClient}
          alert={props.alert}
          onHide={onHide}
          stages={props.stages}
        />
      )}
    </tr>
  );
};

export default SosAlertComponent;
