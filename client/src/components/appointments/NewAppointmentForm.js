import React, { useState, useContext } from "react";
import { UserContext } from "../../context/user";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

export default function NewAppointmentForm({ pet, updateAppointmentsNew }) {

    const { user } = useContext(UserContext)

    const [recurring, setRecurring] = useState(false)
    const [appointmentDate, setAppointmentDate] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [duration, setDuration] = useState("")
    const [monday, setMonday] = useState(false)
    const [tuesday, setTuesday] = useState(false)
    const [wednesday, setWednesday] = useState(false)
    const [thursday, setThursday] = useState(false)
    const [friday, setFriday] = useState(false)
    const [saturday, setSaturday] = useState(false)
    const [sunday, setSunday] = useState(false)

    const [errors, setErrors] = useState([])

    console.log(startTime)

    function handleNewAppointmentRequest(e) {

        e.preventDefault()
        fetch("/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
                pet_id: pet.id,
                recurring: recurring,
                start_time: startTime,
                appointment_date: appointmentDate,
                end_time: endTime,
                duration: duration,
                monday: monday,
                tuesday: tuesday,
                wednesday: wednesday,
                thursday: thursday,
                friday: friday,
                saturday: saturday,
                sunday: sunday,
            })
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((newApt) => {
                        updateAppointmentsNew(newApt)
                    })
                } else {
                    response.json().then((errorData) => setErrors(errorData.errors))
                }
            })
    }

    return (
        <Container>
            <h1 className="display-6">New Appointment for {pet.name}</h1>
            <Form className="text-bg-light p-3" onSubmit={handleNewAppointmentRequest}>
                <Form.Group className="mb-3" controlId="formBasicappointmentDate">
                    <Form.Label>Start Time</Form.Label>
                    <Form.Control onChange={(e) => setStartTime(e.target.value)} value={startTime} type="time" />
                    <Form.Text className="text-muted">
                        Enter the start time (beginning of pick up window)
                    </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>End Time</Form.Label>
                    <Form.Control type="time" onChange={(e) => setEndTime(e.target.value)} aria-label="Default select example" />
                    <Form.Text className="text-muted">
                        Enter the end time (end of pick up window)
                    </Form.Text>
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
                <Form.Group className="mb-3">
                    <Form.Label>Is this a recurring walk?</Form.Label>
                    <Form.Select onChange={(e) => setRecurring(!recurring)} aria-label="Default select example">
                        <option value={false}>No</option>
                        <option value={true}>Yes</option>
                    </Form.Select>
                </Form.Group>
                {recurring === false && (
                    <Form.Group className="mb-3">
                        <Form.Label>Appointment Date</Form.Label>
                        <Form.Control onChange={(e) => setAppointmentDate(e.target.value)} value={appointmentDate} type="date" />
                    </Form.Group>
                )}
                {recurring === true && (
                    <>
                        <h3>Please select which days of the week you would like this walk to be repeated.</h3>
                        <Form.Group className="mb-3">
                            <Form.Label>Monday</Form.Label>
                            <Form.Select onChange={(e) => setMonday(!monday)} aria-label="Default select example">
                                <option value={false}>No</option>
                                <option value={true}>Yes</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Tuesday</Form.Label>
                            <Form.Select onChange={(e) => setTuesday(!tuesday)} aria-label="Default select example">
                                <option value={false}>No</option>
                                <option value={true}>Yes</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Wednesday</Form.Label>
                            <Form.Select onChange={(e) => setWednesday(!wednesday)} aria-label="Default select example">
                                <option value={false}>No</option>
                                <option value={true}>Yes</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Thursday</Form.Label>
                            <Form.Select onChange={(e) => setThursday(!thursday)} aria-label="Default select example">
                                <option value={false}>No</option>
                                <option value={true}>Yes</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Friday</Form.Label>
                            <Form.Select onChange={(e) => setFriday(!friday)} aria-label="Default select example">
                                <option value={false}>No</option>
                                <option value={true}>Yes</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Saturday</Form.Label>
                            <Form.Select onChange={(e) => setSaturday(!saturday)} aria-label="Default select example">
                                <option value={false}>No</option>
                                <option value={true}>Yes</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Sunday</Form.Label>
                            <Form.Select onChange={(e) => setSunday(!sunday)} aria-label="Default select example">
                                <option value={false}>No</option>
                                <option value={true}>Yes</option>
                            </Form.Select>
                        </Form.Group>
                    </>
                )}
                {errors?.length > 0 && (
                    <ul>
                        {errors.map((error) => (
                            <Alert key={error} variant={'danger'}>
                                {error}
                            </Alert>))}
                    </ul>
                )}
                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
        </Container>
    )
}