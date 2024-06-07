import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

export default function CancelAppointmentModal({ show, handleClose, appointmentId, onSubmit }) {
    const [selectedDate, setSelectedDate] = useState('');

    const handleDateChange = (event) => {
        setSelectedDate(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit(selectedDate);
    };

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Select Date to Skip Appointment</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form onSubmit={handleSubmit}>
                    <Form.Group controlId="formDate">
                        <Form.Label>Date</Form.Label>
                        <Form.Control type="date" value={selectedDate} onChange={handleDateChange} required />
                    </Form.Group>
                    <p>*Date must be in the future or it will not be submitted!</p>
                    <Button variant="primary" type="submit">
                        Submit
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}
