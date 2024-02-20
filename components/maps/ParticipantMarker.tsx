import React from "react";

interface ParticipantMarkerProps extends google.maps.MarkerOptions {
  participantId?: number;
  onParticipantClick?: (participantId: number) => void;
}

const ParticipantMarker: React.FC<ParticipantMarkerProps> = (options) => {
  const [marker, setMarker] = React.useState<google.maps.Marker>();
  const [participantId, setParticipantId] = React.useState<number | undefined>(
    undefined
  );

  React.useEffect(() => {
    if (!marker) {
      let myMarker = new google.maps.Marker();
      setMarker(myMarker);
    }

    return () => {
      if (marker) {
        //console.log("DELETING MARKER=?=?===");
        marker.setMap(null);
      }
    };
  }, [marker]);

  React.useEffect(() => {
    if (marker) {
      if (participantId === undefined) {
        setParticipantId(options.participantId);
        //console.log("ADDING LISTENER TO ", options.participantId);
        marker.addListener("click", () => {
          if (options.participantId !== undefined) {
            if (options.onParticipantClick !== undefined) {
              options.onParticipantClick(options.participantId);
            }
          }
        });
      }
      marker.setOptions(options);
    }
  }, [marker, options, participantId]);

  return null;
};

export default ParticipantMarker;
