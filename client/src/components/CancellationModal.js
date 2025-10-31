import React, { useState, useContext, useEffect, useCallback } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { UserContext } from "../context/user";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { Calendar, X, Plus, Trash2, CalendarDays, CalendarRange, CheckSquare } from "lucide-react";
import toast from 'react-hot-toast';
import { useConfirm } from '../hooks/useConfirm';
import ConfirmModal from './ConfirmModal';

dayjs.extend(isSameOrBefore);

export default function CancellationModal({ appointment, setSelectedAppointment, onClose }) {
    const { updateAppointment } = useContext(UserContext);
    const { confirmState, confirm } = useConfirm();
    const [showModal, setShowModal] = useState(true); // Changed to true since it's controlled externally
    const [selectedDate, setSelectedDate] = useState("");
    const [dateMode, setDateMode] = useState('single'); // 'single', 'range', 'multi'
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [selectedDates, setSelectedDates] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [deletingIds, setDeletingIds] = useState(new Set());

    const handleCloseModal = useCallback(() => {
        setSelectedDate("");
        setStartDate("");
        setEndDate("");
        setSelectedDates([]);
        setDateMode('single');
        setShowModal(false);
        if (onClose) onClose(); // Call the external close handler
    }, [onClose]);

    async function handleNewCancellation(appointmentId, date) {
        const today = new Date().toISOString().split("T")[0];
        if (new Date(date) < new Date(today)) {
            toast.error("Cancellation date must be today or in the future.");
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
                toast.error(errorData.errors?.join(", ") || "Failed to create cancellation.");
                return false;
            }

            const newCancellation = await response.json();

            // Smart update - only update the specific appointment
            const updatedAppointment = {
                ...appointment,
                cancellations: [...(appointment.cancellations || []), newCancellation]
            };
            updateAppointment(updatedAppointment);
            return true;
        } catch (error) {
            console.error("Error adding cancellation:", error);
            toast.error("An error occurred while processing the cancellation.");
            return false;
        }
    }

    async function handleBulkCancellation(appointmentId, startDate, endDate) {
        const today = new Date().toISOString().split("T")[0];
        const start = dayjs(startDate);
        const end = dayjs(endDate);

        if (start.isAfter(end)) {
            toast.error("Start date must be before or equal to end date.");
            return false;
        }

        if (start.isBefore(dayjs(today))) {
            toast.error("Cancellation dates must be today or in the future.");
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
            toast.error("No valid appointment dates found in the selected range.");
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
            toast.success(`Successfully added ${successCount} cancellation${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}.`);
            setSelectedAppointment(null);
            return true;
        } else {
            toast.error("Failed to add any cancellations.");
            return false;
        }
    }

    async function handleDeleteCancellation(cancellationId) {
        setDeletingIds(prev => new Set(prev).add(cancellationId));
        try {
            const response = await fetch(`/cancellations/${cancellationId}`, {
                method: "DELETE",
                credentials: "include",
            });

            if (!response.ok) {
                toast.error("Failed to delete cancellation.");
                return;
            }

            // Smart update - only update the specific appointment
            const updatedAppointment = {
                ...appointment,
                cancellations: appointment.cancellations.filter(c => c.id !== cancellationId)
            };
            updateAppointment(updatedAppointment);

            toast.success("Cancellation removed.");
            setSelectedAppointment(null)
        } catch (error) {
            console.error("Error deleting cancellation:", error);
            toast.error("An error occurred while deleting the cancellation.");
        } finally {
            setDeletingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(cancellationId);
                return newSet;
            });
        }
    }

    async function handleMultipleCancellations(appointmentId, dates) {
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
            toast.success(`Successfully added ${successCount} cancellation${successCount > 1 ? 's' : ''}${failCount > 0 ? ` (${failCount} failed)` : ''}.`);
            setSelectedAppointment(null);
            return true;
        } else {
            toast.error("Failed to add any cancellations.");
            return false;
        }
    }

    // Group consecutive dates for better display
    const groupConsecutiveDates = (cancellations) => {
        if (!cancellations?.length) return [];
        
        const sortedCancellations = [...cancellations].sort((a, b) => 
            dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
        );

        const groups = [];
        let currentGroup = [sortedCancellations[0]];

        for (let i = 1; i < sortedCancellations.length; i++) {
            const current = dayjs(sortedCancellations[i].date);
            const previous = dayjs(sortedCancellations[i - 1].date);
            
            if (current.diff(previous, 'day') === 1) {
                currentGroup.push(sortedCancellations[i]);
            } else {
                groups.push(currentGroup);
                currentGroup = [sortedCancellations[i]];
            }
        }
        groups.push(currentGroup);
        
        return groups;
    };

    const handleDateToggle = (date) => {
        setSelectedDates(prev => {
            if (prev.includes(date)) {
                return prev.filter(d => d !== date);
            } else {
                return [...prev, date].sort();
            }
        });
    };

    const generateDateOptions = () => {
        const dates = [];
        const today = dayjs();
        const maxDate = today.add(6, 'months'); // Allow selection up to 6 months ahead
        
        let current = today;
        while (current.isSameOrBefore(maxDate)) {
            // Only show dates that match the appointment schedule for recurring appointments
            if (appointment.recurring) {
                const dayName = current.format('dddd').toLowerCase();
                if (appointment[dayName]) {
                    dates.push(current.format('YYYY-MM-DD'));
                }
            } else {
                // For non-recurring, only show the specific appointment date if it's in the future
                if (current.format('YYYY-MM-DD') === dayjs(appointment.appointment_date).format('YYYY-MM-DD')) {
                    dates.push(current.format('YYYY-MM-DD'));
                }
            }
            current = current.add(1, 'day');
        }
        return dates;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (isAdding) return;

        setIsAdding(true);
        try {
            if (dateMode === 'range') {
                if (!startDate || !endDate) {
                    toast.error("Please select both start and end dates for the range.");
                    return;
                }
                const success = await handleBulkCancellation(appointment.id, startDate, endDate);
                if (success) {
                    handleCloseModal();
                }
            } else if (dateMode === 'multi') {
                if (selectedDates.length === 0) {
                    toast.error("Please select at least one date for cancellation.");
                    return;
                }
                const success = await handleMultipleCancellations(appointment.id, selectedDates);
                if (success) {
                    handleCloseModal();
                }
            } else {
                if (!selectedDate) {
                    toast.error("Please select a date for cancellation.");
                    return;
                }
                const success = await handleNewCancellation(appointment.id, selectedDate);
                if (success) {
                    toast.success("Cancellation added.");
                    setSelectedAppointment(null);
                    handleCloseModal();
                }
            }
        } finally {
            setIsAdding(false);
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
    }, [showModal, handleCloseModal]);

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) {
            handleCloseModal();
        }
    };

    const modalContent = showModal ? (
        <>
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
                            {dateMode === 'range' ? <CalendarRange size={16} /> : 
                             dateMode === 'multi' ? <CheckSquare size={16} /> : <Calendar size={16} />}
                            Add New Cancellation{dateMode === 'single' ? '' : 's'}
                        </CancelLabel>
                        
                        <ToggleContainer>
                            <ToggleOption 
                                $active={dateMode === 'single'} 
                                onClick={() => setDateMode('single')}
                            >
                                <Calendar size={14} />
                                Single Date
                            </ToggleOption>
                            <ToggleOption 
                                $active={dateMode === 'range'} 
                                onClick={() => setDateMode('range')}
                            >
                                <CalendarRange size={14} />
                                Date Range
                            </ToggleOption>
                            <ToggleOption 
                                $active={dateMode === 'multi'} 
                                onClick={() => setDateMode('multi')}
                            >
                                <CheckSquare size={14} />
                                Select Multiple
                            </ToggleOption>
                        </ToggleContainer>

                        <CancelForm onSubmit={handleSubmit}>
                            {dateMode === 'range' ? (
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
                            ) : dateMode === 'multi' ? (
                                <MultiSelectContainer>
                                    <MultiSelectInfo>
                                        Select multiple dates ({selectedDates.length} selected)
                                    </MultiSelectInfo>
                                    <DateGridContainer>
                                        {generateDateOptions().slice(0, 30).map(date => (
                                            <DateOption
                                                key={date}
                                                $selected={selectedDates.includes(date)}
                                                onClick={() => handleDateToggle(date)}
                                            >
                                                <DateDay>{dayjs(date).format('D')}</DateDay>
                                                <DateMonth>{dayjs(date).format('MMM')}</DateMonth>
                                            </DateOption>
                                        ))}
                                    </DateGridContainer>
                                </MultiSelectContainer>
                            ) : (
                                <CancelInput
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split("T")[0]}
                                    placeholder="Select cancellation date"
                                />
                            )}
                            <CancelSubmitButton type="submit" disabled={isAdding}>
                                <Plus size={16} />
                                {isAdding ? 'Adding...' : `Add Cancellation${dateMode === 'single' ? '' : 's'}`}
                            </CancelSubmitButton>
                        </CancelForm>
                    </CancelInputGroup>

                    {appointment.cancellations?.length > 0 && (
                        <CancelInputGroup>
                            <CancelLabel>
                                <Trash2 size={16} />
                                Existing Cancellations ({appointment.cancellations.length})
                            </CancelLabel>
                            <CancellationList>
                                {groupConsecutiveDates(appointment.cancellations).map((group, groupIndex) => (
                                    <CancellationGroup key={groupIndex}>
                                        {group.length > 2 ? (
                                            // Show as date range for 3+ consecutive dates
                                            <CancellationRangeItem>
                                                <CancellationRangeInfo>
                                                    <CalendarRange size={16} />
                                                    <CancellationRangeText>
                                                        <CancellationRangeDates>
                                                            {dayjs(group[0].date).format("MMM D")} - {dayjs(group[group.length - 1].date).format("MMM D, YYYY")}
                                                        </CancellationRangeDates>
                                                        <CancellationRangeCount>
                                                            {group.length} consecutive days
                                                        </CancellationRangeCount>
                                                    </CancellationRangeText>
                                                </CancellationRangeInfo>
                                                <CancellationRangeActions>
                                                    <CancelDeleteButton
                                                        onClick={async () => {
                                                            const confirmed = await confirm({
                                                                title: 'Delete Multiple Cancellations?',
                                                                message: `Delete all ${group.length} cancellations from ${dayjs(group[0].date).format("MMM D")} to ${dayjs(group[group.length - 1].date).format("MMM D")}?`,
                                                                confirmText: 'Delete All',
                                                                cancelText: 'Cancel',
                                                                variant: 'danger'
                                                            });

                                                            if (confirmed) {
                                                                for (const cancellation of group) {
                                                                    await handleDeleteCancellation(cancellation.id);
                                                                }
                                                            }
                                                        }}
                                                        disabled={group.some(c => deletingIds.has(c.id))}
                                                    >
                                                        <Trash2 size={14} />
                                                        {group.some(c => deletingIds.has(c.id)) ? 'Deleting...' : 'Delete All'}
                                                    </CancelDeleteButton>
                                                </CancellationRangeActions>
                                            </CancellationRangeItem>
                                        ) : (
                                            // Show individual dates for 1-2 dates
                                            group.map((cancellation) => (
                                                <CancellationItem key={cancellation.id}>
                                                    <CancellationDate>
                                                        <Calendar size={14} />
                                                        {dayjs(cancellation.date).format("MMMM D, YYYY")}
                                                    </CancellationDate>
                                                    <CancelDeleteButton
                                                        onClick={() => handleDeleteCancellation(cancellation.id)}
                                                        disabled={deletingIds.has(cancellation.id)}
                                                    >
                                                        <Trash2 size={14} />
                                                        {deletingIds.has(cancellation.id) && 'Deleting...'}
                                                    </CancelDeleteButton>
                                                </CancellationItem>
                                            ))
                                        )}
                                    </CancellationGroup>
                                ))}
                            </CancellationList>
                        </CancelInputGroup>
                    )}
                </CancelModalForm>
            </CancelModalContainer>
        </CancelModalOverlay>
        {confirmState.isOpen && (
            <ConfirmModal
                title={confirmState.title}
                message={confirmState.message}
                onConfirm={confirmState.onConfirm}
                onCancel={confirmState.onCancel}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                variant={confirmState.variant}
            />
        )}
        </>
    ) : null;

    return modalContent && ReactDOM.createPortal(modalContent, document.body);
}

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

    &:hover:not(:disabled) {
        background: linear-gradient(135deg, #16a34a, #15803d);
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(34, 197, 94, 0.4);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
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

const CancellationDate = styled.div`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 0.9rem;
    font-weight: 500;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 8px;
    
    svg {
        color: rgba(255, 255, 255, 0.6);
        flex-shrink: 0;
    }
`;

const CancelDeleteButton = styled.button`
    background: rgba(239, 68, 68, 0.2);
    color: #fca5a5;
    border: 2px solid rgba(239, 68, 68, 0.3);
    padding: 8px 12px;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: all 0.3s ease;
    font-family: 'Poppins', sans-serif;
    font-size: 0.8rem;
    font-weight: 500;
    white-space: nowrap;

    &:hover:not(:disabled) {
        background: rgba(239, 68, 68, 0.3);
        border-color: rgba(239, 68, 68, 0.5);
        transform: scale(1.05);
        color: #ffffff;
    }

    &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
`;

// New styled components for range functionality
const ToggleContainer = styled.div`
    display: flex;
    gap: 4px;
    margin-bottom: 12px;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ToggleOption = styled.button`
    flex: 1;
    padding: 10px 8px;
    border: none;
    border-radius: 8px;
    background: ${({ $active }) => 
        $active ? 'linear-gradient(135deg, #a569a7, #8b5a8c)' : 'transparent'
    };
    color: #ffffff;
    font-family: 'Poppins', sans-serif;
    font-size: 0.75rem;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    transition: all 0.3s ease;
    text-align: center;
    
    &:hover {
        background: ${({ $active }) => 
            $active 
                ? 'linear-gradient(135deg, #936394, #7d527e)' 
                : 'rgba(255, 255, 255, 0.1)'
        };
    }
    
    @media (max-width: 480px) {
        flex-direction: column;
        gap: 2px;
        font-size: 0.7rem;
        padding: 8px 4px;
        
        svg {
            width: 12px;
            height: 12px;
        }
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

// Multi-select styled components
const MultiSelectContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const MultiSelectInfo = styled.div`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    font-weight: 500;
    text-align: center;
    background: rgba(255, 255, 255, 0.1);
    padding: 8px 12px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.15);
`;

const DateGridContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    padding: 4px;
    
    &::-webkit-scrollbar {
        width: 4px;
    }
    
    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        
        &:hover {
            background: rgba(255, 255, 255, 0.5);
        }
    }
`;

const DateOption = styled.button`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 8px 4px;
    border: 2px solid ${({ $selected }) => 
        $selected ? '#a569a7' : 'rgba(255, 255, 255, 0.2)'
    };
    border-radius: 10px;
    background: ${({ $selected }) => 
        $selected 
            ? 'linear-gradient(135deg, #a569a7, #8b5a8c)' 
            : 'rgba(255, 255, 255, 0.1)'
    };
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    font-family: 'Poppins', sans-serif;
    min-height: 50px;
    
    &:hover {
        border-color: ${({ $selected }) => 
            $selected ? '#936394' : 'rgba(255, 255, 255, 0.4)'
        };
        background: ${({ $selected }) => 
            $selected 
                ? 'linear-gradient(135deg, #936394, #7d527e)' 
                : 'rgba(255, 255, 255, 0.15)'
        };
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    }
`;

const DateDay = styled.div`
    font-size: 1.1rem;
    font-weight: 700;
    line-height: 1;
`;

const DateMonth = styled.div`
    font-size: 0.7rem;
    font-weight: 500;
    opacity: 0.9;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

// Improved cancellation list styled components
const CancellationGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const CancellationRangeItem = styled.div`
    background: linear-gradient(145deg, rgba(139, 90, 140, 0.2), rgba(107, 43, 107, 0.15));
    border: 2px solid rgba(165, 105, 167, 0.3);
    padding: 16px;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
    margin-bottom: 8px;

    &:hover {
        transform: translateY(-1px);
        border-color: rgba(165, 105, 167, 0.4);
        box-shadow: 0 6px 20px rgba(139, 90, 140, 0.2);
    }
`;

const CancellationRangeInfo = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    
    svg {
        color: #a569a7;
        flex-shrink: 0;
    }
`;

const CancellationRangeText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const CancellationRangeDates = styled.div`
    font-family: 'Poppins', sans-serif;
    color: #ffffff;
    font-size: 1rem;
    font-weight: 600;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
`;

const CancellationRangeCount = styled.div`
    font-family: 'Poppins', sans-serif;
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.8rem;
    font-weight: 500;
    font-style: italic;
`;

const CancellationRangeActions = styled.div`
    display: flex;
    gap: 8px;
`;

// Individual cancellation date styling is defined above