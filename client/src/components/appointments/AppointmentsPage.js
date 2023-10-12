import React, { useState, useEffect } from "react";
// import { UserContext } from "../../context/user";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from 'react-bootstrap/Col';
import Button from "react-bootstrap/Button"

export default function AppointmentsPage() {

    // const { user } = useContext(UserContext)

    const [appointments, setAppointments] = useState([])
    useEffect(() => {
        fetch("/appointments").then((response) => {
            if (response.ok) {
                response.json().then((apts) => {
                    setAppointments(apts)
                });
            }
        });
    }, []);

    if (appointments.length > 0) {
        return (
            <Container className="m-3">
                <Row>
                    <Col>
                        <h2 className="display-4">Appointments</h2>
                    </Col>
                    <Col>
                        <Button className="m-2" variant="primary">New Appointment</Button>
                    </Col>
                </Row>
            </Container>
        )
    } else {
        return (
            <Container className="m-3">
                <Row>
                    <Col>
                        <h2 className="display-4">Appointments</h2>
                    </Col>
                    <Col>
                        <Button className="m-2" variant="primary">New Appointment</Button>
                    </Col>
                </Row>
                <Container className="display-6">You currently have no appointments booked</Container>
            </Container>
        )
    }
}