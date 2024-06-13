import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';

export default function CancelAppointmentModal({ show, handleClose, appointmentId, onSubmit }) {
    const [selectedDate, setSelectedDate] = useState('');
    const [error, setError] = useState('');

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
        setError('');  // Clear the error when the user starts typing
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        // Validate the selected date
        const currentDate = new Date();
        const chosenDate = new Date(selectedDate);

        if (chosenDate <= currentDate) {
            setError('The selected date must be in the future.');
            return;
        }

        // If no error, call onSubmit and close the modal
        onSubmit(selectedDate);
        handleClose();
    };

    return (
        <div>
            <Modal show={show} onHide={handleClose}>
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
