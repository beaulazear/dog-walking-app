import React, { useState, useContext } from "react";
import { UserContext } from "../../context/user";
import { AppointmentsContext } from "../../context/appointments";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

export default function UpdateAppointmentForm({ apt, changeUpdateFormView }) {
    const { user } = useContext(UserContext);
    const { setPetsAppointments, petsAppointments, todaysAppointments, setTodaysAppointments } = useContext(AppointmentsContext);

    const [startTime, setStartTime] = useState(apt.start_time || '');
    const [endTime, setEndTime] = useState(apt.end_time || '');
    const [duration, setDuration] = useState(apt.duration || '30');
    const [daysOfWeek, setDaysOfWeek] = useState({
        monday: apt.monday || false,
        tuesday: apt.tuesday || false,
        wednesday: apt.wednesday || false,
        thursday: apt.thursday || false,
        friday: apt.friday || false,
        saturday: apt.saturday || false,
        sunday: apt.sunday || false
    });
    const [errors, setErrors] = useState([]);

    function handleDayChange(day) {
        setDaysOfWeek((prevDays) => ({
            ...prevDays,
            [day]: !prevDays[day]
        }));
    }

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
                monday: daysOfWeek.monday,
                tuesday: daysOfWeek.tuesday,
                wednesday: daysOfWeek.wednesday,
                thursday: daysOfWeek.thursday,
                friday: daysOfWeek.friday,
                saturday: daysOfWeek.saturday,
                sunday: daysOfWeek.sunday,
            })
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((updatedApt) => {
                        const newPetAppointments = petsAppointments.filter((apt) => apt.id !== updatedApt.id);
                        const newTodaysAppointments = todaysAppointments.map((apt) => {
                            if (apt.id === updatedApt.id) {
                                return updatedApt;
                            } else {
                                return apt;
                            }
                        });
                        setPetsAppointments([updatedApt, ...newPetAppointments]);
                        setTodaysAppointments(newTodaysAppointments);
                        changeUpdateFormView();
                        alert('Appointment successfully updated!');
                    });
                } else {
                    response.json().then((errorData) => setErrors(errorData.errors));
                }
            });
    }

    return (
        <div>
            <Container>
                <Form className="text-bg-light p-3" onSubmit={handleUpdateAppointmentRequest}>
                    <h1 className="display-6">Update Appointment</h1>
                    <Form.Group className="mb-3" controlId="formBasicStartTime">
                        <Form.Label>Start Time</Form.Label>
                        <Form.Control
                            onChange={(e) => setStartTime(e.target.value)}
                            value={startTime || ''}
                            type="time"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicEndTime">
                        <Form.Label>End Time</Form.Label>
                        <Form.Control
                            onChange={(e) => setEndTime(e.target.value)}
                            value={endTime || ''}
                            type="time"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicDuration">
                        <Form.Label>Walk Duration</Form.Label>
                        <Form.Select
                            value={duration}
                            onChange={(e) => setDuration(e.target.value)}
                        >
                            <option value="30">30 Minutes</option>
                            <option value="45">45 Minutes</option>
                            <option value="60">60 Minutes</option>
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-3">
                        <Form.Label>Days of Week</Form.Label>
                        {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                            <Form.Check
                                key={day}
                                type="checkbox"
                                id={`formBasic${day.charAt(0).toUpperCase() + day.slice(1)}`}
                                label={day.charAt(0).toUpperCase() + day.slice(1)}
                                checked={daysOfWeek[day]}
                                onChange={() => handleDayChange(day)}
                            />
                        ))}
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
        </div>
    );
}
