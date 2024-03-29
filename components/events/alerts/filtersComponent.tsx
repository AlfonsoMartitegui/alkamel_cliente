import React from "react";
import Select from "react-select";
import CreatableSelect from "react-select/creatable";
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
import {
  eventInfo,
  participantInfo,
  PPTrackerDataServerIoClient,
} from "server/ppTrackerdataServerIoClient";
import {
  AlertFilter,
  IncidencesFilter,
  FlagsFilter,
  SoSAndMechanicalFilter,
  StagesFilter,
} from "../alertsResume";
import { set } from "date-fns";
import { stage } from "@prisma/client";
//import { access } from "fs";

interface participantOptions {
  value: string;
  label: string;
}

interface FiltersProps {
  onFiltersChange: (filters: AlertFilter) => void;
  onHide: () => void;
  filters: AlertFilter;
  sosAndMechanicalFilter: SoSAndMechanicalFilter;
  onSosAndMechanicalFilterChange: (filters: SoSAndMechanicalFilter) => void;
  incidencesFilters: IncidencesFilter;
  onIncidenceFiltersChange: (filters: IncidencesFilter) => void;
  flagsFilter: FlagsFilter;
  onFlagsFilterChange: (filters: FlagsFilter) => void;
  showMessages: boolean;
  onMessagesFilterChange: (showMessages: boolean) => void;
  participants: participantInfo[];
  setParticipantFilter: (participant: string) => void;
  participantFilter: string;
  setOfficialCarFilter: (officialCar: string) => void;
  officialCarFilter: string;
  stagesFilter: StagesFilter[];
  setStagesFilter: (stages: StagesFilter[]) => void;
  stages: stage[];
  startTimeFilter: string;
  setStartTimeFilter: (startTime: string) => void;
  endTimeFilter: string;
  setEndTimeFilter: (endTime: string) => void;
}

