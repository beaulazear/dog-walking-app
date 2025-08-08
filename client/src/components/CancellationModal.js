import React, { useState, useContext, useEffect } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { UserContext } from "../context/user";
import dayjs from "dayjs";
import { Calendar, X, Plus, Trash2, CalendarDays, CalendarRange } from "lucide-react";

export default function CancellationModal({ appointment, setSelectedAppointment }) {
    const { setUser } = useContext(UserContext);
    const [showModal, setShowModal] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");
    const [useRange, setUseRange] = useState(false);
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleOpenModal = () => setShowModal(true);
    const handleCloseModal = () => {
        setSelectedDate("");
        setStartDate("");
        setEndDate("");
        setUseRange(false);
        setShowModal(false);
    };

    async function handleNewCancellation(appointmentId, date) {
        const today = new Date().toISOString().split("T")[0];
        if (new Date(date) < new Date(today)) {
            alert("Cancellation date must be today or in the future.");
            return false;
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
                return false;
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
            return true;
        } catch (error) {
            console.error("Error adding cancellation:", error);
            alert("An error occurred while processing the cancellation.");
            return false;
        }
    }

    async function handleBulkCancellation(appointmentId, startDate, endDate) {
        const today = new Date().toISOString().split("T")[0];
        const start = dayjs(startDate);
        const end = dayjs(endDate);
        
        if (start.isAfter(end)) {
            alert("Start date must be before or equal to end date.");
            return false;
        }

        if (start.isBefore(dayjs(today))) {
            alert("Cancellation dates must be today or in the future.");
            return false;
        }

        const dates = [];
        let currentDate = start;
        
        while (currentDate.isSameOrBefore(end)) {
            // Only add dates that match the recurring schedule
            if (appointment.recurring) {
                const dayName = currentDate.format('dddd').toLowerCase();
                if (appointment[dayName]) {
                    dates.push(currentDate.format('YYYY-MM-DD'));
                }
            } else {
                // For non-recurring appointments, only add if it matches the appointment date
                if (currentDate.format('YYYY-MM-DD') === dayjs(appointment.appointment_date).format('YYYY-MM-DD')) {
                    dates.push(currentDate.format('YYYY-MM-DD'));
                }
            }
            currentDate = currentDate.add(1, 'day');
        }

        if (dates.length === 0) {
            alert("No valid appointment dates found in the selected range.");
            return false;
        }

        let successCount = 0;
        let failCount = 0;

        for (const date of dates) {
            const success = await handleNewCancellation(appointmentId, date);
            if (success) {
                successCount++;
            } else {
                failCount++;
            }
        }

        if (successCount > 0) {
            alert(`Successfully added ${successCount} cancellation${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}.`);
            setSelectedAppointment(null);
            return true;
        } else {
            alert("Failed to add any cancellations.");
            return false;
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

        if (useRange) {
            if (!startDate || !endDate) {
                alert("Please select both start and end dates for the range.");
                return;
            }
            const success = await handleBulkCancellation(appointment.id, startDate, endDate);
            if (success) {
                handleCloseModal();
            }
        } else {
            if (!selectedDate) {
                alert("Please select a date for cancellation.");
                return;
            }
            const success = await handleNewCancellation(appointment.id, selectedDate);
            if (success) {
                alert("Cancellation added.");
                setSelectedAppointment(null);
                handleCloseModal();
            }
        }
    };

    // Lock body scroll when modal is open and handle ESC key
    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
            
            const handleKeyDown = (e) => {
                if (e.key === 'Escape') {
                    handleCloseModal();
                }
            };
            
            document.addEventListener('keydown', handleKeyDown);
            
            return () => {
                document.body.style.overflow = 'unset';
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    }, [showModal]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
    };

    const modalContent = showModal ? (
        <CancelModalOverlay onClick={handleOverlayClick}>
            <CancelModalContainer>
                <CancelModalHeader>
                    <CancelModalTitle>
                        <CalendarDays size={20} />
                        Manage Cancellations
                    </CancelModalTitle>
                    <CancelModalCloseButton onClick={handleCloseModal}>
                        <X size={18} />
                    </CancelModalCloseButton>
                </CancelModalHeader>
                
                <CancelModalForm>
                    <CancelInputGroup>
                        <CancelLabel>
                            {useRange ? <CalendarRange size={16} /> : <Calendar size={16} />}
                            Add New Cancellation{useRange ? 's' : ''}
                        </CancelLabel>
                        
                        <ToggleContainer>
                            <ToggleOption 
                                $active={!useRange} 
                                onClick={() => setUseRange(false)}
                            >
                                <Calendar size={14} />
                                Single Date
                            </ToggleOption>
                            <ToggleOption 
                                $active={useRange} 
                                onClick={() => setUseRange(true)}
                            >
                                <CalendarRange size={14} />
                                Date Range
                            </ToggleOption>
                        </ToggleContainer>

                        <CancelForm onSubmit={handleSubmit}>
                            {useRange ? (
                                <DateRangeContainer>
                                    <DateInputGroup>
                                        <DateInputLabel>Start Date</DateInputLabel>
                                        <CancelInput
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            min={new Date().toISOString().split("T")[0]}
                                            placeholder="Start date"
                                        />
                                    </DateInputGroup>
                                    <DateInputGroup>
                                        <DateInputLabel>End Date</DateInputLabel>
                                        <CancelInput
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            min={startDate || new Date().toISOString().split("T")[0]}
                                            placeholder="End date"
                                        />
                                    </DateInputGroup>
                                </DateRangeContainer>
                            ) : (
                                <CancelInput
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    placeholder="Select cancellation date"
                                />
                            )}
                            <CancelSubmitButton type="submit">
                                <Plus size={16} />
                                Add Cancellation{useRange ? 's' : ''}
                            </CancelSubmitButton>
                        </CancelForm>
                    </CancelInputGroup>

                    {appointment.cancellations?.length > 0 && (
                        <CancelInputGroup>
                            <CancelLabel>
                                <Trash2 size={16} />
                                Existing Cancellations
                            </CancelLabel>
                            <CancellationList>
                                {appointment.cancellations.map((cancellation) => (
                                    <CancellationItem key={cancellation.id}>
                                        <CancellationDate>
                                            {dayjs(cancellation.date).format("MMMM D, YYYY")}
                                        </CancellationDate>
                                        <CancelDeleteButton onClick={() => handleDeleteCancellation(cancellation.id)}>
                                            <Trash2 size={14} />
                                        </CancelDeleteButton>
                                    </CancellationItem>
                                ))}
                            </CancellationList>
                        </CancelInputGroup>
                    )}
                </CancelModalForm>
            </CancelModalContainer>
        </CancelModalOverlay>
    ) : null;

    return (
        <>
            <ToggleButton onClick={handleOpenModal}>
                <Plus size={16} />
                Manage Cancellations
            </ToggleButton>
            {modalContent && ReactDOM.createPortal(modalContent, document.body)}
        </>
    );
}

