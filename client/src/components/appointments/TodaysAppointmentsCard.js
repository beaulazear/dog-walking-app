import React, { useContext } from "react";
import { PetsContext } from "../../context/pets";
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from "react-bootstrap/Button";

export default function TodaysAppointmentsCard({ apt, updateAppointments }) {

    const { pets, setPets } = useContext(PetsContext)

    const dayjs = require('dayjs')

    function getHourAndMinutes(timestampString) {
        const date = new Date(timestampString);
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hour}:${minutes}`;
    }

    const startTime = getHourAndMinutes(apt.start_time);
    const endTime = getHourAndMinutes(apt.end_time);

    function replaceDateWithToday(timestamp) {
        const today = dayjs(); // Get current date and time using day.js
        const timePart = timestamp.substr(11); // Extract time part (HH:mm:ss.sssZ)
        const todayDatePart = today.format('YYYY-MM-DD'); // Get today's date in yyyy-mm-dd format

        return `${todayDatePart}T${timePart}`;
    }

    const photoStyles = {
        width: '100px',
        height: '100px',
        margin: '15px',
        borderRadius: '50%',
        objectFit: 'cover',
    }

    function handleNewInvoice() {

        let compensation = 0

        if (apt.duration === 30) {
            compensation = 22
        } else if (apt.duration === 45) {
            compensation = 27
        } else {
            compensation = 33
        }

        const newDate = replaceDateWithToday(apt.start_time)

        fetch('/invoices', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                pet_id: apt.pet.id,
                appointment_id: apt.id,
                date_completed: newDate,
                paid: false,
                compensation: compensation
            })
        })
            .then((response) => response.json())
            .then((newInvoice) => {
                const newApt = { ...apt, invoices: [...apt.invoices, newInvoice] }
                const newPets = pets.map((pet) => {
                    if (pet.id === newInvoice.pet_id) {
                        pet.invoices = [...pet.invoices, newInvoice]
                        return pet
                    } else {
                        return pet
                    }
                })
                setPets(newPets)
                updateAppointments(newApt)
            })
    }

    let invoices = apt.invoices?.filter((invoice) => invoice.date_completed === replaceDateWithToday(apt.start_time))

    return (
        <>
            {invoices?.length > 0 && (
                <Card className="m-3" style={{ width: '90%', backgroundColor: '#6fd388' }}>
                    <Card.Body>
                        <img alt="Pet associated with appointment" style={photoStyles} src={apt.pet.profile_pic} />
                        <Card.Title>{apt.pet.name}, {apt.duration} minute walk between {startTime} & {endTime}.</Card.Title>
                        <Card.Text className='display-6'>Walk Completed</Card.Text>
                    </Card.Body>
                </Card>
            )}
            {invoices?.length < 1 && (
                <Card className="m-3">
                    <Card.Body>
                        <img alt="Pet associated with appointment" style={photoStyles} src={apt.pet.profile_pic} />
                        <Card.Title>{apt.pet.name}</Card.Title>
                        <Card.Text>
                            {apt.pet.supplies_location}
                        </Card.Text>
                        <Card.Text>
                            {apt.pet.behavorial_notes}
                        </Card.Text>
                    </Card.Body>
                    <ListGroup className="list-group-flush">
                        <ListGroup.Item><b>Earliest pick up time:</b> {startTime}</ListGroup.Item>
                        <ListGroup.Item><b>Latest pick up time:</b> {endTime}</ListGroup.Item>
                        <ListGroup.Item><b>Address:</b> {apt.pet.address}</ListGroup.Item>
                        <ListGroup.Item><b>Walk Duration:</b> {apt.duration} minutes</ListGroup.Item>
                    </ListGroup>
                    <Card.Body>
                        <Button onClick={handleNewInvoice}>Complete Walk</Button>
                    </Card.Body>
                </Card>
            )}
        </>
    )
}