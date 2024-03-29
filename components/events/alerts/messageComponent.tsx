import React from "react";
import { apiMessage } from "server/shared/socket_io_packets";
import { eventInfo, participantInfo } from "server/ppTrackerdataServerIoClient";
import { Button } from "react-bootstrap";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";
import MessageDetailsComponent from "./messageDetailsComponent";
import Image from "next/image";

interface AlertIcon {
  id: number;
  name: string;
  icon: string;
}

interface messageAlertProps {
  event: eventInfo | undefined;
  message: apiMessage;
  participants: participantInfo[];
  stages: stage[];
  alertIcons: AlertIcon[];
  onParticipantClick: (participantNumber: string) => void;
}

const MessageComponent: React.FC<messageAlertProps> = (props) => {
  const [showDetails, setShowDetails] = React.useState<boolean>(false);
  const onShowDetails = () => {
    setShowDetails(!showDetails);
  };
  const onHide = () => {
    setShowDetails(false);
  };

  const participantsById = new Map<BigInt, participantInfo>();
  const stagesMap = new Map<number, stage>();

  for (var p of props.participants) {
    participantsById.set(p.id, p);
  }
  for (var s of props.stages) {
    stagesMap.set(Number(s.id), s);
  }

  const evOffsetMillis = props.event ? props.event.offsetGMT * 3600000 : 0;

  const getParticipantIdNumber = (id: BigInt) => {
    if (participantsById.has(id)) {
      const part = participantsById.get(id) as participantInfo;
      return part.is_officialcar ? part.number : "" + part.number;
    } else {
      return "" + id.toString();
    }
  };

  const iconsVersion = "v4";
  const iconText = "Message";
  const icon = props.alertIcons.find((icon) => icon.name === iconText);
  const iconUrl = icon
    ? icon.icon
    : `/maps/${iconsVersion}/alertIcons/message.png`;

  return (
    <tr>
      <td className="m-0 px-3 pt-2- pb-0">
        <Image src={iconUrl} alt="Message" height={35} width={35} />
      </td>
      <td>
        <Button
          onClick={() =>
            props.onParticipantClick(
              getParticipantIdNumber(BigInt(props.message.participant))
            )
          }
          className={
            "py-0 px-1 link-info link-offset-2 link-underline-opacity-25 link-underline-opacity-100-hover"
          }
          size="sm"
          type="button"
          variant="link"
          // style={{ border: "none", background: "none", color: "white", width: "100%", height: "100%"}}
        >
          {getParticipantIdNumber(BigInt(props.message.participant))}
        </Button>
      </td>
      <td>
        {millisToCurrentDate(
          props.message.message_time,
          evOffsetMillis,
          "DATE_TIME"
        )}
      </td>
      <td>{props.message.message_text}</td>
      <td>
        <Button
          className="py-0 px-1"
          size="sm"
          variant="secondary"
          type="button"
          id={
            "incidence_" +
            props.message.message_time.toString() +
            "_" +
            props.message.participant.toString()
          }
          onClick={onShowDetails}
        >
          +
        </Button>
      </td>
      {showDetails && (
        <MessageDetailsComponent
          ev={props.event}
          participants={props.participants}
          alert={props.message}
          onHide={onHide}
          stages={props.stages}
          alertIcons={props.alertIcons}
        />
      )}
    </tr>
  );
};

export default MessageComponent;
