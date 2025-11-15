import React, { useState, useEffect } from "react";
import styled from "styled-components";
import toast from 'react-hot-toast';
import dayjs from "dayjs";
import { Share2, Check, X, MapPin, Clock, DollarSign, User, Dog } from "lucide-react";

export default function SharedAppointments() {
    const [shares, setShares] = useState({
        received_pending: [],
        received_all: [],
        sent: []
    });
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("pending"); // "pending" or "history" or "sent"

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchShares();
    }, []);

    const fetchShares = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/appointment_shares", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setShares(data);
            } else {
                toast.error("Failed to load shared appointments");
            }
        } catch (error) {
            console.error("Error fetching shares:", error);
            toast.error("Error loading shared appointments");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (shareId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/appointment_shares/${shareId}/accept`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Appointment accepted!");
                fetchShares();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to accept");
            }
        } catch (error) {
            console.error("Error accepting share:", error);
            toast.error("Error accepting appointment");
        }
    };

    const handleDecline = async (shareId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/appointment_shares/${shareId}/decline`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Appointment declined");
                fetchShares();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to decline");
            }
        } catch (error) {
            console.error("Error declining share:", error);
            toast.error("Error declining appointment");
        }
    };

    const handleCancel = async (shareId) => {
        if (!window.confirm("Cancel this share?")) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/appointment_shares/${shareId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Share cancelled");
                fetchShares();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to cancel");
            }
        } catch (error) {
            console.error("Error cancelling share:", error);
            toast.error("Error cancelling share");
        }
    };

    if (isLoading) {
        return (
            <Container>
                <Content>
                    <LoadingText>Loading shared appointments...</LoadingText>
                </Content>
            </Container>
        );
    }

    return (
        <Container>
            <Content>
                <Header>
                    <Title>
                        <Share2 size={28} />
                        Shared Appointments
                    </Title>
                    <Subtitle>Manage appointments shared with your team</Subtitle>
                </Header>

                <TabContainer>
                    <Tab $active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>
                        Pending ({shares.received_pending.length})
                    </Tab>
                    <Tab $active={activeTab === "history"} onClick={() => setActiveTab("history")}>
                        History ({shares.received_all.length})
                    </Tab>
                    <Tab $active={activeTab === "sent"} onClick={() => setActiveTab("sent")}>
                        Sent ({shares.sent.length})
                    </Tab>
                </TabContainer>

                <Section>
                    {activeTab === "pending" && (
                        <>
                            {shares.received_pending.length === 0 ? (
                                <EmptyState>
                                    <Share2 size={48} style={{ opacity: 0.3 }} />
                                    <EmptyText>No pending invitations</EmptyText>
                                    <EmptySubtext>When team members share appointments with you, they'll appear here</EmptySubtext>
                                </EmptyState>
                            ) : (
                                <SharesList>
                                    {shares.received_pending.map(share => (
                                        <ShareCard key={share.id}>
                                            <ShareHeader>
                                                <UserBadge>
                                                    <User size={14} />
                                                    From {share.other_user.name}
                                                </UserBadge>
                                                <StatusBadge status="pending">Pending</StatusBadge>
                                            </ShareHeader>

                                            <AppointmentDetails>
                                                <DetailRow>
                                                    <Dog size={16} />
                                                    <strong>{share.appointment.pet.name}</strong>
                                                </DetailRow>
                                                <DetailRow>
                                                    <Clock size={16} />
                                                    {dayjs(share.appointment.appointment_date).format('MMM D, YYYY')} • {share.appointment.start_time} - {share.appointment.end_time}
                                                </DetailRow>
                                                <DetailRow>
                                                    <MapPin size={16} />
                                                    {share.appointment.pet.address || 'No address'}
                                                </DetailRow>
                                                <DetailRow>
                                                    <DollarSign size={16} />
                                                    ${share.appointment.price}
                                                </DetailRow>

                                                {share.appointment.pet.behavioral_notes && (
                                                    <NotesSection>
                                                        <NotesLabel>Notes:</NotesLabel>
                                                        <NotesText>{share.appointment.pet.behavioral_notes}</NotesText>
                                                    </NotesSection>
                                                )}

                                                {share.appointment.pet.supplies_location && (
                                                    <NotesSection>
                                                        <NotesLabel>Supplies:</NotesLabel>
                                                        <NotesText>{share.appointment.pet.supplies_location}</NotesText>
                                                    </NotesSection>
                                                )}
                                            </AppointmentDetails>

                                            <ShareActions>
                                                <AcceptButton onClick={() => handleAccept(share.id)}>
                                                    <Check size={16} />
                                                    Accept
                                                </AcceptButton>
                                                <DeclineButton onClick={() => handleDecline(share.id)}>
                                                    <X size={16} />
                                                    Decline
                                                </DeclineButton>
                                            </ShareActions>
                                        </ShareCard>
                                    ))}
                                </SharesList>
                            )}
                        </>
                    )}

                    {activeTab === "history" && (
                        <>
                            {shares.received_all.length === 0 ? (
                                <EmptyState>
                                    <Share2 size={48} style={{ opacity: 0.3 }} />
                                    <EmptyText>No shared appointments</EmptyText>
                                </EmptyState>
                            ) : (
                                <SharesList>
                                    {shares.received_all.map(share => (
                                        <ShareCard key={share.id} status={share.status}>
                                            <ShareHeader>
                                                <UserBadge>
                                                    <User size={14} />
                                                    From {share.other_user.name}
                                                </UserBadge>
                                                <StatusBadge status={share.status}>{share.status}</StatusBadge>
                                            </ShareHeader>

                                            <AppointmentDetails>
                                                <DetailRow>
                                                    <Dog size={16} />
                                                    <strong>{share.appointment.pet.name}</strong>
                                                </DetailRow>
                                                <DetailRow>
                                                    <Clock size={16} />
                                                    {dayjs(share.appointment.appointment_date).format('MMM D, YYYY')} • {share.appointment.start_time} - {share.appointment.end_time}
                                                </DetailRow>
                                                <DetailRow>
                                                    <DollarSign size={16} />
                                                    ${share.appointment.price}
                                                </DetailRow>
                                            </AppointmentDetails>
                                        </ShareCard>
                                    ))}
                                </SharesList>
                            )}
                        </>
                    )}

                    {activeTab === "sent" && (
                        <>
                            {shares.sent.length === 0 ? (
                                <EmptyState>
                                    <Share2 size={48} style={{ opacity: 0.3 }} />
                                    <EmptyText>No sent shares</EmptyText>
                                    <EmptySubtext>Share appointments with your team from the Today's Walks page</EmptySubtext>
                                </EmptyState>
                            ) : (
                                <SharesList>
                                    {shares.sent.map(share => (
                                        <ShareCard key={share.id}>
                                            <ShareHeader>
                                                <UserBadge>
                                                    <User size={14} />
                                                    To {share.other_user.name}
                                                </UserBadge>
                                                <StatusBadge status={share.status}>{share.status}</StatusBadge>
                                            </ShareHeader>

                                            <AppointmentDetails>
                                                <DetailRow>
                                                    <Dog size={16} />
                                                    <strong>{share.appointment.pet.name}</strong>
                                                </DetailRow>
                                                <DetailRow>
                                                    <Clock size={16} />
                                                    {dayjs(share.appointment.appointment_date).format('MMM D, YYYY')} • {share.appointment.start_time} - {share.appointment.end_time}
                                                </DetailRow>
                                                <DetailRow>
                                                    <DollarSign size={16} />
                                                    ${share.appointment.price}
                                                </DetailRow>
                                            </AppointmentDetails>

                                            {share.status === 'pending' && (
                                                <ShareActions>
                                                    <CancelButton onClick={() => handleCancel(share.id)}>
                                                        <X size={16} />
                                                        Cancel Share
                                                    </CancelButton>
                                                </ShareActions>
                                            )}
                                        </ShareCard>
                                    ))}
                                </SharesList>
                            )}
                        </>
                    )}
                </Section>
            </Content>
        </Container>
    );
}

