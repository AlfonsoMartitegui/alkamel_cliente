import React, { Fragment } from "react";
import { createCustomEqual } from "fast-equals";
import { pathDetails } from "components/events/Replay/participantReplayDetails";
import { pathDetailsToShowInTheReplay } from "pages/events/[eventSlug]/replay";

const mapStyle = [
  {
    elementType: "geometry",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    elementType: "labels.icon",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#212121",
      },
    ],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "administrative.country",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#9e9e9e",
      },
    ],
  },
  {
    featureType: "administrative.land_parcel",
    stylers: [
      {
        visibility: "off",
      },
    ],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#bdbdbd",
      },
    ],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [
      {
        color: "#181818",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.stroke",
    stylers: [
      {
        color: "#1b1b1b",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "geometry.fill",
    stylers: [
      {
        color: "#2c2c2c",
      },
    ],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#8a8a8a",
      },
    ],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [
      {
        color: "#373737",
      },
    ],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [
      {
        color: "#3c3c3c",
      },
    ],
  },
  {
    featureType: "road.highway.controlled_access",
    elementType: "geometry",
    stylers: [
      {
        color: "#4e4e4e",
      },
    ],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#616161",
      },
    ],
  },
  {
    featureType: "transit",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#757575",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [
      {
        color: "#000000",
      },
    ],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [
      {
        color: "#3d3d3d",
      },
    ],
  },
];
`
`;
const deepCompareEqualsForMaps = createCustomEqual(
  (deepEqual) => (a: any, b: any) => {
    // if (
    //   isLatLngLiteral(a) ||
    //   a instanceof google.maps.LatLng ||
    //   isLatLngLiteral(b) ||
    //   b instanceof google.maps.LatLng
    // ) {
    return new google.maps.LatLng(a).equals(new google.maps.LatLng(b));
    //}

    // TODO extend to other types

    // use fast-equals for other objects
    return deepEqual(a, b);
  }
);

function useDeepCompareMemoize(value: any) {
  const ref = React.useRef();

  if (!deepCompareEqualsForMaps(value, ref.current)) {
    ref.current = value;
  }

  return ref.current;
}

function useDeepCompareEffectForMaps(
  callback: React.EffectCallback,
  dependencies: any[]
) {
  React.useEffect(callback, dependencies.map(useDeepCompareMemoize));
}

interface MapProps extends google.maps.MapOptions {
  style: { [key: string]: string };
  onClick?: (e: google.maps.MapMouseEvent) => void;
  onIdle?: (map: google.maps.Map) => void;
  zoomChanged?: (map: google.maps.Map) => void;
  centerChanged?: (map: google.maps.Map) => void;
  dragStart?: () => void;
  replayPathDetails: pathDetailsToShowInTheReplay;
  kmlTrack?: google.maps.KmlLayer;
  centerTo: google.maps.LatLngLiteral | null;
}

const ReplayMap: React.FC<MapProps> = ({
  onClick,
  onIdle,
  zoomChanged,
  centerChanged,
  dragStart,
  replayPathDetails,
  centerTo,
  children,
  style,
  kmlTrack,
  ...options
}) => {
  const myMapStyle = new google.maps.StyledMapType(mapStyle, {
    name: "MyStyle",
  });

  //console.log("MAP REPAINT????");
  // [START maps_react_map_component_add_map_hooks]
  const ref = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<google.maps.Map>();
  const [pathCircles, setPathCircles] = React.useState<google.maps.Circle[]>(
    []
  );

  React.useEffect(() => {
    //console.log("<<<<<< CENTER CHANGED????");
    if (centerTo !== null && map !== undefined) {
      map.setCenter(centerTo);
    }
  }, [map, centerTo]);

  React.useEffect(() => {
    console.log("<<<<<< updating circles????");
    if (map !== undefined) {
      for (var c of pathCircles) {
        c.setMap(null);
      }
      let newPathCircles: google.maps.Circle[] = [];

      for (var pos of replayPathDetails.replayData) {
        if (replayPathDetails.pathDetails.has(pos.participant)) {
          const details = replayPathDetails.pathDetails.get(
            pos.participant
          ) as pathDetails;
          if (details.showPath) {
            const c = new google.maps.Circle({
              strokeColor: details.color,
              strokeOpacity: 0.9,
              strokeWeight: 3,
              fillColor: "#ffffff",
              fillOpacity: 0.35,
              map,
              center: new google.maps.LatLng(pos.lat, pos.lon),
              radius: 10,
            });
            newPathCircles.push(c);
          }
        }
      }

      setPathCircles(newPathCircles);
    }
  }, [map, replayPathDetails.lastTimeChange]);

  React.useEffect(() => {
    if (ref.current && !map) {
      console.log(">>>>>>> CREATING NEW MAP!!!!!!!!");
      let newMap = new window.google.maps.Map(ref.current, {});
      if (onClick) {
        newMap.addListener("click", onClick);
      }

      if (onIdle) {
        newMap.addListener("idle", () => onIdle(newMap));
      }

      if (zoomChanged) {
        newMap.addListener("zoom_changed", () => zoomChanged(newMap));
      }
      if (centerChanged) {
        newMap.addListener("dragend", () => centerChanged(newMap));
      }

      if (dragStart) {
        newMap.addListener("dragstart", () => {
          //console.log("DRAG START!!");
          dragStart();
        });
      }

      newMap.addListener("maptypeid_changed", () => {
        console.log("NEW MAP TYPE: ", newMap.getMapTypeId());
        if (newMap.getMapTypeId() === "roadmap") {
          newMap.setMapTypeId("styled_map");
        }
      });

      newMap.mapTypes.set("styled_map", myMapStyle);
      newMap.setMapTypeId("styled_map");

      setMap(newMap);
    }
  }, [ref, map, onClick, onIdle, zoomChanged, centerChanged, dragStart]);

  // [END maps_react_map_component_add_map_hooks]

  // [START maps_react_map_component_options_hook]
  // because React does not do deep comparisons, a custom hook is used
  // see discussion in https://github.com/googlemaps/js-samples/issues/946

  useDeepCompareEffectForMaps(() => {
    if (map) {
      map.setOptions(options);
    }
  }, [map, options]);
  // [END maps_react_map_component_options_hook]

  // [START maps_react_map_component_event_hooks]
  // React.useEffect(() => {
  //   if (map) {
  //     // console.log("ADDING LISTENERS ON MAIN MAP??? (1), eventName: ",eventName);

  //     // ["click", "idle"].forEach((eventName) =>
  //     //   google.maps.event.clearListeners(map, eventName)
  //     // );
  //   }
  // }, [map, centerChanged, zoomChanged]);

  // [END maps_react_map_component_event_hooks]

  React.useEffect(() => {
    if (kmlTrack) {
      if (map) {
        console.log("SETTING MAP....", new Date().toLocaleString());
        kmlTrack.setMap(map);
        // const viewport = kmlTrack.getDefaultViewport();
        // map.setCenter(viewport);
      }
    }
  }, [kmlTrack, map]);

  return (
    <Fragment>
      <div ref={ref} style={style} />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // set the map prop on the child component
          return React.cloneElement(child, { map });
        }
      })}
    </Fragment>
  );
};

export default ReplayMap;
