import React, { useState, useContext } from "react";
import { UserContext } from "../../context/user";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

export default function NewAppointmentForm({ pet, updateAppointmentsNew }) {
    const { user } = useContext(UserContext);

    const todayDate = new Date().toISOString().split("T")[0];
    const [appointmentDate, setAppointmentDate] = useState(todayDate);

    const [recurring, setRecurring] = useState(false);
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [duration, setDuration] = useState("30");
    const [solo, setSolo] = useState(false);
    const [errors, setErrors] = useState([]);
    const [daysOfWeek, setDaysOfWeek] = useState({
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: false,
        sunday: false
    });

    function handleDayChange(day) {
        setDaysOfWeek((prevDays) => ({
            ...prevDays,
            [day]: !prevDays[day]
        }));
    }

    function handleNewAppointmentRequest(e) {
        e.preventDefault();

        // Use today's date for recurring appointments
        const selectedDate = recurring ? todayDate : appointmentDate;

        fetch("/appointments", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                user_id: user.id,
                pet_id: pet.id,
                recurring,
                start_time: startTime,
                end_time: endTime,
                duration,
                solo,
                appointment_date: selectedDate,
                ...daysOfWeek
            })
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((newApt) => {
                        updateAppointmentsNew(newApt);
                    });
                } else {
                    response.json().then((errorData) => setErrors(errorData.errors));
                }
            });
    }

    return (
        <Container>
            <Form className="text-bg-light p-3" onSubmit={handleNewAppointmentRequest}>
                <h1 className="display-6">{recurring ? "Recurring Appointment" : "One Time Appointment"}</h1>

                <Form.Group className="mb-3" controlId="formBasicStartTime">
                    <Form.Label>Earliest Pickup Time</Form.Label>
                    <Form.Control type="time" onChange={(e) => setStartTime(e.target.value)} value={startTime} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicEndTime">
                    <Form.Label>Latest Pickup Time</Form.Label>
                    <Form.Control type="time" onChange={(e) => setEndTime(e.target.value)} value={endTime} />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicDuration">
                    <Form.Label>Walk Duration</Form.Label>
                    <Form.Select value={duration} onChange={(e) => setDuration(e.target.value)}>
                        <option value="30">30 Minutes</option>
                        <option value="45">45 Minutes</option>
                        <option value="60">60 Minutes</option>
                    </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Is this a solo walk?</Form.Label>
                    <Form.Check type="checkbox" label="Yes" checked={solo} onChange={() => setSolo(!solo)} />
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Is this a recurring walk?</Form.Label>
                    <Form.Check type="checkbox" label="Yes" checked={recurring} onChange={() => setRecurring(!recurring)} />
                </Form.Group>

                {!recurring && (
                    <Form.Group className="mb-3" controlId="formBasicDate">
                        <Form.Label>Appointment Date</Form.Label>
                        <Form.Control type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} />
                    </Form.Group>
                )}

                {recurring && (
                    <div>
                        <h3>Select which days of the week you would like this walk to be repeated:</h3>
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                            <Form.Group className="mb-3" key={day}>
                                <Form.Check
                                    type="checkbox"
                                    label={day.charAt(0).toUpperCase() + day.slice(1)}
                                    checked={daysOfWeek[day]}
                                    onChange={() => handleDayChange(day)}
                                />
                            </Form.Group>
                        ))}
                    </div>
                )}

                {errors.length > 0 && (
                    <Alert variant="danger">
                        <ul>
                            {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                            ))}
                        </ul>
                    </Alert>
                )}
                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
        </Container>
    );
}