// Styled Components
const Container = styled.div`
    min-height: 100vh;
    padding: 100px 20px 40px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Content = styled.div`
    max-width: 900px;
    margin: 0 auto;
`;

const LoadingText = styled.div`
    text-align: center;
    color: white;
    font-size: 18px;
    padding: 40px;
`;

const Header = styled.div`
    margin-bottom: 30px;
    text-align: center;
`;

const Title = styled.h1`
    color: white;
    font-size: 32px;
    font-weight: bold;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
`;

const Subtitle = styled.p`
    color: rgba(255, 255, 255, 0.9);
    font-size: 16px;
`;

const TabContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
`;

const Tab = styled.button`
    flex: 1;
    padding: 12px;
    background: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.3)'};
    color: ${props => props.$active ? '#667eea' : 'white'};
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: ${props => props.$active ? 'white' : 'rgba(255, 255, 255, 0.4)'};
    }
`;

const Section = styled.div`
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const SharesList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

const ShareCard = styled.div`
    background: ${props => props.status === 'declined' ? '#fef2f2' : '#f9f9f9'};
    border: 1px solid ${props => props.status === 'accepted' ? '#10b981' : props.status === 'declined' ? '#fecaca' : '#e0e0e0'};
    border-radius: 8px;
    padding: 16px;
    transition: all 0.2s;

    &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }
`;

const ShareHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
`;

const UserBadge = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: #666;
`;

const StatusBadge = styled.div`
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: capitalize;
    background: ${props => {
        switch (props.status) {
            case 'accepted': return '#d1fae5';
            case 'declined': return '#fee2e2';
            case 'pending': return '#fef3c7';
            default: return '#f3f4f6';
        }
    }};
    color: ${props => {
        switch (props.status) {
            case 'accepted': return '#065f46';
            case 'declined': return '#991b1b';
            case 'pending': return '#92400e';
            default: return '#1f2937';
        }
    }};
`;

const AppointmentDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
`;

const DetailRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #555;

    svg {
        color: #667eea;
        flex-shrink: 0;
    }
`;

const NotesSection = styled.div`
    margin-top: 8px;
    padding: 12px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e0e0e0;
`;

const NotesLabel = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: #667eea;
    text-transform: uppercase;
    margin-bottom: 4px;
`;

const NotesText = styled.div`
    font-size: 13px;
    color: #333;
    line-height: 1.5;
`;

const ShareActions = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 12px;
`;

const AcceptButton = styled.button`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #059669;
        transform: translateY(-1px);
    }
`;

const DeclineButton = styled.button`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #dc2626;
        transform: translateY(-1px);
    }
`;

const CancelButton = styled.button`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px;
    background: #f3f4f6;
    color: #666;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #fee;
        color: #ef4444;
        border-color: #ef4444;
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
`;

const EmptyText = styled.div`
    font-size: 18px;
    font-weight: 600;
    color: #666;
    margin-top: 16px;
`;

const EmptySubtext = styled.div`
    font-size: 14px;
    color: #999;
    margin-top: 8px;
    max-width: 400px;
`;
