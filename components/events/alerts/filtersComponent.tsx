import React from "react";
import Select from "react-select";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Button,
  Modal,
  Container,
  Table,
  Form,
  Row,
  Col,
} from "react-bootstrap";
import { AlertFilter, IncidencesFilter, FlagsFilter } from "../alertsResume";
import { set } from "date-fns";
//import { access } from "fs";

interface FiltersProps {
  onFiltersChange: (filters: AlertFilter) => void;
  onHide: () => void;
  filters: AlertFilter;
  incidencesFilters: IncidencesFilter;
  onIncidenceFiltersChange: (filters: IncidencesFilter) => void;
  flagsFilter: FlagsFilter;
  onFlagsFilterChange: (filters: FlagsFilter) => void;
}

const FiltersComponent: React.FC<FiltersProps> = (props) => {
  const [showIncidences, setShowIncidences] = React.useState(
    Object.values(props.incidencesFilters).every(value => value)
  );
  const [showFlags, setShowFlags] = React.useState(
    Object.values(props.flagsFilter).every(value => value)
  );

  const handleIncidencesCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = e.target.checked;

    // Actualizar el estado del checkbox correspondiente
    const newFilters = {
      showOverspeedingIncidence: e.target.checked,
      showReverseIncidense: e.target.checked,
      showStopZoneIncidence: e.target.checked,
      showdnMinTimeIncidence: e.target.checked,
      showdnMaxTimeIncidence: e.target.checked,
      showdnInvalidExitIncidence: e.target.checked,
      showdnOverspeedingIncidence: e.target.checked,
      showWaypointMissedIncidence: e.target.checked,
      showdzOverspeedingIncidence: e.target.checked,
      showForbiddenWaypointIncidence: e.target.checked,
      showStoppedIncidence: e.target.checked,
      showOthersIncidence: e.target.checked,
    };

    // Actualizar el estado de showIncidences
    setShowIncidences(isChecked);

    // Actualizar el estado de los demás checkboxes
    props.onIncidenceFiltersChange(newFilters);
  };

  React.useEffect(() => {
    const isAllTrue = Object.values(props.incidencesFilters).every(value => value);
    if (isAllTrue) {
      setShowIncidences(true);
    }
    else {
      setShowIncidences(false);
    }
  }, [props.incidencesFilters]);

  const handleFlagsCheckboxChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const isChecked = e.target.checked;

    // Actualizar el estado del checkbox correspondiente
    const newFilters = {
      showBlueFlag: e.target.checked,
      showRedFlag: e.target.checked,
      showYellowFlag: e.target.checked,
    };

    // Actualizar el estado de showIncidences
    setShowFlags(isChecked);

    // Actualizar el estado de los demás checkboxes
    props.onFlagsFilterChange(newFilters);
  };

  React.useEffect(() => {
    const isAllTrue = Object.values(props.flagsFilter).every(value => value);
    if (isAllTrue) {
      setShowFlags(true);
    }
    else {
      setShowFlags(false);
    }
  }, [props.flagsFilter]);

  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");

  return (
    <Modal show={true} onHide={props.onHide} dialogClassName="sosDetailsModal">
      <Modal.Header
        className="bg-dark text-light border border-light"
        closeButton
      >
        <Modal.Title>ALERT FILTERS</Modal.Title>
      </Modal.Header>
      <Modal.Body className="bg-dark text-light border border-light">
        <Container>
          <Table responsive variant="dark" className="m-0 p-0 overflow-hidden">
            <tbody>
              <tr>
                <td>
                  <Row>
                    <Col md={2}>
                      <div className="fw-bold">By Type:</div>
                    </Col>
                    <Col md={3}>
                      <Form.Check
                        type="checkbox"
                        label="SOS"
                        checked={props.filters.showSOS}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onFiltersChange({
                            ...props.filters,
                            showSOS: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Check
                        type="checkbox"
                        label="Mechanical"
                        checked={props.filters.showMechanical}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onFiltersChange({
                            ...props.filters,
                            showMechanical: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={2}>
                      {/* Esta columna está vacía y ocupa 2 espacios de 12 */}
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label="Incidences:"
                        checked={showIncidences}
                        onChange={handleIncidencesCheckboxChange}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>
                            Overspeeding
                          </span>
                        }
                        checked={
                          props.incidencesFilters.showOverspeedingIncidence
                        }
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showOverspeedingIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>Reverse</span>
                        }
                        checked={props.incidencesFilters.showReverseIncidense}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showReverseIncidense: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>Stop Zone</span>
                        }
                        checked={props.incidencesFilters.showStopZoneIncidence}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showStopZoneIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>
                            dn Min Time
                          </span>
                        }
                        checked={props.incidencesFilters.showdnMinTimeIncidence}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showdnMinTimeIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      {/* Esta columna está vacía y ocupa 4 espacios de 12 */}
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>
                            dn Max Time
                          </span>
                        }
                        checked={props.incidencesFilters.showdnMaxTimeIncidence}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showdnMaxTimeIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>
                            dn Invalid Exit
                          </span>
                        }
                        checked={
                          props.incidencesFilters.showdnInvalidExitIncidence
                        }
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showdnInvalidExitIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>
                            dn Overspeeding
                          </span>
                        }
                        checked={
                          props.incidencesFilters.showdnOverspeedingIncidence
                        }
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showdnOverspeedingIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>
                            Waypoint Missed
                          </span>
                        }
                        checked={
                          props.incidencesFilters.showWaypointMissedIncidence
                        }
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showWaypointMissedIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                  </Row>
                  <Row>
                    <Col md={4}>
                      {/* Esta columna está vacía y ocupa 4 espacios de 12 */}
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>
                            dz Overspeeding
                          </span>
                        }
                        checked={
                          props.incidencesFilters.showdzOverspeedingIncidence
                        }
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showdzOverspeedingIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>
                            Forbidden Waypoint
                          </span>
                        }
                        checked={
                          props.incidencesFilters.showForbiddenWaypointIncidence
                        }
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showForbiddenWaypointIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>Stopped</span>
                        }
                        checked={props.incidencesFilters.showStoppedIncidence}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showStoppedIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label={
                          <span style={{ fontSize: "0.8rem" }}>Others</span>
                        }
                        checked={props.incidencesFilters.showOthersIncidence}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onIncidenceFiltersChange({
                            ...props.incidencesFilters,
                            showOthersIncidence: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                  </Row>
                </td>
              </tr>
              <tr>
                <td>
                  <Row>
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label="Flags:"
                        checked={showFlags}
                        onChange={handleFlagsCheckboxChange}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Check
                        type="checkbox"
                        label="Blue flag"
                        checked={props.flagsFilter.showBlueFlag}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onFlagsFilterChange({
                            ...props.flagsFilter,
                            showBlueFlag: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Check
                        type="checkbox"
                        label="Red flag"
                        checked={props.flagsFilter.showRedFlag}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onFlagsFilterChange({
                            ...props.flagsFilter,
                            showRedFlag: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Check
                        type="checkbox"
                        label="Yellow flag"
                        checked={props.flagsFilter.showYellowFlag}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onFlagsFilterChange({
                            ...props.flagsFilter,
                            showYellowFlag: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                  </Row>
                </td>
              </tr>
              <tr>
                <td>
                  <Row>
                    <Col md={2}>
                      <div className="fw-bold">Stages:</div>
                    </Col>
                    <Col md={4}>
                      <Select
                        id="stages"
                        name="stages"
                        value=""
                        options={[]}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          // e.g., props.onFiltersChange({ ...props.filters, sos: e.target.checked });
                        }}
                      />
                    </Col>
                  </Row>
                </td>
              </tr>
              <tr>
                <td>
                  <Row>
                    <Col md={2}>
                      <div className="fw-bold">Participants:</div>
                    </Col>
                    <Col md={4}>
                      <Select
                        id="stages"
                        name="stages"
                        value=""
                        options={[]}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          // e.g., props.onFiltersChange({ ...props.filters, sos: e.target.checked });
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <div className="fw-bold">Official cars:</div>
                    </Col>
                    <Col md={4}>
                      <Select
                        id="stages"
                        name="stages"
                        value=""
                        options={[]}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          // e.g., props.onFiltersChange({ ...props.filters, sos: e.target.checked });
                        }}
                      />
                    </Col>
                  </Row>
                </td>
              </tr>
              <tr>
                <td>
                  <Row>
                    <Col md={2}>
                      <div className="fw-bold">Between:</div>
                    </Col>
                    <Col md={3}>
                      <div className="w-100">
                        <Form.Control
                          type="datetime-local"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                    </Col>
                    <Col md={1}>
                      <Button
                        onClick={() => setStartDate("")}
                        size="sm"
                        variant="primary"
                        type="button"
                      >
                        Clear
                      </Button>
                    </Col>
                    <Col md={1}>
                      <div className="fw-bold">and:</div>
                    </Col>
                    <Col md={3}>
                      <div className="w-100">
                        <Form.Control
                          type="datetime-local"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                    </Col>
                    <Col md={1}>
                      <Button
                        onClick={() => setEndDate("")}
                        size="sm"
                        variant="primary"
                        type="button"
                      >
                        Clear
                      </Button>
                    </Col>
                  </Row>
                </td>
              </tr>
            </tbody>
          </Table>
        </Container>
      </Modal.Body>
      <Modal.Footer className="bg-dark text-light border border-light">
        <Button variant="secondary" onClick={() => {}}>
          Clear Filters
        </Button>
        <Button variant="secondary" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FiltersComponent;
