import React from "react";
import { flagAlert } from "server/shared/socket_io_packets";
import { eventInfo, participantInfo } from "server/ppTrackerdataServerIoClient";
import { Button } from "react-bootstrap";
import { stage } from "@prisma/client";
import { millisToCurrentDate } from "server/shared/utils";
import FlagDetailsComponent from "./flagAlertDetailsComponent";
import Image from "next/image";
import { icon } from "@fortawesome/fontawesome-svg-core";

interface AlertIcon {
  id: number;
  name: string;
  icon: string;
}

interface flagAlertProps {
  event: eventInfo | undefined;
  alert: flagAlert;
  participants: participantInfo[];
  stages: stage[];
  onDetails: (e: React.MouseEvent<HTMLButtonElement>) => void;
  alertIcons: AlertIcon[];
}

const FlagAlertComponent: React.FC<flagAlertProps> = (props) => {
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

  const getFlagTypeAsString = (s: flagAlert) => {
    const iconsVersion = "v4";
    let iconText = "";
    switch (s.flag_type) {
      case 0:
        iconText = "No Flag";
        const icon = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl = icon
          ? icon.icon
          : `/maps/${iconsVersion}/alertIcons/noFlag.png`;
        return <Image src={iconUrl} alt="No Flag" height={35} width={35} />;
      case 1:
        iconText = "Red Flag";
        const icon2 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl2 = icon2
          ? icon2.icon
          : `/maps/${iconsVersion}/alertIcons/redFlag.png`;
        return (
          <Image
            src={iconUrl2}
            alt="Red Flag"
            height={35}
            width={35}
          />
        );
      case 2:
        iconText = "Yellow Flag";
        const icon3 = props.alertIcons.find((icon) => icon.name === iconText);
        const iconUrl3 = icon3
          ? icon3.icon
          : `/maps/${iconsVersion}/alertIcons/yellowFlag.png`;
        return (
          <Image
            src={iconUrl3}
            alt="Yellow Flag"
            height={35}
            width={35}
          />
        );
    }
  };

  return (
    <tr>
      <td>{getFlagTypeAsString(props.alert)}</td>
      <td></td>
      <td>
        {millisToCurrentDate(
          props.alert.flag_time,
          evOffsetMillis,
          "DATE_TIME"
        )}
      </td>
      <td>
        {stagesMap.has(props.alert.stage_id)
          ? stagesMap.get(props.alert.stage_id)?.time_control
          : "-"}
      </td>
      <td>
        <Button
          className="py-0 px-1"
          size="sm"
          variant="secondary"
          type="button"
          id={
            "flagDetails_" +
            props.alert.flag_time +
            "_" +
            props.alert.stage_id.toString()
          }
          onClick={onShowDetails}
        >
          +
        </Button>
      </td>
      {showDetails && (
        <FlagDetailsComponent
          ev={props.event}
          participants={props.participants}
          alert={props.alert}
          onHide={onHide}
          stages={props.stages}
          alertIcons={props.alertIcons}
        />
      )}
    </tr>
  );
};

export default FlagAlertComponent;
