import React, { useContext } from "react";
import { PetsContext } from "../../context/pets";
import { UserContext } from "../../context/user";
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from "react-bootstrap/Button";

export default function TodaysAppointmentsCard({ apt, updateAppointments }) {

    const { pets, setPets } = useContext(PetsContext)
    const { user } = useContext(UserContext)

    function getHourAndMinutes(timestampString) {
        const [, timePart] = timestampString.split("T"); // Splitting the string to extract the time part
        const [time,] = timePart.split(/[.+-]/); // Splitting the time part to separate time and offset
        const [hours, minutes] = time.split(":"); // Splitting the time to extract hours and minutes
        return `${hours}:${minutes}`;
    }

    const startTime = getHourAndMinutes(apt.start_time);
    const endTime = getHourAndMinutes(apt.end_time);

    function replaceDateWithToday(timestamp) {
        const now = new Date();
        const timePart = timestamp.substr(11, 8);

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const timezoneOffset = (now.getTimezoneOffset() / 60) * -1;
        const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
        const timezoneOffsetHours = String(Math.abs(timezoneOffset)).padStart(2, '0');

        const todayDatePart = `${year}-${month}-${day}`;
        const timezonePart = `${timezoneSign}${timezoneOffsetHours}00`;

        return `${todayDatePart} ${timePart} ${timezonePart}`;
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

        if (user.thirty !== null) {
            if (apt.duration === 30) {
                compensation = user.thirty
            } else if (apt.duration === 45) {
                compensation = user.fourty
            } else {
                compensation = user.sixty
            }
        } else {
            if (apt.duration === 30) {
                compensation = 22
            } else if (apt.duration === 45) {
                compensation = 27
            } else {
                compensation = 33
            }
        }

        if (apt.solo && user.solo_rate) {
            compensation += user.solo_rate
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

    function hasInvoiceForToday(appointmentStartTime, invoices) {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const todayAdjusted = new Date(today.getTime() - (offset * 60 * 1000));
        const todayString = todayAdjusted.toISOString().slice(0, 10);

        const matchingInvoice = invoices.find(invoice => {
            const invoiceDate = invoice.date_completed.slice(0, 22);
            return invoiceDate === todayString + appointmentStartTime.slice(10, 22);
        });

        return !!matchingInvoice;
    }


    let invoices = hasInvoiceForToday(apt.start_time, apt.invoices)

    return (
        <>
            {invoices && (
                <Card className="m-3" style={{ backgroundColor: '#6fd388' }}>
                    <Card.Body>
                        <img alt="Pet associated with appointment" style={photoStyles} src={apt.pet.profile_pic} />
                        <Card.Title>{apt.pet.name}, {apt.duration} minute walk between {startTime} & {endTime}.</Card.Title>
                        <Card.Text className='display-6'>Walk Completed</Card.Text>
                    </Card.Body>
                </Card>
            )}
            {!invoices && (
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
                        <ListGroup.Item><b>Walk Type:</b> {apt.solo ? 'Solo Walk' : 'Group Walk'}</ListGroup.Item>
                    </ListGroup>
                    <Card.Body>
                        <Button onClick={handleNewInvoice}>Complete Walk</Button>
                    </Card.Body>
                </Card>
            )}
        </>
    )
}