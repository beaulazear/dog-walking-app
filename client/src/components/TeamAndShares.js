import React, { useState, useEffect } from "react";
import styled from "styled-components";
import toast from 'react-hot-toast';
import dayjs from "dayjs";
import { Users, UserPlus, Search, Check, X, Trash2, Share2, Clock, MapPin, DollarSign, Dog } from "lucide-react";

export default function TeamAndShares() {
    const [connections, setConnections] = useState([]);
    const [shares, setShares] = useState({
        received_pending: [],
        received_all: [],
        sent: []
    });
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("team"); // "team", "requests", "appointments", "history"

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
    }, []);

    const fetchData = async () => {
        await Promise.all([fetchConnections(), fetchShares()]);
        setIsLoading(false);
    };

    const fetchConnections = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/walker_connections", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setConnections(data);
            } else {
                toast.error("Failed to load connections");
            }
        } catch (error) {
            console.error("Error fetching connections:", error);
        }
    };

    const fetchShares = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/appointment_shares", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setShares(data);
            } else {
                toast.error("Failed to load shared appointments");
            }
        } catch (error) {
            console.error("Error fetching shares:", error);
        }
    };

    const handleSearchUser = async (e) => {
        e.preventDefault();
        if (!searchEmail.trim()) {
            toast.error("Please enter an email address");
            return;
        }

        setIsSearching(true);
        setSearchResult(null);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/users/search?email=${encodeURIComponent(searchEmail)}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResult(data);
            } else {
                const error = await response.json();
                toast.error(error.error || "User not found");
            }
        } catch (error) {
            console.error("Error searching user:", error);
            toast.error("Error searching for user");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSendRequest = async (userId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/walker_connections", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ connected_user_id: userId })
            });

            if (response.ok) {
                toast.success("Connection request sent!");
                setSearchResult(null);
                setSearchEmail("");
                fetchConnections();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to send request");
            }
        } catch (error) {
            console.error("Error sending connection request:", error);
            toast.error("Error sending request");
        }
    };

    const handleAcceptConnection = async (connectionId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/walker_connections/${connectionId}/accept`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success("Connection accepted!");
                fetchConnections();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to accept connection");
            }
        } catch (error) {
            console.error("Error accepting connection:", error);
            toast.error("Error accepting connection");
        }
    };

    const handleDeclineConnection = async (connectionId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/walker_connections/${connectionId}/decline`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success("Connection declined");
                fetchConnections();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to decline connection");
            }
        } catch (error) {
            console.error("Error declining connection:", error);
            toast.error("Error declining connection");
        }
    };

    const handleRemoveConnection = async (connectionId) => {
        if (!window.confirm("Remove this connection?")) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/walker_connections/${connectionId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success("Connection removed");
                fetchConnections();
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to remove connection");
            }
        } catch (error) {
            console.error("Error removing connection:", error);
            toast.error("Error removing connection");
        }
    };

    const handleAcceptShare = async (shareId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/appointment_shares/${shareId}/accept`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
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

    const handleDeclineShare = async (shareId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/appointment_shares/${shareId}/decline`, {
                method: "PATCH",
                headers: { "Authorization": `Bearer ${token}` }
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

    const handleCancelShare = async (shareId) => {
        if (!window.confirm("Cancel this share?")) return;

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/appointment_shares/${shareId}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
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

    const acceptedConnections = connections.filter(c => c.status === "accepted");
    const pendingReceived = connections.filter(c => c.status === "pending" && !c.initiated_by_me);
    const pendingSent = connections.filter(c => c.status === "pending" && c.initiated_by_me);

    if (isLoading) {
        return (
            <Container>
                <Content>
                    <LoadingText>Loading...</LoadingText>
                </Content>
            </Container>
        );
    }

    return (
        <Container>
            <Content>
                <Header>
                    <Title>
                        <Users size={24} />
                        Team & Shares
                    </Title>
                    <Subtitle>Manage your team and shared appointments</Subtitle>
                </Header>

                {/* Search Section - Always visible at top */}
                <SearchSection>
                    <SearchForm onSubmit={handleSearchUser}>
                        <SearchInputWrapper>
                            <Search size={18} />
                            <SearchInput
                                type="email"
                                placeholder="Search walkers by email..."
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                            />
                        </SearchInputWrapper>
                        <SearchButton type="submit" disabled={isSearching}>
                            {isSearching ? "..." : "Search"}
                        </SearchButton>
                    </SearchForm>

                    {searchResult && (
                        <SearchResultCard>
                            <UserInfo>
                                <UserName>{searchResult.name}</UserName>
                                <UserEmail>@{searchResult.username}</UserEmail>
                            </UserInfo>
                            <SendButton onClick={() => handleSendRequest(searchResult.id)}>
                                <UserPlus size={16} />
                                <span>Send</span>
                            </SendButton>
                        </SearchResultCard>
                    )}
                </SearchSection>

                {/* Tab Navigation */}
                <TabContainer>
                    <Tab
                        $active={activeTab === "team"}
                        onClick={() => setActiveTab("team")}
                    >
                        <TabLabel>Team</TabLabel>
                        <TabCount>{acceptedConnections.length}</TabCount>
                    </Tab>
                    <Tab
                        $active={activeTab === "requests"}
                        onClick={() => setActiveTab("requests")}
                    >
                        <TabLabel>Requests</TabLabel>
                        <TabCount>{pendingReceived.length + pendingSent.length}</TabCount>
                    </Tab>
                    <Tab
                        $active={activeTab === "appointments"}
                        onClick={() => setActiveTab("appointments")}
                    >
                        <TabLabel>Walks</TabLabel>
                        <TabCount>{shares.received_pending.length}</TabCount>
                    </Tab>
                    <Tab
                        $active={activeTab === "history"}
                        onClick={() => setActiveTab("history")}
                    >
                        <TabLabel>History</TabLabel>
                        <TabCount>{shares.received_all.length + shares.sent.length}</TabCount>
                    </Tab>
                </TabContainer>

                {/* Tab Content */}
                <ContentSection>
                    {activeTab === "team" && (
                        <>
                            {acceptedConnections.length === 0 ? (
                                <EmptyState>
                                    <Users size={48} />
                                    <EmptyText>No team members yet</EmptyText>
                                    <EmptySubtext>Search for walkers above to build your team</EmptySubtext>
                                </EmptyState>
                            ) : (
                                <List>
                                    {acceptedConnections.map(connection => (
                                        <Card key={connection.id}>
                                            <CardContent>
                                                <UserInfo>
                                                    <UserName>{connection.other_user.name}</UserName>
                                                    <UserEmail>@{connection.other_user.username}</UserEmail>
                                                </UserInfo>
                                                <RemoveButton onClick={() => handleRemoveConnection(connection.id)}>
                                                    <Trash2 size={16} />
                                                </RemoveButton>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </List>
                            )}
                        </>
                    )}

                    {activeTab === "requests" && (
                        <>
                            {pendingReceived.length === 0 && pendingSent.length === 0 ? (
                                <EmptyState>
                                    <UserPlus size={48} />
                                    <EmptyText>No pending requests</EmptyText>
                                </EmptyState>
                            ) : (
                                <>
                                    {pendingReceived.length > 0 && (
                                        <>
                                            <Subsection>Received</Subsection>
                                            <List>
                                                {pendingReceived.map(connection => (
                                                    <Card key={connection.id}>
                                                        <CardContent>
                                                            <UserInfo>
                                                                <UserName>{connection.other_user.name}</UserName>
                                                                <UserEmail>@{connection.other_user.username}</UserEmail>
                                                            </UserInfo>
                                                            <ActionButtons>
                                                                <AcceptButton onClick={() => handleAcceptConnection(connection.id)}>
                                                                    <Check size={16} />
                                                                </AcceptButton>
                                                                <DeclineButton onClick={() => handleDeclineConnection(connection.id)}>
                                                                    <X size={16} />
                                                                </DeclineButton>
                                                            </ActionButtons>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </List>
                                        </>
                                    )}

                                    {pendingSent.length > 0 && (
                                        <>
                                            <Subsection>Sent</Subsection>
                                            <List>
                                                {pendingSent.map(connection => (
                                                    <Card key={connection.id}>
                                                        <CardContent>
                                                            <UserInfo>
                                                                <UserName>{connection.other_user.name}</UserName>
                                                                <UserEmail>@{connection.other_user.username}</UserEmail>
                                                                <PendingBadge>Awaiting response</PendingBadge>
                                                            </UserInfo>
                                                            <CancelButton onClick={() => handleRemoveConnection(connection.id)}>
                                                                <X size={16} />
                                                            </CancelButton>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </List>
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}

                    {activeTab === "appointments" && (
                        <>
                            {shares.received_pending.length === 0 ? (
                                <EmptyState>
                                    <Share2 size={48} />
                                    <EmptyText>No pending walks</EmptyText>
                                    <EmptySubtext>Shared walks will appear here</EmptySubtext>
                                </EmptyState>
                            ) : (
                                <List>
                                    {shares.received_pending.map(share => (
                                        <AppointmentCard key={share.id}>
                                            <AppointmentHeader>
                                                <FromBadge>
                                                    <Share2 size={12} />
                                                    From {share.other_user.name}
                                                </FromBadge>
                                            </AppointmentHeader>

                                            <AppointmentBody>
                                                <DetailRow>
                                                    <Dog size={16} />
                                                    <DetailText>{share.appointment.pet.name}</DetailText>
                                                </DetailRow>
                                                <DetailRow>
                                                    <Clock size={16} />
                                                    <DetailText>
                                                        {dayjs(share.appointment.appointment_date).format('MMM D')} • {share.appointment.start_time}
                                                    </DetailText>
                                                </DetailRow>
                                                <DetailRow>
                                                    <MapPin size={16} />
                                                    <DetailText>{share.appointment.pet.address || 'No address'}</DetailText>
                                                </DetailRow>
                                                <DetailRow>
                                                    <DollarSign size={16} />
                                                    <DetailText>${share.appointment.price}</DetailText>
                                                </DetailRow>

                                                {share.appointment.pet.behavioral_notes && (
                                                    <NotesBox>
                                                        <NotesLabel>Notes</NotesLabel>
                                                        <NotesText>{share.appointment.pet.behavioral_notes}</NotesText>
                                                    </NotesBox>
                                                )}
                                            </AppointmentBody>

                                            <AppointmentActions>
                                                <AcceptWalkButton onClick={() => handleAcceptShare(share.id)}>
                                                    <Check size={16} />
                                                    Accept
                                                </AcceptWalkButton>
                                                <DeclineWalkButton onClick={() => handleDeclineShare(share.id)}>
                                                    <X size={16} />
                                                    Decline
                                                </DeclineWalkButton>
                                            </AppointmentActions>
                                        </AppointmentCard>
                                    ))}
                                </List>
                            )}
                        </>
                    )}

                    {activeTab === "history" && (
                        <>
                            {shares.received_all.length === 0 && shares.sent.length === 0 ? (
                                <EmptyState>
                                    <Share2 size={48} />
                                    <EmptyText>No history</EmptyText>
                                </EmptyState>
                            ) : (
                                <>
                                    {shares.received_all.length > 0 && (
                                        <>
                                            <Subsection>Received</Subsection>
                                            <List>
                                                {shares.received_all.map(share => (
                                                    <HistoryCard key={share.id} $status={share.status}>
                                                        <HistoryHeader>
                                                            <UserName>From {share.other_user.name}</UserName>
                                                            <StatusBadge $status={share.status}>{share.status}</StatusBadge>
                                                        </HistoryHeader>
                                                        <HistoryDetails>
                                                            <Dog size={14} />
                                                            <span>{share.appointment.pet.name}</span>
                                                            <span>•</span>
                                                            <span>{dayjs(share.appointment.appointment_date).format('MMM D')}</span>
                                                            <span>•</span>
                                                            <span>${share.appointment.price}</span>
                                                        </HistoryDetails>
                                                    </HistoryCard>
                                                ))}
                                            </List>
                                        </>
                                    )}

                                    {shares.sent.length > 0 && (
                                        <>
                                            <Subsection>Sent</Subsection>
                                            <List>
                                                {shares.sent.map(share => (
                                                    <HistoryCard key={share.id} $status={share.status}>
                                                        <HistoryHeader>
                                                            <UserName>To {share.other_user.name}</UserName>
                                                            <StatusBadge $status={share.status}>{share.status}</StatusBadge>
                                                        </HistoryHeader>
                                                        <HistoryDetails>
                                                            <Dog size={14} />
                                                            <span>{share.appointment.pet.name}</span>
                                                            <span>•</span>
                                                            <span>{dayjs(share.appointment.appointment_date).format('MMM D')}</span>
                                                            <span>•</span>
                                                            <span>${share.appointment.price}</span>
                                                        </HistoryDetails>
                                                        {share.status === 'pending' && (
                                                            <CancelShareButton onClick={() => handleCancelShare(share.id)}>
                                                                <X size={14} />
                                                                Cancel
                                                            </CancelShareButton>
                                                        )}
                                                    </HistoryCard>
                                                ))}
                                            </List>
                                        </>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </ContentSection>
            </Content>
        </Container>
    );
}

// Styled Components
const Container = styled.div`
    min-height: 100vh;
    padding: 20px 16px 100px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    @media (min-width: 768px) {
        padding: 24px 20px 100px;
    }
`;

const Content = styled.div`
    max-width: 448px;
    margin: 0 auto;
`;

const LoadingText = styled.div`
    text-align: center;
    color: white;
    font-size: 18px;
    padding: 40px;
`;

const Header = styled.div`
    margin-bottom: 20px;
    text-align: center;

    @media (min-width: 768px) {
        margin-bottom: 30px;
    }
`;

const Title = styled.h1`
    color: white;
    font-size: 26px;
    font-weight: 700;
    margin-bottom: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;

    @media (min-width: 768px) {
        font-size: 32px;
    }
`;

const Subtitle = styled.p`
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin: 0;

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;

const SearchSection = styled.div`
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

    @media (min-width: 768px) {
        padding: 20px;
        margin-bottom: 20px;
    }
`;

const SearchForm = styled.form`
    display: flex;
    gap: 8px;

    @media (min-width: 768px) {
        gap: 12px;
    }
`;

const SearchInputWrapper = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: #f9f9f9;

    svg {
        color: #999;
        flex-shrink: 0;
    }

    @media (min-width: 768px) {
        padding: 12px 16px;
    }
`;

const SearchInput = styled.input`
    flex: 1;
    border: none;
    background: transparent;
    font-size: 14px;
    outline: none;
    color: #333;
    min-width: 0;

    &::placeholder {
        color: #999;
    }

    @media (min-width: 768px) {
        font-size: 15px;
    }
`;

const SearchButton = styled.button`
    padding: 10px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover:not(:disabled) {
        background: #5568d3;
        transform: translateY(-1px);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (min-width: 768px) {
        padding: 12px 24px;
        font-size: 15px;
    }
`;

const SearchResultCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin-top: 12px;
    background: #f0f4ff;
    border: 2px solid #667eea;
    border-radius: 8px;

    @media (min-width: 768px) {
        padding: 16px;
    }
`;

const SendButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;

    &:hover {
        background: #5568d3;
        transform: translateY(-1px);
    }

    span {
        display: none;
    }

    @media (min-width: 768px) {
        padding: 10px 16px;

        span {
            display: inline;
        }
    }
`;

const TabContainer = styled.div`
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    margin-bottom: 16px;

    @media (min-width: 768px) {
        gap: 8px;
        margin-bottom: 20px;
    }
`;

const Tab = styled.button`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 6px;
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

    @media (min-width: 768px) {
        padding: 12px 10px;
    }
`;

const TabLabel = styled.span`
    font-size: 12px;

    @media (min-width: 768px) {
        font-size: 14px;
    }
`;

const TabCount = styled.span`
    font-size: 16px;
    font-weight: 700;

    @media (min-width: 768px) {
        font-size: 18px;
    }
`;

const ContentSection = styled.div`
    background: white;
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    min-height: 200px;

    @media (min-width: 768px) {
        padding: 24px;
    }
`;

const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;

    @media (min-width: 768px) {
        gap: 12px;
    }
`;

const Card = styled.div`
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s;

    &:hover {
        border-color: #667eea;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    }

    @media (min-width: 768px) {
        padding: 16px;
    }
`;

const CardContent = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
`;

const UserInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
    flex: 1;
`;

const UserName = styled.div`
    font-weight: 600;
    font-size: 15px;
    color: #333;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (min-width: 768px) {
        font-size: 16px;
    }
`;

const UserEmail = styled.div`
    font-size: 13px;
    color: #666;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    @media (min-width: 768px) {
        font-size: 14px;
    }
`;

const PendingBadge = styled.div`
    display: inline-block;
    padding: 3px 8px;
    background: #fef3c7;
    color: #92400e;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    width: fit-content;

    @media (min-width: 768px) {
        font-size: 12px;
    }
`;

const ActionButtons = styled.div`
    display: flex;
    gap: 6px;
    flex-shrink: 0;

    @media (min-width: 768px) {
        gap: 8px;
    }
`;

const AcceptButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: #10b981;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 36px;
    height: 36px;

    &:hover {
        background: #059669;
        transform: translateY(-1px);
    }

    @media (min-width: 768px) {
        min-width: 40px;
        height: 40px;
    }
`;

const DeclineButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 36px;
    height: 36px;

    &:hover {
        background: #dc2626;
        transform: translateY(-1px);
    }

    @media (min-width: 768px) {
        min-width: 40px;
        height: 40px;
    }
`;

const RemoveButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    background: #f3f4f6;
    color: #666;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 36px;
    height: 36px;

    &:hover {
        background: #fee;
        color: #ef4444;
        border-color: #ef4444;
    }

    @media (min-width: 768px) {
        min-width: 40px;
        height: 40px;
    }
`;

const CancelButton = styled(RemoveButton)``;

const Subsection = styled.h3`
    font-size: 14px;
    font-weight: 600;
    color: #667eea;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;

    &:not(:first-child) {
        margin-top: 24px;
    }

    @media (min-width: 768px) {
        font-size: 15px;
    }
`;

const AppointmentCard = styled.div`
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s;

    &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    @media (min-width: 768px) {
        padding: 16px;
    }
`;

const AppointmentHeader = styled.div`
    margin-bottom: 12px;
`;

const FromBadge = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: rgba(102, 126, 234, 0.1);
    color: #667eea;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;

    @media (min-width: 768px) {
        font-size: 13px;
    }
`;

const AppointmentBody = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
`;

const DetailRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    color: #555;

    svg {
        color: #667eea;
        flex-shrink: 0;
    }

    @media (min-width: 768px) {
        font-size: 14px;
    }
`;

const DetailText = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const NotesBox = styled.div`
    margin-top: 4px;
    padding: 10px;
    background: white;
    border-radius: 6px;
    border: 1px solid #e0e0e0;

    @media (min-width: 768px) {
        padding: 12px;
    }
`;

const NotesLabel = styled.div`
    font-size: 11px;
    font-weight: 600;
    color: #667eea;
    text-transform: uppercase;
    margin-bottom: 4px;

    @media (min-width: 768px) {
        font-size: 12px;
    }
`;

const NotesText = styled.div`
    font-size: 12px;
    color: #333;
    line-height: 1.5;

    @media (min-width: 768px) {
        font-size: 13px;
    }
`;

const AppointmentActions = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;

    @media (min-width: 768px) {
        gap: 10px;
    }
`;

const AcceptWalkButton = styled.button`
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
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #059669;
        transform: translateY(-1px);
    }

    @media (min-width: 768px) {
        padding: 12px;
        font-size: 15px;
    }
`;

const DeclineWalkButton = styled.button`
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
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #dc2626;
        transform: translateY(-1px);
    }

    @media (min-width: 768px) {
        padding: 12px;
        font-size: 15px;
    }
`;

const HistoryCard = styled.div`
    background: ${props => props.$status === 'declined' ? '#fef2f2' : '#f9f9f9'};
    border: 1px solid ${props =>
        props.$status === 'accepted' ? '#10b981' :
        props.$status === 'declined' ? '#fecaca' : '#e0e0e0'
    };
    border-radius: 8px;
    padding: 12px;
    transition: all 0.2s;

    @media (min-width: 768px) {
        padding: 14px;
    }
`;

const HistoryHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 12px;
`;

const StatusBadge = styled.div`
    padding: 3px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: capitalize;
    white-space: nowrap;
    background: ${props => {
        switch (props.$status) {
            case 'accepted': return '#d1fae5';
            case 'declined': return '#fee2e2';
            case 'pending': return '#fef3c7';
            default: return '#f3f4f6';
        }
    }};
    color: ${props => {
        switch (props.$status) {
            case 'accepted': return '#065f46';
            case 'declined': return '#991b1b';
            case 'pending': return '#92400e';
            default: return '#1f2937';
        }
    }};

    @media (min-width: 768px) {
        font-size: 12px;
    }
`;

const HistoryDetails = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #666;
    flex-wrap: wrap;

    svg {
        color: #667eea;
    }

    @media (min-width: 768px) {
        font-size: 13px;
        gap: 8px;
    }
`;

const CancelShareButton = styled.button`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    margin-top: 8px;
    background: #f3f4f6;
    color: #666;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #fee;
        color: #ef4444;
        border-color: #ef4444;
    }

    @media (min-width: 768px) {
        font-size: 13px;
        padding: 8px 14px;
    }
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    text-align: center;

    svg {
        color: #ccc;
        margin-bottom: 12px;
    }

    @media (min-width: 768px) {
        padding: 60px 20px;

        svg {
            margin-bottom: 16px;
        }
    }
`;

const EmptyText = styled.div`
    font-size: 16px;
    font-weight: 600;
    color: #666;
    margin-bottom: 6px;

    @media (min-width: 768px) {
        font-size: 18px;
        margin-bottom: 8px;
    }
`;

const EmptySubtext = styled.div`
    font-size: 13px;
    color: #999;
    max-width: 300px;

    @media (min-width: 768px) {
        font-size: 14px;
        max-width: 400px;
    }
`;
