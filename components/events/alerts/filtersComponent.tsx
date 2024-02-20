import React from "react";
import { Button, Modal, Container, Table } from "react-bootstrap";
import { AlertFilter } from "../alertsResume";
//import { access } from "fs";

interface FiltersProps {
  onFiltersChange: (filters: AlertFilter) => void;
  onHide: () => void;
  filters: AlertFilter;
}

const FiltersComponent: React.FC<FiltersProps> = (props) => {
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
          <Table responsive variant="dark" className="m-0 p-0">
            <tbody>
              <tr>
                <td className="fw-bold">Show SOS:</td>
                <td></td>
              </tr>
              <tr>
                <td className="fw-bold">Show Incidences:</td>
                <td className="fw-bold"></td>
              </tr>
              <tr>
                <td className="fw-bold">Show Messages:</td>
                <td></td>
              </tr>
              <tr>
                <td className="fw-bold">Show Flags:</td>
                <td></td>
              </tr>
              <tr>
                <td className="fw-bold">Show Blue Flags:</td>
                <td></td>
              </tr>
            </tbody>
          </Table>
        </Container>
      </Modal.Body>
      <Modal.Footer className="bg-dark text-light border border-light">
        <Button variant="secondary" onClick={props.onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default FiltersComponent;
