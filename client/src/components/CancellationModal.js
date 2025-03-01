import React, { useState, useContext } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";

export default function CancellationModal({ appointment }) {
    const { setUser } = useContext(UserContext);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");

    async function handleNewCancellation(appointmentId, date, setUser) {
        const today = new Date().toISOString().split("T")[0];
        if (new Date(date) < new Date(today)) {
            alert("Cancellation date must be today or in the future.");
            return;
        }

        try {
            const response = await fetch("/cancellations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ appointment_id: appointmentId, date }),
                credentials: "include",
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(errorData.errors?.join(", ") || "Failed to create cancellation.");
                return;
            }

            const newCancellation = await response.json();

            setUser((prevUser) => ({
                ...prevUser,
                appointments: prevUser.appointments.map((appointment) =>
                    appointment.id === appointmentId
                        ? { ...appointment, cancellations: [...(appointment.cancellations || []), newCancellation] }
                        : appointment
                ),
            }));

            alert("Cancellation added successfully!");
        } catch (error) {
            console.error("Error adding cancellation:", error);
            alert("An error occurred while processing the cancellation.");
        }
    }


    const handleOpenModal = () => setShowModal(true);
    const handleCloseModal = () => {
        setSelectedDate("");
        setShowModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedDate) {
            alert("Please select a date for cancellation.");
            return;
        }

        // Call the async function to handle cancellation
        await handleNewCancellation(appointment.id, selectedDate, setUser);

        // Close modal on success
        handleCloseModal();
    };

    return (
        <>
            <CloseButton onClick={handleOpenModal}>➕ Add Cancellation</CloseButton>

            {showModal && (
                <ModalOverlay>
                    <ModalContent>
                        <CloseButton onClick={handleCloseModal}>✖ Close</CloseButton>
                        <Title>Select a Date for Cancellation</Title>
                        <Form onSubmit={handleSubmit}>
                            <Label>Cancellation Date:</Label>
                            <Input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]} // Prevent past dates
                            />
                            <SubmitButton type="submit">Confirm Cancellation</SubmitButton>
                        </Form>
                    </ModalContent>
                </ModalOverlay>
            )}
        </>
    );
}

const CloseButton = styled.button`
    background: red;
    color: black;
    border: none;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    top: 10px;
    right: 10px;
    &:hover {
        background: darkred;
    }
`;

const ModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: rgba(0, 0, 0, 0.6);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
`;

const ModalContent = styled.div`
    background: white;
    padding: 25px;
    border-radius: 12px;
    width: 90%;
    max-width: 400px;
    text-align: center;
`;

const Title = styled.h3`
    color: #333;
    margin-bottom: 15px;
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 15px;
`;

const Label = styled.label`
    font-size: 1rem;
    color: #333;
`;

const Input = styled.input`
    padding: 8px;
    border-radius: 6px;
    border: 1px solid #ccc;
    width: 100%;
`;

const SubmitButton = styled.button`
    background: #28a745;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;

    &:hover {
        background: darkgreen;
    }
`;