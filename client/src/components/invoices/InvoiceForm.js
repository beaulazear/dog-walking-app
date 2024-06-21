import React, { useState, useContext } from "react";
import styled from 'styled-components';
import Button from "react-bootstrap/Button";
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { PetsContext } from "../../context/pets";
import { AppointmentsContext } from "../../context/appointments"; // Importing AppointmentsContext

const StyledForm = styled(Form)`
    max-width: 500px;
    margin: 20px auto;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    background-color: #f9f9f9;
`;

export default function InvoiceForm({ apt }) { // Removed updateAppointments prop
    const { pets, setPets } = useContext(PetsContext);
    const { todaysAppointments, setTodaysAppointments } = useContext(AppointmentsContext); // Using AppointmentsContext

    const [date, setDate] = useState('');
    const [title, setTitle] = useState('');
    const [compensation, setCompensation] = useState('');
    const [showModal, setShowModal] = useState(false);

    const handleSubmit = (event) => {
        event.preventDefault();
        handleNewInvoice({ date, title, compensation });
        setShowModal(false);
    };

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    function combineDateAndTime(date, time) {
        const datePart = date;
        const timePart = time.slice(11, 19);

        return `${datePart}T${timePart}`;
    }

    function handleNewInvoice({ date, title, compensation }) {
        const newDate = combineDateAndTime(date, apt.start_time);

        const confirm = window.confirm(`Create a new invoice for $${compensation}?`);

        if (confirm) {
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
                    compensation: parseFloat(compensation),
                    title
                })
            })
                .then((response) => response.json())
                .then((newInvoice) => {
                    const newApt = { ...apt, invoices: [...apt.invoices, newInvoice] };
                    const newPets = pets.map((pet) => {
                        if (pet.id === newInvoice.pet_id) {
                            pet.invoices = [...pet.invoices, newInvoice];
                            return pet;
                        } else {
                            return pet;
                        }
                    });
                    setPets(newPets);
                    const newAppointments = todaysAppointments.map((appointment) =>
                        appointment.id === apt.id ? newApt : appointment
                    );
                    setTodaysAppointments(newAppointments);
                    window.alert('New invoice has been created and can be viewed on the finance page!')
                });
        } else {
            console.log("Invoice not completed");
        }
    }

    return (
        <div>
            <Button style={{width: '100%'}} variant="primary" onClick={handleShowModal} className="btn btn-secondary btn-block">
                Create New Invoice
            </Button>

            <Modal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Invoice</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <StyledForm onSubmit={handleSubmit}>
                        <Form.Group controlId="formDate">
                            <Form.Label>Date</Form.Label>
                            <Form.Control
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="formTitle">
                            <Form.Label>Title</Form.Label>
                            <Form.Control
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter title"
                                required
                            />
                        </Form.Group>
                        <Form.Group controlId="formCompensation">
                            <Form.Label>Compensation</Form.Label>
                            <Form.Control
                                type="number"
                                value={compensation}
                                onChange={(e) => setCompensation(e.target.value)}
                                placeholder="Enter compensation amount"
                                required
                            />
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </StyledForm>
                </Modal.Body>
            </Modal>
        </div>
    );
}
