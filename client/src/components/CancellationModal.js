import React, { useState, useContext } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import dayjs from "dayjs";

export default function CancellationModal({ appointment, setSelectedAppointment }) {
    const { setUser } = useContext(UserContext);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");

    const handleOpenModal = () => setShowModal(true);
    const handleCloseModal = () => {
        setSelectedDate("");
        setShowModal(false);
    };

    async function handleNewCancellation(appointmentId, date) {
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
                appointments: prevUser.appointments.map((apt) =>
                    apt.id === appointmentId
                        ? { ...apt, cancellations: [...(apt.cancellations || []), newCancellation] }
                        : apt
                ),
            }));
            alert("Cancellation added.");
            setSelectedAppointment(null)
        } catch (error) {
            console.error("Error adding cancellation:", error);
            alert("An error occurred while processing the cancellation.");
        }
    }

    async function handleDeleteCancellation(cancellationId) {
        try {
            const response = await fetch(`/cancellations/${cancellationId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                alert("Failed to delete cancellation.");
                return;
            }

            setUser((prevUser) => ({
                ...prevUser,
                appointments: prevUser.appointments.map((apt) =>
                    apt.id === appointment.id
                        ? { ...apt, cancellations: apt.cancellations.filter(c => c.id !== cancellationId) }
                        : apt
                ),
            }));

            alert("Cancellation removed.");
            setSelectedAppointment(null)
        } catch (error) {
            console.error("Error deleting cancellation:", error);
            alert("An error occurred while deleting the cancellation.");
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedDate) {
            alert("Please select a date for cancellation.");
            return;
        }

        await handleNewCancellation(appointment.id, selectedDate);
        handleCloseModal();
    };

    return (
        <>
            <ToggleButton onClick={handleOpenModal}>➕ Add or Remove Cancellations</ToggleButton>

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

                        {appointment.cancellations?.length > 0 && (
                            <>
                                <Title>Existing Cancellations</Title>
                                <CancellationList>
                                    {appointment.cancellations.map((cancellation) => (
                                        <CancellationItem key={cancellation.id}>
                                            {dayjs(cancellation.date).format("MMMM D, YYYY")}
                                            <DeleteButton onClick={() => handleDeleteCancellation(cancellation.id)}>❌</DeleteButton>
                                        </CancellationItem>
                                    ))}
                                </CancellationList>
                            </>
                        )}
                    </ModalContent>
                </ModalOverlay>
            )}
        </>
    );
}

const ToggleButton = styled.button`
    background: #28a745;
    color: white;
    padding: 10px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 1rem;
    margin-top: 10px;

    &:hover {
        background: darkgreen;
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

const CloseButton = styled.button`
    background: red;
    color: white;
    border: none;
    padding: 5px 10px;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 10px;

    &:hover {
        background: darkred;
    }
`;

const CancellationList = styled.ul`
    list-style: none;
    padding: 0;
    margin-top: 10px;
`;

const CancellationItem = styled.li`
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8f9fa;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 5px;
`;

const DeleteButton = styled.button`
    background: red;
    color: white;
    border: none;
    padding: 5px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;

    &:hover {
        background: darkred;
    }
`;