import React from "react";
import { apiMessage } from "server/shared/socket_io_packets";
import { eventInfo, participantInfo } from "server/ppTrackerdataServerIoClient";
import { Button } from "react-bootstrap";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";
import MessageDetailsComponent from "./messageDetailsComponent";
import Image from "next/image";

interface messageAlertProps {
  event: eventInfo | undefined;
  message: apiMessage;
  participants: participantInfo[];
  stages: stage[];
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

  return (
    <tr>
      <td>
        <Image
          src={`/maps/${iconsVersion}/alertIcons/message.png`}
          alt="Message"
          height={35}
          width={35}
        />
      </td>
      <td>{getParticipantIdNumber(BigInt(props.message.participant))}</td>
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
        />
      )}
    </tr>
  );
};

export default MessageComponent;