const FiltersComponent: React.FC<FiltersProps> = (props) => {
  const [showIncidences, setShowIncidences] = React.useState(
    Object.values(props.incidencesFilters).every((value) => value)
  );
  const [showFlags, setShowFlags] = React.useState(
    Object.values(props.flagsFilter).every((value) => value)
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
    const isAllTrue = Object.values(props.incidencesFilters).every(
      (value) => value
    );
    if (isAllTrue) {
      setShowIncidences(true);
    } else {
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
      showNoFlag: e.target.checked,
    };

    // Actualizar el estado de showIncidences
    setShowFlags(isChecked);

    // Actualizar el estado de los demás checkboxes
    props.onFlagsFilterChange(newFilters);
  };

  React.useEffect(() => {
    const isAllTrue = Object.values(props.flagsFilter).every((value) => value);
    if (isAllTrue) {
      setShowFlags(true);
    } else {
      setShowFlags(false);
    }
  }, [props.flagsFilter]);

  // const [startDate, setStartDate] = React.useState("");
  // const [endDate, setEndDate] = React.useState("");

  const listOfParticipants = props.participants
    .sort((a, b) => {
      if (Number(a.number) < Number(b.number)) return -1;
      else return 1;
    })
    .filter((p) => p.is_officialcar === false);

  // console.log("LISTA DE PARTICIPANTES NUMEROS", listOfParticipants);

  const participantsOptions = listOfParticipants.map((p) => {
    return {
      value: p.number,
      label: p.number,
    };
  });

  const listOfOfficialCars = props.participants.filter(
    (p) => p.is_officialcar === true
  );

  const officialCarOptions = listOfOfficialCars.map((p) => {
    return {
      value: p.number,
      label: p.number,
    };
  });

  const listOfStages = props.stages.sort((a, b) =>
    a.time_control.localeCompare(b.time_control)
  );

  const stagesOptions = listOfStages.map((s) => {
    return {
      value: s.id.toString(),
      label: s.time_control,
    };
  });

  const handleSetParticipantFilter = (newValue: any, actionMeta: any) => {
    console.group("Value Changed");
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();

    props.setParticipantFilter(newValue ? newValue.value : "");
  };

  const handleSetOfficialCarFilter = (newValue: any, actionMeta: any) => {
    console.group("Value Changed");
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();

    props.setOfficialCarFilter(newValue ? newValue.value : "");
  };

  const handleSetStagesFilter = (newValue: any, actionMeta: any) => {
    console.group("Value Changed");
    console.log(newValue);
    console.log(`action: ${actionMeta.action}`);
    console.groupEnd();

    props.setStagesFilter(newValue);
  
    // if (newValue) {
    //   const newValues = newValue.map((item: any) => item);
    //   props.setStagesFilter(newValues);
    // } else {
    //   props.setStagesFilter([]);
    // }
  };

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
                        checked={props.sosAndMechanicalFilter.showSOS}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onSosAndMechanicalFilterChange({
                            ...props.sosAndMechanicalFilter,
                            showSOS: e.target.checked,
                          });
                        }}
                      />
                    </Col>
                    <Col md={3}>
                      <Form.Check
                        type="checkbox"
                        label="Mechanical"
                        checked={props.sosAndMechanicalFilter.showMechanical}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onSosAndMechanicalFilterChange({
                            ...props.sosAndMechanicalFilter,
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
                  <Row>
                    <Col md={2}></Col>
                    <Col md={3}>
                      <Form.Check
                        type="checkbox"
                        label="Messages"
                        checked={props.showMessages}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onMessagesFilterChange(e.target.checked);
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
                    <Col md={2}>
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
                    <Col md={2}>
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
                    <Col md={2}>
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
                    <Col md={2}>
                      <Form.Check
                        type="checkbox"
                        label="No flag"
                        checked={props.flagsFilter.showNoFlag}
                        onChange={(e) => {
                          // Actualiza el estado de tus filtros aquí
                          props.onFlagsFilterChange({
                            ...props.flagsFilter,
                            showNoFlag: e.target.checked,
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
                      <CreatableSelect
                        isMulti
                        defaultValue={props.stagesFilter.filter((filter) => filter.value !== "")}
                        options={stagesOptions}
                        isClearable
                        isSearchable
                        onChange={handleSetStagesFilter}
                        styles={{
                          menu: (base) => ({
                            ...base,
                            backgroundColor: "white", // Color de fondo del menú
                            color: "black", // Color del texto del menú
                          }),
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
                      <CreatableSelect
                        defaultValue={{
                          value: props.participantFilter,
                          label:
                            props.participantFilter === ""
                              ? "participant number"
                              : props.participantFilter,
                        }}
                        options={participantsOptions}
                        isClearable
                        isSearchable
                        onChange={handleSetParticipantFilter}
                        styles={{
                          menu: (base) => ({
                            ...base,
                            backgroundColor: "white", // Color de fondo del menú
                            color: "black", // Color del texto del menú
                          }),
                        }}
                      />
                    </Col>
                    <Col md={2}>
                      <div className="fw-bold">Official cars:</div>
                    </Col>
                    <Col md={4}>
                      <CreatableSelect
                        defaultValue={{
                          value: props.officialCarFilter,
                          label:
                            props.officialCarFilter === ""
                              ? "official car number"
                              : props.officialCarFilter,
                        }}
                        options={officialCarOptions}
                        isClearable
                        isSearchable
                        onChange={handleSetOfficialCarFilter}
                        styles={{
                          menu: (base) => ({
                            ...base,
                            backgroundColor: "white", // Color de fondo del menú
                            color: "black", // Color del texto del menú
                          }),
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
                          value={props.startTimeFilter}
                          onChange={(e) => props.setStartTimeFilter(e.target.value)}
                        />
                      </div>
                    </Col>
                    <Col md={1}>
                      <Button
                        onClick={() => props.setStartTimeFilter("")}
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
                          value={props.endTimeFilter}
                          onChange={(e) => 
                            props.setEndTimeFilter(e.target.value)}
                        />
                      </div>
                    </Col>
                    <Col md={1}>
                      <Button
                        onClick={() => props.setEndTimeFilter("")}
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
        <Button variant="secondary" onClick={() => {
          props.onSosAndMechanicalFilterChange({
            showSOS: true,
            showMechanical: true,
          });
          props.onIncidenceFiltersChange({
            showOverspeedingIncidence: true,
            showReverseIncidense: true,
            showStopZoneIncidence: true,
            showdnMinTimeIncidence: true,
            showdnMaxTimeIncidence: true,
            showdnInvalidExitIncidence: true,
            showdnOverspeedingIncidence: true,
            showWaypointMissedIncidence: true,
            showdzOverspeedingIncidence: true,
            showForbiddenWaypointIncidence: true,
            showStoppedIncidence: true,
            showOthersIncidence: true,
          });
          props.onFlagsFilterChange({
            showBlueFlag: true,
            showRedFlag: true,
            showYellowFlag: true,
            showNoFlag: true,
          });
          props.onMessagesFilterChange(true);
          props.setStagesFilter([]);
          props.setParticipantFilter("");
          props.setOfficialCarFilter("");
          props.setStartTimeFilter("");
          props.setEndTimeFilter("");
        }}>
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
