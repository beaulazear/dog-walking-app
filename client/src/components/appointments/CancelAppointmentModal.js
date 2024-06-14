import React, { useState, useContext } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { AppointmentsContext } from "../../context/appointments";

export default function CancelAppointmentModal({ show, handleClose, appointmentId }) {
    const [selectedDate, setSelectedDate] = useState('');
    const [error, setError] = useState('');

    const { petsAppointments, setPetsAppointments } = useContext(AppointmentsContext);

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
        setError('');
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            const currentDate = new Date();
            const chosenDate = new Date(selectedDate);

            if (chosenDate <= currentDate) {
                setError('The selected date must be in the future.');
                return;
            }

            const response = await fetch('/cancellations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    appointment_id: appointmentId,
                    date: selectedDate
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                setError(errorData.errors ? errorData.errors.join(', ') : 'An error occurred. Please try again.');
                return;
            }

            const data = await response.json();
            console.log('Cancellation added:', data);
            const updatedAppointments = petsAppointments.map(appointment => {
                if (appointment.id === appointmentId) {
                    return {
                        ...appointment,
                        cancellations: [...appointment.cancellations, data]
                    };
                }
                return appointment;
            });
            setPetsAppointments(updatedAppointments);
            handleClose();
        } catch (err) {
            setError('An error occurred while submitting your request. Please try again.');
        }
    };

    const handleModalClose = () => {
        setError(''); // Clear error when modal is closed
        handleClose();
    };

    return (
        <div>
            <Modal show={show} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Select Date to Skip Appointment</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="formDate">
                            <Form.Label>Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={selectedDate}
                                onChange={handleDateChange}
                                required
                            />
                        </Form.Group>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
        </div>
    );
}