const ToggleButton = styled.button`
    background: linear-gradient(135deg, #8b5a8c, #a569a7);
    color: #ffffff;
    padding: 10px 16px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.3s ease;
    box-shadow: 0 3px 12px rgba(139, 90, 140, 0.3);
    width: 100%;
    justify-content: center;

    &:hover {
        background: linear-gradient(135deg, #7d527e, #936394);
        transform: translateY(-1px);
        box-shadow: 0 4px 16px rgba(139, 90, 140, 0.4);
    }
    
    @media (max-width: 768px) {
        padding: 12px 18px;
        font-size: 0.8rem;
    }
`;

// Modal styled components
const CancelModalOverlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10001;
    backdrop-filter: blur(8px);
    padding: 20px;
    box-sizing: border-box;
    animation: modalFadeIn 0.3s ease-out;
    
    @keyframes modalFadeIn {
        from {
            opacity: 0;
            backdrop-filter: blur(0px);
        }
        to {
            opacity: 1;
            backdrop-filter: blur(8px);
        }
    }
`;

const CancelModalContainer = styled.div`
    background: linear-gradient(145deg, rgba(107, 43, 107, 0.95), rgba(139, 90, 140, 0.9));
    width: 100%;
    max-width: 450px;
    border-radius: 20px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(20px);
    box-shadow: 
        0 20px 60px rgba(0, 0, 0, 0.4),
        0 8px 32px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    max-height: calc(100vh - 40px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: modalSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    transform-origin: center center;
    
    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: scale(0.9) translateY(-20px);
        }
        to {
            opacity: 1;
            transform: scale(1) translateY(0);
        }
    }
    
    @media (max-width: 768px) {
        max-width: 380px;
        border-radius: 16px;
    }
    
    @media (max-width: 480px) {
        max-width: 340px;
        border-radius: 14px;
    }
