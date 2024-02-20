import React from "react";
import { createCustomEqual } from "fast-equals";
import { apiPosition } from "server/shared/apiSharedTypes";

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
  kmlTrack?: google.maps.KmlLayer;
  positions: apiPosition[];
}

const MyMap: React.FC<MapProps> = ({
  onClick,
  onIdle,
  zoomChanged,
  centerChanged,
  positions,
  children,
  style,
  kmlTrack,
  ...options
}) => {
  const myMapStyle = new google.maps.StyledMapType(mapStyle, {
    name: "MyStyle",
  });

  // [START maps_react_map_component_add_map_hooks]
  const ref = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<google.maps.Map>();
  React.useEffect(() => {
    if (ref.current && !map) {
      setMap(new window.google.maps.Map(ref.current, {}));
    }
  }, [ref, map]);
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
  React.useEffect(() => {
    console.log("ADDING LISTENERS ON MAIN MAP??? (1)");
    if (map) {
      ["click", "idle"].forEach((eventName) =>
        google.maps.event.clearListeners(map, eventName)
      );

      if (onClick) {
        map.addListener("click", onClick);
      }

      if (onIdle) {
        map.addListener("idle", () => onIdle(map));
      }

      if (zoomChanged) {
        map.addListener("zoom_changed", () => zoomChanged(map));
      }

      if (centerChanged) {
        map.addListener("dragend", () => centerChanged(map));
      }
    }
  }, [map, onClick, onIdle]);

  // [END maps_react_map_component_event_hooks]

  map?.mapTypes.set("styled_map", myMapStyle);
  map?.setMapTypeId("styled_map");

  //   for (var pos of positions) {
  //     console.log("PAITING PARTICIAPNT...", pos.participantid);

  //     if (pos.lat > 0 && pos.lon > 0) {
  //       new google.maps.Circle({
  //         strokeColor: "#0000FF",
  //         strokeOpacity: 0.8,
  //         strokeWeight: 2,
  //         fillColor: "#0000",
  //         fillOpacity: 0.35,
  //         map,
  //         center: new google.maps.LatLng(pos.lat, pos.lon),
  //         radius: 30,
  //       });

  //       if (map) {
  //         map.setCenter({ lat: pos.lat, lng: pos.lon }); // or map.panTo(marker.getPosition())
  //       }
  //     }
  //   }

  // const polygon = [
  //   { lat: 42.8, lng: -6.3 },
  //   { lat: 42.8, lng: -5.6 },
  //   { lat: 42.4, lng: -5.6 },
  //   { lat: 42.4, lng: -6.3 },
  // ];
  /*
      const bermudaTriangle = new google.maps.Polygon({
        paths: polygon,
        strokeColor: "#000000",
        strokeOpacity: 0.1,
        strokeWeight: 2,
        fillColor: "#000000",
        fillOpacity: 0.1,
        zIndex: 1,
      });
      
      bermudaTriangle.setMap(map);
      */

  if (kmlTrack) {
    if (map) {
      //console.log("SETTING MAP....");
      kmlTrack.setMap(map);
    }
  }

  // const ctaLayer = new google.maps.KmlLayer({
  //   url: "https://pptrackerwww.s3.us-west-2.amazonaws.com/maps/tracks_2.kml",
  //   screenOverlays: true,
  //   map: map,
  //   zIndex: 2000,
  //   preserveViewport: true,
  //   clickable: false,
  // });

  //pptrackerwww.s3.us-west-2.amazonaws.com/maps/tracks_2.kml

  //const ctaLayer2 = new google.maps.KmlLayer({
  //  url: "https://googlearchive.github.io/js-v2-samples/ggeoxml/cta.kml",
  //  map: map,
  //});

  // [START maps_react_map_component_return]
  https: return (
    <>
      <div ref={ref} style={style} />
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // set the map prop on the child component
          return React.cloneElement(child, { map });
        }
      })}
    </>
  );
  // [END maps_react_map_component_return]
};

export default MyMap;
