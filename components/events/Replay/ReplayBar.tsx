import React, { useCallback } from "react";
import { Button, Row, Col, Form } from "react-bootstrap";
import {
  eventInfo,
  participantInfo,
  rallyInfo,
} from "../../../server/ppTrackerdataServerIoClient";
import {
  apiPositionRecord,
  positionRecordsRequestQuery,
} from "server/shared/socket_io_packets";
import {
  millisToCurrentDate,
  millisToInputDateTime,
} from "server/shared/utils";
import { useRef } from "react";
import { useState } from "react";
import { useEffect } from "react";

interface ReplayBarProps {
  ev: eventInfo | undefined;
  rally: rallyInfo | undefined;
  participants: participantInfo[];
  replayData: apiPositionRecord[];
  replayQuery: positionRecordsRequestQuery | undefined;
  onParticipantClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onNewQueryClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onReplayTime: (time: number) => void;
}

const ReplayEntryBar: React.FC<ReplayBarProps> = (props) => {
  const timeRangeValue = useRef<HTMLInputElement>(null);
  const moveToRef = useRef<HTMLInputElement>(null);
  const [replayTimeStr, setReplayTimeStr] = useState<string>("");
  const [replayTime, setReplayTime] = useState<number>(0);
  const [replayIndex, setReplayIndex] = useState<number>(0);
  const [replayDataSorted, setReplayDataSorted] = useState<apiPositionRecord[]>(
    []
  );
  const [replayStart, setReplayStart] = useState<number>(0);
  const [replayEnd, setReplayEnd] = useState<number>(0);
  const [replayIsRunning, setReplayIsRunning] = useState<boolean>(false);

  const evOffsetMillis = props.ev ? props.ev.offsetGMT * 3600000 : 0;
  const participantsById = new Map<number, participantInfo>();
  for (var p of props.participants) {
    participantsById.set(Number(p.id), p);
  }

  const setReplayTo = useCallback(
    (rTime: number) => {
      // Replay to: ", rTime);
      setReplayTimeStr(
        rTime > 0
          ? millisToCurrentDate(rTime, evOffsetMillis, "TIME", " ")
          : "-"
      );
      setReplayTime(rTime);
    },
    [evOffsetMillis]
  );

  const onRangeMove = useCallback(
    (offset: number) => {
      let rTime = replayTime + offset;
      let newReplayIndex = replayIndex;

      if (offset === 1) {
        if (newReplayIndex < replayDataSorted.length - 1) {
          newReplayIndex++;
        }
        rTime = getPacketValidTime(replayDataSorted[newReplayIndex]);
      } else if (offset === -1) {
        if (newReplayIndex > 0) {
          newReplayIndex--;
        }
        rTime = getPacketValidTime(replayDataSorted[newReplayIndex]);
      } else if (props.replayQuery) {
        if (rTime < replayStart) {
          rTime = replayStart;
          newReplayIndex = 0;
        } else if (rTime > replayEnd) {
          rTime = replayEnd;
          newReplayIndex = replayDataSorted.length - 1;
        } else {
          if (offset > 0) {
            //Locate new index going forward
            let currentTimeIndex = getPacketValidTime(
              replayDataSorted[newReplayIndex]
            );
            while (
              currentTimeIndex < rTime &&
              newReplayIndex <= replayDataSorted.length - 1
            ) {
              newReplayIndex++;
              currentTimeIndex = getPacketValidTime(
                replayDataSorted[newReplayIndex]
              );
            }
          } else {
            //Locate new index going backwards
            let currentTimeIndex = getPacketValidTime(
              replayDataSorted[newReplayIndex]
            );
            while (currentTimeIndex >= rTime && newReplayIndex > 0) {
              newReplayIndex--;
              currentTimeIndex = getPacketValidTime(
                replayDataSorted[newReplayIndex]
              );
            }
          }
        }
      }

      if (rTime !== replayTime) {
        //console.log("Moving: ", offset, rTime, replayTime);
        props.onReplayTime(rTime);
        setReplayTo(rTime);
      }
      //console.log(replayIndex, newReplayIndex);
      if (newReplayIndex !== replayIndex) {
        //console.log("Moving replay index to:", newReplayIndex);
        setReplayIndex(newReplayIndex);
      }
      // if (newReplayIndex === replayDataSorted.length - 1) {
      //   setReplayIsRunning(false);
      // }
      if (rTime >= replayEnd) {
        setReplayIsRunning(false);
      }
    },
    [
      props.replayQuery,
      props.onReplayTime,
      replayDataSorted,
      replayEnd,
      replayStart,
      replayIndex,
      replayTime,
      setReplayTo,
    ]
  );

  useEffect(() => {
    const replaySpeed = 250;
    const interval = setInterval(() => {
      if (replayIsRunning) {
        onRangeMove(replaySpeed);
        //console.log("Executing move...");
      } else {
        // console.log("Replay not running yet???");
      }
    }, replaySpeed);
    return () => {
      clearInterval(interval);
    };
  }, [replayIsRunning, onRangeMove]);

  useEffect(() => {
    const sortedData = props.replayData.sort((a, b) => {
      const aTime = a.time > 0 ? a.time : a.published_at;
      const bTime = b.time > 0 ? b.time : b.published_at;
      return aTime > bTime ? 1 : aTime < bTime ? -1 : 0;
    });
    //console.log(sortedData.length, " ELEMENT IN SORTED DTA ARRAY...");
    if (sortedData.length > 0) {
      setReplayDataSorted(sortedData);
      setReplayIndex(0);
      const startTime =
        sortedData[0].time > 0
          ? sortedData[0].time
          : sortedData[0].published_at;
      //console.log("start Time: ", startTime);
      setReplayStart(startTime);
      const endTime =
        sortedData[sortedData.length - 1].time > 0
          ? sortedData[sortedData.length - 1].time
          : sortedData[sortedData.length - 1].published_at;
      //console.log("end Time: ", endTime);
      setReplayEnd(endTime);
      setReplayTimeStr(
        startTime > 0
          ? millisToCurrentDate(
              startTime,
              props.ev ? props.ev.offsetGMT * 3600000 : 0,
              "TIME",
              " "
            )
          : "-"
      );
      setReplayTime(startTime);
    } else {
      setReplayDataSorted([]);
      setReplayIndex(0);
      setReplayStart(0);
      setReplayEnd(1);
      setReplayTimeStr("-");
      setReplayTime(0);
    }
  }, [props.replayQuery, props.replayData, props.ev]);

  const rangeChangedFinished = () => {
    if (timeRangeValue.current) {
      setReplayTime(Number(timeRangeValue.current.value));
    } else {
      setReplayTime(props.replayQuery ? props.replayQuery.startTime : 0);
    }
    //console.log("CHANGE FINISHED!!!");
    onRangeMove(0);
  };
  const rangeChanged = () => {
    //console.log("rangeChanged!!", timeRangeValue.current);
    if (timeRangeValue.current) {
      const newTime = Number(timeRangeValue.current.value);
      //console.log("from rangeChanged:", newTime, newTime - replayTime);
      onRangeMove(newTime - replayTime);
    } else {
      setReplayTo(0);
    }
  };

  const getParticipantFromId = (p: number) => {
    if (participantsById.has(p)) {
      return participantsById.get(p);
    } else {
      return undefined;
    }
  };

  const onForward1Step = () => {
    onRangeMove(1);
  };
  const onForward1Second = () => {
    onRangeMove(1000);
  };
  const onForward1Minute = () => {
    onRangeMove(60000);
  };

  const onBackward1Step = () => {
    onRangeMove(-1);
  };
  const onBackward1Second = () => {
    onRangeMove(-1000);
  };
  const onBackward1Minute = () => {
    onRangeMove(-60000);
  };

  const getPacketValidTime = (pos: apiPositionRecord) => {
    return pos.time > 0 ? pos.time : pos.published_at;
  };

  const onStop = () => {
    setReplayIsRunning(false);
  };

  const onPlay = () => {
    setReplayIsRunning(true);
  };

  const onMoveTo = () => {
    if (moveToRef.current) {
      const d = new Date(moveToRef.current.value);
      onRangeMove(d.getTime() - replayTime);
    }
  };

  return (
    <Form>
      <Row>
        <Col className="col-auto ml-4 mt-1" style={{ width: "150px" }}>
          <h5 className="text-white-50 fw-bold pt-0">QUERY:</h5>
        </Col>
        <Col className="col-auto mt-0 ps-2 fs-6">
          <span className="fw-bold fs-5 ms-0">from</span>
          <span className="fw-bold fs-5 ps-2 text-warning">
            {props.replayQuery
              ? millisToCurrentDate(
                  props.replayQuery.startTime,
                  evOffsetMillis,
                  "DATE_TIME",
                  " "
                ).substring(0, 19)
              : "-"}
          </span>
          <span className="fw-bold fs-5 ps-2 me-0">to</span>
          <span className="fw-bold fs-5 ps-2 text-warning">
            {props.replayQuery
              ? millisToCurrentDate(
                  props.replayQuery.endTime,
                  evOffsetMillis,
                  "DATE_TIME",
                  " "
                ).substring(0, 19)
              : "-"}
          </span>
          <span className="fw-bold fs-5 ps-3 text-primary">
            ({props.replayData.length} records found)
          </span>
          <Button
            key="newQuery"
            id="newQueryId"
            variant={"primary"}
            className="fw-bold py-0 px-1 mt-0 mb-1 ms-4 me-0"
            onClick={props.onNewQueryClick}
          >
            NEW QUERY
          </Button>
        </Col>
      </Row>
      <Row>
        <Col className="col-auto mt-0" style={{ width: "150px" }}>
          <h5 className="text-white-50 fw-bold">VEHICLES:</h5>
        </Col>
        <Col className="p-0 mx-1 mt-0 text-start">
          {props.replayQuery?.participants
            .sort((a, b) => {
              if (Number(a) < Number(b)) return -1;
              else return 1;
            })
            .map((p) => (
              <Button
                key={getParticipantFromId(p)?.number}
                id={getParticipantFromId(p)?.number}
                variant={"primary"}
                className="fw-bold py-0 px-1 mt-0 mb-1 ms-1 me-0"
                onClick={props.onParticipantClick}
              >
                {getParticipantFromId(p)?.number}
              </Button>
            ))}
        </Col>
      </Row>
      <Row>
        <Col className="col-auto ml-4 mt-1" style={{ width: "150px" }}>
          <h5 className="text-white-50 fw-bold pt-1">REPLAY:</h5>
        </Col>
        <Col className="p-0 ms-1 mt-1 text-start col-auto">
          <Button
            variant={"light"}
            className="fw-bold btn-sm mx-0 px-2"
            onClick={onBackward1Minute}
            title="1 minut backwards"
          >
            {"<<<"}
          </Button>
        </Col>
        <Col className="p-0 ms-1 mt-1 text-start col-auto">
          <Button
            variant={"light"}
            className="fw-bold btn-sm mx-0 px-2"
            onClick={onBackward1Second}
            title="1 second backwards"
          >
            {"<<"}
          </Button>
        </Col>
        <Col className="p-0 ms-1 mt-1 text-start col-auto">
          <Button
            variant={"light"}
            className="fw-bold btn-sm mx-0 px-2"
            onClick={onBackward1Step}
            title="1 packet backwards"
          >
            {"<"}
          </Button>
        </Col>
        <Col className="col p-0 ms-1 mt-1 text-start">
          <Form.Control
            className="sm fw-bold secondary"
            type="range"
            min={replayStart}
            max={replayEnd}
            onChange={rangeChanged}
            onMouseUp={rangeChangedFinished}
            onTouchEnd={rangeChangedFinished}
            onKeyUp={rangeChangedFinished}
            value={replayTime}
            ref={timeRangeValue}
          />
        </Col>
        <Col className="col-auto p-0 ms-1 mt-1">
          <Button
            variant={replayIsRunning ? "secondary" : "primary"}
            className="fw-bold btn-sm mx-0 px-2"
            onClick={onPlay}
          >
            PLAY
          </Button>
        </Col>
        <Col className="col-auto p-0 ms-1 mt-1">
          <Button
            variant={replayIsRunning ? "primary" : "secondary"}
            className="fw-bold btn-sm mx-0 px-2"
            onClick={onStop}
          >
            STOP
          </Button>
        </Col>
        <Col className="col-auto p-0 ms-1 mt-1">
          <Button
            variant={"light"}
            className="fw-bold btn-sm mx-0 px-2"
            onClick={onForward1Step}
            title="1 paquet fordwards"
          >
            {">"}
          </Button>
        </Col>
        <Col className="col-auto p-0 ms-1 mt-1">
          <Button
            variant={"light"}
            className="fw-bold btn-sm mx-0 px-2"
            onClick={onForward1Second}
            title="1 second fordwards"
          >
            {">>"}
          </Button>
        </Col>
        <Col className="col-auto p-0 ms-1 mt-1">
          <Button
            variant={"light"}
            className="fw-bold btn-sm ms-0 me-3 px-2"
            onClick={onForward1Minute}
            title="1 minut fordwards"
          >
            {">>>"}
          </Button>
        </Col>
      </Row>
      <Row>
        <Col className="col-auto mt-1" style={{ width: "150px" }}></Col>
        <Col className="col-auto p-0 ms-2 mt-1">
          <span className="text-light fs-6">Replay Time: </span>
          <span className="text-warning fw-bold fs-6">{replayTimeStr}</span>
        </Col>
        <Col className="col-auto p-0 ms-5 mt-1">
          <span className="text-light fs-6">Move To: </span>
        </Col>
        <Col className="col-auto p-0 ms-2 mb-2 mt-1">
          <Form.Control
            className="sm fw-bold py-0 px-1"
            type="datetime-local"
            style={{ width: "200px" }}
            ref={moveToRef}
            defaultValue={millisToInputDateTime(
              props.replayQuery ? props.replayQuery.startTime : 0,
              evOffsetMillis
            )}
          />
        </Col>
        <Col className="col-auto p-0 m-0">
          <Button
            variant={"light"}
            className="fw-bold btn-sm py-0 mt-1 ms-2"
            onClick={onMoveTo}
          >
            MOVE
          </Button>
        </Col>
      </Row>
      <Row>
        <hr className="p-0 m-0" />
      </Row>
    </Form>
  );
};

export default ReplayEntryBar;