`;

const CancelModalHeader = styled.div`
    padding: 24px 24px 20px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    background: linear-gradient(145deg, rgba(107, 43, 107, 0.3), rgba(139, 90, 140, 0.2));
    border-radius: 20px 20px 0 0;
    flex-shrink: 0;
    
    @media (max-width: 768px) {
        padding: 20px 20px 16px 20px;
        border-radius: 16px 16px 0 0;
    }
    
    @media (max-width: 480px) {
        border-radius: 14px 14px 0 0;
    }
`;

const CancelModalTitle = styled.h2`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1.3rem;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
    
    @media (max-width: 768px) {
        font-size: 1.1rem;
    }
`;

const CancelModalCloseButton = styled.button`
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 8px 10px;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(5px);
    
    &:hover {
        background: rgba(255, 255, 255, 0.2);
        border-color: rgba(255, 255, 255, 0.3);
        transform: scale(1.05);
    }
`;

const CancelModalForm = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 0 24px 24px 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
    
    @media (max-width: 768px) {
        padding: 0 20px 20px 20px;
        gap: 20px;
    }
`;

const CancelInputGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const CancelLabel = styled.label`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const CancelForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const CancelInput = styled.input`
    padding: 12px 14px;
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    background: rgba(255, 255, 255, 0.1);
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    backdrop-filter: blur(5px);
    transition: all 0.3s ease;
    
    &:focus {
        outline: none;
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(255, 255, 255, 0.15);
        box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
    }
    
    @media (max-width: 768px) {
        padding: 14px 16px;
        font-size: 16px;
    }
`;

const CancelSubmitButton = styled.button`
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: #ffffff;
    padding: 12px 18px;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.3);
    
    &:hover {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }
    
    @media (max-width: 768px) {
        padding: 14px 20px;
        font-size: 1rem;
    }
`;

const CancellationList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const CancellationItem = styled.div`
    background: linear-gradient(145deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05));
    border: 2px solid rgba(239, 68, 68, 0.2);
    padding: 12px 16px;
    border-radius: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;

    &:hover {
        transform: translateY(-1px);
        border-color: rgba(239, 68, 68, 0.3);
        box-shadow: 0 4px 16px rgba(239, 68, 68, 0.1);
    }
`;

const CancellationDate = styled.span`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const CancelDeleteButton = styled.button`
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    border: 2px solid rgba(239, 68, 68, 0.3);
    padding: 6px 8px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    
    &:hover {
        background: rgba(239, 68, 68, 0.3);
        border-color: rgba(239, 68, 68, 0.5);
        transform: scale(1.05);
        color: #ffffff;
    }
`;

// New styled components for range functionality
const ToggleContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ToggleOption = styled.button`
    flex: 1;
    padding: 8px 12px;
    border: none;
    border-radius: 8px;
    background: ${({ $active }) => 
        $active ? 'linear-gradient(135deg, #a569a7, #8b5a8c)' : 'transparent'
    };
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.3s ease;
    
    &:hover {
        background: ${({ $active }) => 
            $active 
                ? 'linear-gradient(135deg, #936394, #7d527e)' 
                : 'rgba(255, 255, 255, 0.1)'
        };
    }
`;

const DateRangeContainer = styled.div`
    display: flex;
    gap: 8px;
    
    @media (max-width: 480px) {
        flex-direction: column;
    }
`;

const DateInputGroup = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const DateInputLabel = styled.label`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.8rem;
    font-weight: 500;
`;