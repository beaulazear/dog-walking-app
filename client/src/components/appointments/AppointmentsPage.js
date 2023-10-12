import React, { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import TodaysAppointmentsCard from "./TodaysAppointmentsCard";

export default function AppointmentsPage() {

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

    console.log(appointments)

    function getCurrentDateFormatted() {
        const currentDate = new Date();
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
        const day = currentDate.getDate().toString().padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;

        return formattedDate;
    }

    const todayFormatted = getCurrentDateFormatted();

    if (appointments.length > 0) {
        return (
            <Container className="m-3">
                <h2 className="display-4">Today's Appointments</h2>
                <h4 className="display-6">Current Date: {todayFormatted}</h4>
                {appointments.map((apt) => (
                    <TodaysAppointmentsCard key={apt.id} apt={apt} />
                ))}
            </Container>
        )
    } else {
        return (
            <Container className="m-3">
                <h2 className="display-4">Today's Appointments</h2>
                <Container className="display-6">You currently have no appointments booked</Container>
            </Container>
        )
    }
}