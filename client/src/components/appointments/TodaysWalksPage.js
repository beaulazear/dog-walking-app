import React, { useContext } from "react";
import { TodaysAppointmentsContext } from "../../context/appointments";
import Container from "react-bootstrap/Container";
import Card from 'react-bootstrap/Card';
import TodaysAppointmentsCard from "./TodaysAppointmentsCard";

export default function TodaysWalksPage() {

    const { appointments, setAppointments } = useContext(TodaysAppointmentsContext)

    function getCurrentDateFormatted() {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;

        return formattedDate;
    }

    function updateAppointments(newApt) {
        const newAppointments = appointments.filter((apt) => apt.id !== newApt.id)
        // map over apt, look for one with same id, replace apt with new apt, mapping retains order.
        setAppointments([...newAppointments, newApt])
    }

    const todayFormatted = getCurrentDateFormatted();

    if (appointments?.length > 0) {
        return (
            <Container className="m-3">
                <h2 className="display-4">Today's Appointments</h2>
                <h4 className="display-6">Current Date: {todayFormatted}</h4>
                {appointments.map((apt) => (
                    <TodaysAppointmentsCard updateAppointments={updateAppointments} key={apt.id} apt={apt} />
                ))}
            </Container>
        )
    } else {
        return (
            <>
                <Container className="m-3">
                    <h2 className="display-4">Today's Appointments</h2>
                </Container>
                <Card className="m-2">
                    <Card.Header as="h5">No appointments scheduled for today</Card.Header>
                    <Card.Body>
                        <Card.Title>Visit the "Pets" page to create new appointments</Card.Title>
                        <Card.Text>
                            Appointments that are scheduled for today's date will be displayed here. You can complete them as you go, an invoice will be created for each completed walk.
                        </Card.Text>
                    </Card.Body>
                </Card>
            </>
        )
    }
}