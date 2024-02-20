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

interface sosAlertComponentProps {
  event: eventInfo | undefined;
  alert: apiSosAlertMerge;
  participants: participantInfo[];
  stages: stage[];
  onDetails: (e: React.MouseEvent<HTMLButtonElement>) => void;
  ppTrackerClient: PPTrackerDataServerIoClient;
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

    if (s.subtype > 0) {
      switch (s.subtype) {
        case 1:
          return (
            <Image
              src={`/maps/${iconsVersion}/alertIcons/sosFire.png`}
              alt="SOS Fire"
              height={35}
              width={35}
            />
          );
        case 2:
          return (
            <Image
              src={`/maps/${iconsVersion}/alertIcons/sosMedical.png`}
              alt="SOS Medical"
              height={35}
              width={35}
            />
          );
        case 3:
          return (
            <Image
              src={`/maps/${iconsVersion}/alertIcons/mechanicalBloqued.png`}
              alt="Mechanical Blocked"
              height={35}
              width={35}
            />
          );
        case 4:
          return (
            <Image
              src={`/maps/${iconsVersion}/alertIcons/mechanicalNotBlocked.png`}
              alt="Mechanical Not Blocked"
              height={35}
              width={35}
            />
          );
        default:
          return "SOS";
      }
    } else {
      return s.type == 0 ? (
        <Image
          src={`/maps/${iconsVersion}/alertIcons/sos.png`}
          alt="SOS"
          height={35}
          width={35}
        />
      ) : (
        <Image
          src={`/maps/${iconsVersion}/alertIcons/mechanical.png`}
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
