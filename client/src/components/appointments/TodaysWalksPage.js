import React, { useContext } from "react";
import { AppointmentsContext } from "../../context/appointments";
import Card from 'react-bootstrap/Card';
import TodaysAppointmentsCard from "./TodaysAppointmentsCard";

export default function TodaysWalksPage() {

    const { todaysAppointments, setTodaysAppointments } = useContext(AppointmentsContext)

    const dayjs = require('dayjs');

    function getCurrentDateFormatted() {
        const currentDate = dayjs();
        const formattedDate = currentDate.format('MMMM DD, YYYY');
    
        return formattedDate;
    }
    

    function updateAppointments(newApt) {
        const newAppointments = todaysAppointments.map((apt) => {
            if (apt.id === newApt.id) {
                return newApt
            } else {
                return apt
            }
        })
        setTodaysAppointments(newAppointments)
    }

    const todayFormatted = getCurrentDateFormatted();

    if (todaysAppointments?.length > 0) {
        return (
            <div style={{ marginBottom: '35px', textAlign: 'center', paddingRight: '15px', paddingLeft: '15px' }}>
                <h2 className="display-4 m-3">Today's Appointments</h2>
                <h4 className="display-6 m-2">{todayFormatted}</h4>
                {todaysAppointments.map((apt) => (
                    <TodaysAppointmentsCard updateAppointments={updateAppointments} key={apt.id} apt={apt} />
                ))}
            </div>
        )
    } else {
        return (
            <div style={{ marginBottom: '45px' }}>
                <h2 className="display-4 m-4">Today's Appointments</h2>
                <h4 className="display-6 m-4">{todayFormatted}</h4>
                <Card className="m-2">
                    <Card.Header as="h5">No appointments scheduled for today</Card.Header>
                    <Card.Body>
                        <Card.Title>Visit the "Pets" page to create new appointments</Card.Title>
                        <Card.Text>
                            Appointments that are scheduled for today's date will be displayed here. You can complete them as you go, an invoice will be created for each completed walk.
                        </Card.Text>
                    </Card.Body>
                </Card>
            </div>
        )
    }
}