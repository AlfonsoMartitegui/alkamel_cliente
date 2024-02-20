import { Fragment, useEffect } from "react";
import React from "react";
import { Container, Button, Row, Col } from "react-bootstrap";
import { logLine } from "server/shared/apiSharedTypes";

interface LogProps {
  logLines: logLine[];
  logLinesLength?: number;
  onHide: () => void;
  background?: string;
  size?: string;
  margin?: string;
}

// const getBackgroundForLogType = (type: string) => {
//   if (type === "ERROR") {
//     return "bg-danger";
//   } else if (type === "SUCCESS") {
//     return "bg-success";
//   } else if (type === "WARNING" || type === "DEBUG") {
//     return "bg-warning";
//   } else {
//     return "bg-info";
//   }
// };

const getTextColorForLogType = (type: string) => {
  if (type === "ERROR") {
    return "text-danger";
  } else if (type === "SUCCESS") {
    return "text-success";
  } else if (type === "WARNING" || type === "DEBUG") {
    return "text-warning";
  } else {
    return "text-info";
  }
};

const LogViewer: React.FC<LogProps> = (props) => {
  const sizeStyle = { maxHeight: props.size ? props.size : "300px" };

  useEffect(() => {
    console.log("TOTAL LOG LINES: ", props.logLinesLength);
  }, [props.logLinesLength]);

  return (
    <Fragment>
      <Container
        fluid
        className={
          "bg-dark-50 text-white border " +
          (props.margin ? props.margin : "my-1") +
          " overflow-auto"
        }
        style={sizeStyle}
      >
        <Row className="my-2 pt-2 fw-bold">
          <Col>Server Response:</Col>
        </Row>
        {props.logLines
          .sort((a, b) => {
            if (a.idx < b.idx) return -1;
            else return 1;
          })
          .map((line) => (
            <Row
              key={Number(line.idx)}
              className={
                "p-0 mx-1 px-2 py-0 my-0 text-start " +
                getTextColorForLogType(line.type)
              }
            >
              <Col className="col-auto py-0 my-0">
                {new Date(line.time).toLocaleTimeString()}
              </Col>
              <Col
                className="col py-0 my-0"
                dangerouslySetInnerHTML={{ __html: line.message }}
              ></Col>
            </Row>
          ))}
        <Row>
          <Col className="text-end p-3">
            <Button variant="secondary" type="button" onClick={props.onHide}>
              HIDE LOG
            </Button>
          </Col>
        </Row>
      </Container>
      <Row></Row>
    </Fragment>
  );
};

export default LogViewer;
