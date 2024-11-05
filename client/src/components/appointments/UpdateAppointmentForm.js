import React, { useState, useEffect, useContext } from "react";
import { UserContext } from "../../context/user";
import { AppointmentsContext } from "../../context/appointments";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from 'react-bootstrap/Container';
import Alert from 'react-bootstrap/Alert';

export default function UpdateAppointmentForm({ apt, changeUpdateFormView }) {
    const { user } = useContext(UserContext);
    const { setPetsAppointments, petsAppointments, todaysAppointments, setTodaysAppointments } = useContext(AppointmentsContext);

    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [duration, setDuration] = useState(apt.duration || '30');
    const [appointmentDate, setAppointmentDate] = useState(apt.appointment_date || '');
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

    useEffect(() => {
        // Format the start and end times for display in HH:mm format
        const formatTime = (dateTime) => {
            const date = new Date(dateTime);
            return date.toLocaleTimeString("en-US", {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            });
        };

        setStartTime(apt.start_time ? formatTime(apt.start_time) : '');
        setEndTime(apt.end_time ? formatTime(apt.end_time) : '');
    }, [apt.start_time, apt.end_time]);

    function handleDayChange(day) {
        setDaysOfWeek((prevDays) => ({
            ...prevDays,
            [day]: !prevDays[day]
        }));
    }

    function handleUpdateAppointmentRequest(e) {
        e.preventDefault();
        const body = {
            user_id: user.id,
            start_time: startTime,
            end_time: endTime,
            duration: duration,
            recurring: apt.recurring,  // Keep the existing appointment type
        };

        if (apt.recurring) {
            body.monday = daysOfWeek.monday;
            body.tuesday = daysOfWeek.tuesday;
            body.wednesday = daysOfWeek.wednesday;
            body.thursday = daysOfWeek.thursday;
            body.friday = daysOfWeek.friday;
            body.saturday = daysOfWeek.saturday;
            body.sunday = daysOfWeek.sunday;
        } else {
            body.appointment_date = appointmentDate;
        }

        fetch(`/appointments/${apt.id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((updatedApt) => {
                        const newPetAppointments = petsAppointments.map((appointment) =>
                            appointment.id === updatedApt.id ? updatedApt : appointment
                        );

                        const newTodaysAppointments = todaysAppointments.map((appointment) =>
                            appointment.id === updatedApt.id ? updatedApt : appointment
                        );

                        setPetsAppointments(newPetAppointments);
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
                            value={startTime}
                            type="time"
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formBasicEndTime">
                        <Form.Label>End Time</Form.Label>
                        <Form.Control
                            onChange={(e) => setEndTime(e.target.value)}
                            value={endTime}
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
                    {apt.recurring ? (
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
                    ) : (
                        <Form.Group className="mb-3" controlId="formBasicDate">
                            <Form.Label>Appointment Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={appointmentDate || ''}
                                onChange={(e) => setAppointmentDate(e.target.value)}
                            />
                        </Form.Group>
                    )}
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
