import React, { useState, useEffect, useContext } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import toast from 'react-hot-toast';
import { X, Share2, Users } from "lucide-react";
import { UserContext } from "../context/user";

export default function ShareAppointmentModal({ isOpen, onClose, appointment, appointments = [] }) {
    const { user } = useContext(UserContext);
    const [connections, setConnections] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [isSharing, setIsSharing] = useState(false);
    const [shareMultiple, setShareMultiple] = useState(false);

    const isSingleAppointment = appointment && !appointments.length;
    const appointmentsToShare = isSingleAppointment ? [appointment] : appointments;

    useEffect(() => {
        if (isOpen) {
            fetchConnections();
        }
    }, [isOpen]);

    const fetchConnections = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/walker_connections", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const accepted = data.filter(c => c.status === "accepted");
                setConnections(accepted);
            }
        } catch (error) {
            console.error("Error fetching connections:", error);
        }
    };

    const handleShare = async () => {
        if (!selectedUserId) {
            toast.error("Please select a team member");
            return;
        }

        setIsSharing(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/appointment_shares", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    shared_with_user_id: selectedUserId,
                    appointment_ids: appointmentsToShare.map(a => a.id),
                    recurring_share: shareMultiple
                })
            });

            if (response.ok) {
                const data = await response.json();
                toast.success(data.message);
                onClose();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to share appointment");
            }
        } catch (error) {
            console.error("Error sharing appointment:", error);
            toast.error("Error sharing appointment");
        } finally {
            setIsSharing(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <Overlay onClick={onClose}>
            <ModalContainer onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                    <ModalTitle>
                        <Share2 size={24} />
                        Share Appointment{appointmentsToShare.length > 1 ? 's' : ''}
                    </ModalTitle>
                    <CloseButton onClick={onClose}>
                        <X size={20} />
                    </CloseButton>
                </ModalHeader>

                <ModalBody>
                    {appointmentsToShare.length > 0 && (
                        <AppointmentInfo>
                            <InfoLabel>Sharing:</InfoLabel>
                            {appointmentsToShare.length === 1 ? (
                                <InfoValue>
                                    {appointmentsToShare[0].pet?.name || 'Unknown'} - {appointmentsToShare[0].start_time} to {appointmentsToShare[0].end_time}
                                </InfoValue>
                            ) : (
                                <InfoValue>
                                    {appointmentsToShare.length} appointments
                                </InfoValue>
                            )}
                        </AppointmentInfo>
                    )}

                    {connections.length === 0 ? (
                        <EmptyState>
                            <Users size={48} style={{ opacity: 0.3 }} />
                            <EmptyText>No team members yet</EmptyText>
                            <EmptySubtext>Add connections in the Team page first</EmptySubtext>
                        </EmptyState>
                    ) : (
                        <>
                            <SectionLabel>Select team member:</SectionLabel>
                            <ConnectionsList>
                                {connections.map(connection => (
                                    <ConnectionCard
                                        key={connection.id}
                                        selected={selectedUserId === connection.other_user.id}
                                        onClick={() => setSelectedUserId(connection.other_user.id)}
                                    >
                                        <ConnectionName>{connection.other_user.name}</ConnectionName>
                                        <ConnectionUsername>@{connection.other_user.username}</ConnectionUsername>
                                    </ConnectionCard>
                                ))}
                            </ConnectionsList>
                        </>
                    )}
                </ModalBody>

                {connections.length > 0 && (
                    <ModalFooter>
                        <CancelButton onClick={onClose}>Cancel</CancelButton>
                        <ShareButton onClick={handleShare} disabled={!selectedUserId || isSharing}>
                            {isSharing ? "Sharing..." : "Share"}
                        </ShareButton>
                    </ModalFooter>
                )}
            </ModalContainer>
        </Overlay>
    );

    return ReactDOM.createPortal(modalContent, document.body);
}

// Styled Components
const Overlay = styled.div`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 20px;
`;

const ModalContainer = styled.div`
    background: white;
    border-radius: 12px;
    max-width: 500px;
    width: 100%;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid #e0e0e0;
`;

const ModalTitle = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: #333;
    display: flex;
    align-items: center;
    gap: 10px;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    color: #666;
    transition: color 0.2s;

    &:hover {
        color: #333;
    }
`;

const ModalBody = styled.div`
    padding: 24px;
    overflow-y: auto;
    flex: 1;
`;

const AppointmentInfo = styled.div`
    background: #f0f4ff;
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
`;

const InfoLabel = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: #667eea;
    text-transform: uppercase;
    margin-bottom: 4px;
`;

const InfoValue = styled.div`
    font-size: 14px;
    color: #333;
    font-weight: 500;
`;

const SectionLabel = styled.div`
    font-size: 14px;
    font-weight: 600;
    color: #333;
    margin-bottom: 12px;
`;

const ConnectionsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const ConnectionCard = styled.div`
    padding: 16px;
    background: ${props => props.selected ? '#f0f4ff' : '#f9f9f9'};
    border: 2px solid ${props => props.selected ? '#667eea' : '#e0e0e0'};
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        border-color: #667eea;
        background: #f0f4ff;
    }
`;

const ConnectionName = styled.div`
    font-weight: 600;
    font-size: 15px;
    color: #333;
    margin-bottom: 2px;
`;

const ConnectionUsername = styled.div`
    font-size: 13px;
    color: #666;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;
`;

const EmptyText = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #666;
    margin-top: 16px;
`;

const EmptySubtext = styled.div`
    font-size: 14px;
    color: #999;
    margin-top: 8px;
`;

const ModalFooter = styled.div`
    display: flex;
    gap: 12px;
    padding: 20px 24px;
    border-top: 1px solid #e0e0e0;
    justify-content: flex-end;
`;

const CancelButton = styled.button`
    padding: 10px 20px;
    background: #f3f4f6;
    color: #666;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #e5e7eb;
    }
`;

const ShareButton = styled.button`
    padding: 10px 20px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:disabled) {
        background: #5568d3;
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
`;
