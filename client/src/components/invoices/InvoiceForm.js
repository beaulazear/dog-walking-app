import React, { useState, useContext } from "react";
import styled from 'styled-components';
import { PetsContext } from "../../context/pets";
import { AppointmentsContext } from "../../context/appointments";

// Styled components
const StyledForm = styled.form`
    max-width: 500px;
    margin: 20px auto;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    background-color: #f9f9f9;
`;

const FormGroup = styled.div`
    margin-bottom: 15px;
`;

const FormLabel = styled.label`
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
`;

const FormControl = styled.input`
    width: 100%;
    padding: 10px;
    border: 1px solid #ced4da;
    border-radius: 4px;
    box-sizing: border-box;
`;

const Button = styled.button`
    display: block;
    width: 100%;
    padding: 10px;
    margin-bottom: 8px;
    border: none;
    border-radius: 4px;
    color: #fff;
    background-color: #007bff; /* Primary color */
    font-size: 16px;
    cursor: pointer;
    text-align: center;

    &:hover {
        background-color: #0056b3; /* Darker shade for hover */
    }
`;

const ModalContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
    background-color: #fff;
    max-width: 500px;
    margin: 20px auto;
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    padding-bottom: 10px;
    border-bottom: 1px solid #e0e0e0;
`;

const ModalTitle = styled.h2`
    margin: 0;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #007bff;
    
    &:hover {
        color: #0056b3;
    }
`;

export default function InvoiceForm({ apt }) {
    const { pets, setPets } = useContext(PetsContext);
    const { todaysAppointments, setTodaysAppointments } = useContext(AppointmentsContext);

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
            <Button onClick={handleShowModal}>
                Create New Invoice
            </Button>

            {showModal && (
                <ModalContainer>
                    <ModalHeader>
                        <ModalTitle>Create New Invoice</ModalTitle>
                        <CloseButton onClick={handleCloseModal}>&times;</CloseButton>
                    </ModalHeader>
                    <StyledForm onSubmit={handleSubmit}>
                        <FormGroup>
                            <FormLabel>Date</FormLabel>
                            <FormControl
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel>Title</FormLabel>
                            <FormControl
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Enter title"
                                required
                            />
                        </FormGroup>
                        <FormGroup>
                            <FormLabel>Compensation</FormLabel>
                            <FormControl
                                type="number"
                                value={compensation}
                                onChange={(e) => setCompensation(e.target.value)}
                                placeholder="Enter compensation amount"
                                required
                            />
                        </FormGroup>
                        <Button type="submit">
                            Submit
                        </Button>
                    </StyledForm>
                </ModalContainer>
            )}
        </div>
    );
}
