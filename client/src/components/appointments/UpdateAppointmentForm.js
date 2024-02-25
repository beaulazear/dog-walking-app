import React, { useState, useContext } from "react";
import { UserContext } from "../../context/user";
import { PetsAppointmentsContext } from "../../context/petsAppointments";
import { TodaysAppointmentsContext } from "../../context/todaysAppointments";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

export default function UpdateAppointmentForm({ apt, changeUpdateFormView }) {
    const { user } = useContext(UserContext);
    const { setPetsAppointments, petsAppointments } = useContext(PetsAppointmentsContext)
    const { setTodaysAppointments, todaysAppointments } = useContext(TodaysAppointmentsContext)

    const [startTime, setStartTime] = useState(apt.start_time);
    const [endTime, setEndTime] = useState(apt.end_time);
    const [duration, setDuration] = useState(apt.duration);
    const [errors, setErrors] = useState([]);

    function handleUpdateAppointmentRequest(e) {
        e.preventDefault();
        fetch(`/appointments/${apt.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
                start_time: startTime,
                end_time: endTime,
                duration: duration,
            })
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((updatedApt) => {
                        const newPetAppointments = petsAppointments.filter((apt) => apt.id !== updatedApt.id)
                        const newTodaysAppointments = todaysAppointments.map((apt) => {
                            if (apt.id === updatedApt.id) {
                                return updatedApt
                            } else {
                                return apt
                            }
                        })
                        setPetsAppointments([updatedApt, ...newPetAppointments])
                        setTodaysAppointments(newTodaysAppointments)
                        changeUpdateFormView()
                        alert('Appointment successfully updated!')
                    })
                } else {
                    response.json().then((errorData) => setErrors(errorData.errors))
                }
            })
    }

    return (
        <Container>
            <Form className="text-bg-light p-3" onSubmit={handleUpdateAppointmentRequest}>
                <h1 className="display-6">Update Appointment</h1>
                <Form.Group className="mb-3" controlId="formBasicStartTime">
                    <Form.Label>Start Time</Form.Label>
                    <Form.Control onChange={(e) => setStartTime(e.target.value)} value={startTime} type="time" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicEndTime">
                    <Form.Label>End Time</Form.Label>
                    <Form.Control onChange={(e) => setEndTime(e.target.value)} value={endTime} type="time" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicDuration">
                    <Form.Label>Walk Duration</Form.Label>
                    <Form.Select value={duration} onChange={(e) => setDuration(e.target.value)} type="date">
                        <option>Open this select menu</option>
                        <option value="30">30 Minutes</option>
                        <option value="45">45 Minutes</option>
                        <option value="60">60 Minutes</option>
                    </Form.Select>
                </Form.Group>
                {errors?.length > 0 && (
                    <ul>
                        {errors.map((error, index) => (
                            <Alert key={index} variant={'danger'}>
                                {error}
                            </Alert>
                        ))}
                    </ul>
                )}
                <Button variant="primary" type="submit">
                    Update
                </Button>
            </Form>
        </Container>
    )
}
