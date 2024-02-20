import React from "react";
import { apiBlueFlag } from "server/shared/socket_io_packets";
import { eventInfo, participantInfo } from "server/ppTrackerdataServerIoClient";
import { Button, Row } from "react-bootstrap";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";
import Image from "next/image";
import BlueFlagDetailsComponent from "./blueFlagDetailsComponent";

interface blueFlagProps {
  event: eventInfo | undefined;
  blueFlag: apiBlueFlag;
  participants: participantInfo[];
  stages: stage[];
  onDetails: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const BlueFlagComponent: React.FC<blueFlagProps> = (props) => {
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
  const iconsVersion = "v4";

  const getParticipantIdNumber = (id: BigInt) => {
    if (participantsById.has(id)) {
      const part = participantsById.get(id) as participantInfo;
      return part.is_officialcar ? part.number : "" + part.number;
    } else {
      return "--" + id.toString();
    }
  };
  const getStageString = (id: number) => {
    if (stagesMap.has(id)) {
      const st = stagesMap.get(id) as stage;
      return st.name;
    } else return "-";
  };

  return (
    <tr>
      <td>
        <Image
          src={`/maps/${iconsVersion}/alertIcons/blueFlag.png`}
          alt="Overspeeding"
          height={35}
          width={35}
        />
      </td>
      <td>
        <Row>
          {getParticipantIdNumber(BigInt(props.blueFlag.participant_requester))}{" "}
          vs
        </Row>
        <Row>
          {getParticipantIdNumber(BigInt(props.blueFlag.participant_target))}
        </Row>
      </td>
      <td>
        {millisToCurrentDate(
          props.blueFlag.blue_flag_request_time,
          evOffsetMillis,
          "DATE_TIME"
        )}
      </td>
      <td>{getStageString(props.blueFlag.stage_id)}</td>
      <td>
        <Button
          className="py-0 px-1"
          size="sm"
          variant="secondary"
          type="button"
          id={
            "blueFlag_" +
            props.blueFlag.blue_flag_request_time +
            "_" +
            props.blueFlag.participant_requester.toString() +
            "_" +
            props.blueFlag.participant_target.toString()
          }
          onClick={onShowDetails}
        >
          +
        </Button>
      </td>
      {showDetails && (
        <BlueFlagDetailsComponent
          ev={props.event}
          participants={props.participants}
          blueFlag={props.blueFlag}
          onHide={onHide}
          stages={props.stages}
        />
      )}
    </tr>
  );
};

export default BlueFlagComponent;
