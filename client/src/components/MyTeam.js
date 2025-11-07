import React, { useState, useEffect } from "react";
import styled from "styled-components";
import toast from 'react-hot-toast';
import { Users, UserPlus, Search, Check, X, Trash2, UserX } from "lucide-react";

export default function MyTeam() {
    const [connections, setConnections] = useState([]);
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("team"); // "team" or "pending"

    useEffect(() => {
        fetchConnections();
    }, []);

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
                setConnections(data);
            } else {
                toast.error("Failed to load connections");
            }
        } catch (error) {
            console.error("Error fetching connections:", error);
            toast.error("Error loading connections");
        } finally {
            setIsLoading(false);
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
                headers: {
                    "Authorization": `Bearer ${token}`
                }
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
                body: JSON.stringify({
                    connected_user_id: userId
                })
            });

            if (response.ok) {
                const data = await response.json();
                setConnections([...connections, data]);
                toast.success("Connection request sent!");
                setSearchResult(null);
                setSearchEmail("");
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to send request");
            }
        } catch (error) {
            console.error("Error sending connection request:", error);
            toast.error("Error sending request");
        }
    };

    const handleAccept = async (connectionId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/walker_connections/${connectionId}/accept`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
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

    const handleDecline = async (connectionId) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/walker_connections/${connectionId}/decline`, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
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

    const handleRemove = async (connectionId) => {
        if (!window.confirm("Are you sure you want to remove this connection?")) {
            return;
        }

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/walker_connections/${connectionId}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                toast.success("Connection removed");
                setConnections(connections.filter(c => c.id !== connectionId));
            } else {
                const error = await response.json();
                toast.error(error.error || "Failed to remove connection");
            }
        } catch (error) {
            console.error("Error removing connection:", error);
            toast.error("Error removing connection");
        }
    };

    const acceptedConnections = connections.filter(c => c.status === "accepted");
    const pendingReceived = connections.filter(c => c.status === "pending" && !c.initiated_by_me);
    const pendingSent = connections.filter(c => c.status === "pending" && c.initiated_by_me);

    if (isLoading) {
        return (
            <Container>
                <Content>
                    <LoadingText>Loading connections...</LoadingText>
                </Content>
            </Container>
        );
    }

    return (
        <Container>
            <Content>
                <Header>
                    <Title>
                        <Users size={28} />
                        My Team
                    </Title>
                    <Subtitle>Connect with other dog walkers to share appointments</Subtitle>
                </Header>

                <Section>
                    <SectionTitle>
                        <UserPlus size={20} />
                        Add New Connection
                    </SectionTitle>
                    <SearchForm onSubmit={handleSearchUser}>
                        <SearchInputWrapper>
                            <Search size={18} />
                            <SearchInput
                                type="email"
                                placeholder="Search by email address..."
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                            />
                        </SearchInputWrapper>
                        <SearchButton type="submit" disabled={isSearching}>
                            {isSearching ? "Searching..." : "Search"}
                        </SearchButton>
                    </SearchForm>

                    {searchResult && (
                        <SearchResultCard>
                            <UserInfo>
                                <UserName>{searchResult.name}</UserName>
                                <UserDetail>@{searchResult.username}</UserDetail>
                                <UserDetail>{searchResult.email_address}</UserDetail>
                            </UserInfo>
                            <ActionButton onClick={() => handleSendRequest(searchResult.id)}>
                                <UserPlus size={16} />
                                Send Request
                            </ActionButton>
                        </SearchResultCard>
                    )}
                </Section>

                <TabContainer>
                    <Tab $active={activeTab === "team"} onClick={() => setActiveTab("team")}>
                        My Team ({acceptedConnections.length})
                    </Tab>
                    <Tab $active={activeTab === "pending"} onClick={() => setActiveTab("pending")}>
                        Pending ({pendingReceived.length + pendingSent.length})
                    </Tab>
                </TabContainer>

                {activeTab === "team" && (
                    <Section>
                        {acceptedConnections.length === 0 ? (
                            <EmptyState>
                                <Users size={48} style={{ opacity: 0.3 }} />
                                <EmptyText>No team members yet</EmptyText>
                                <EmptySubtext>Search for dog walkers by email to start building your team</EmptySubtext>
                            </EmptyState>
                        ) : (
                            <ConnectionsList>
                                {acceptedConnections.map(connection => (
                                    <ConnectionCard key={connection.id}>
                                        <UserInfo>
                                            <UserName>{connection.other_user.name}</UserName>
                                            <UserDetail>@{connection.other_user.username}</UserDetail>
                                            <UserDetail>{connection.other_user.email_address}</UserDetail>
                                        </UserInfo>
                                        <RemoveButton onClick={() => handleRemove(connection.id)}>
                                            <Trash2 size={16} />
                                            Remove
                                        </RemoveButton>
                                    </ConnectionCard>
                                ))}
                            </ConnectionsList>
                        )}
                    </Section>
                )}

                {activeTab === "pending" && (
                    <Section>
                        {pendingReceived.length === 0 && pendingSent.length === 0 ? (
                            <EmptyState>
                                <UserX size={48} style={{ opacity: 0.3 }} />
                                <EmptyText>No pending requests</EmptyText>
                            </EmptyState>
                        ) : (
                            <>
                                {pendingReceived.length > 0 && (
                                    <>
                                        <SubsectionTitle>Received Requests</SubsectionTitle>
                                        <ConnectionsList>
                                            {pendingReceived.map(connection => (
                                                <ConnectionCard key={connection.id}>
                                                    <UserInfo>
                                                        <UserName>{connection.other_user.name}</UserName>
                                                        <UserDetail>@{connection.other_user.username}</UserDetail>
                                                        <UserDetail>{connection.other_user.email_address}</UserDetail>
                                                    </UserInfo>
                                                    <ButtonGroup>
                                                        <AcceptButton onClick={() => handleAccept(connection.id)}>
                                                            <Check size={16} />
                                                            Accept
                                                        </AcceptButton>
                                                        <DeclineButton onClick={() => handleDecline(connection.id)}>
                                                            <X size={16} />
                                                            Decline
                                                        </DeclineButton>
                                                    </ButtonGroup>
                                                </ConnectionCard>
                                            ))}
                                        </ConnectionsList>
                                    </>
                                )}

                                {pendingSent.length > 0 && (
                                    <>
                                        <SubsectionTitle>Sent Requests</SubsectionTitle>
                                        <ConnectionsList>
                                            {pendingSent.map(connection => (
                                                <ConnectionCard key={connection.id}>
                                                    <UserInfo>
                                                        <UserName>{connection.other_user.name}</UserName>
                                                        <UserDetail>@{connection.other_user.username}</UserDetail>
                                                        <UserDetail>{connection.other_user.email_address}</UserDetail>
                                                        <PendingBadge>Awaiting response</PendingBadge>
                                                    </UserInfo>
                                                    <RemoveButton onClick={() => handleRemove(connection.id)}>
                                                        <X size={16} />
                                                        Cancel
                                                    </RemoveButton>
                                                </ConnectionCard>
                                            ))}
                                        </ConnectionsList>
                                    </>
                                )}
                            </>
                        )}
                    </Section>
                )}
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

const Section = styled.div`
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
    font-size: 20px;
    font-weight: 600;
    color: #333;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const SubsectionTitle = styled.h3`
    font-size: 16px;
    font-weight: 600;
    color: #555;
    margin-bottom: 12px;
    margin-top: 20px;
`;

const SearchForm = styled.form`
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
`;

const SearchInputWrapper = styled.div`
    flex: 1;
    position: relative;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 12px 16px;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    background: #f9f9f9;

    svg {
        color: #999;
    }
`;

const SearchInput = styled.input`
    flex: 1;
    border: none;
    background: transparent;
    font-size: 15px;
    outline: none;
    color: #333;

    &::placeholder {
        color: #999;
    }
`;

const SearchButton = styled.button`
    padding: 12px 24px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 8px;
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

const SearchResultCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #f0f4ff;
    border: 2px solid #667eea;
    border-radius: 8px;
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

const ConnectionsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const ConnectionCard = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    background: #f9f9f9;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    transition: all 0.2s;

    &:hover {
        border-color: #667eea;
        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
    }
`;

const UserInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const UserName = styled.div`
    font-weight: 600;
    font-size: 16px;
    color: #333;
`;

const UserDetail = styled.div`
    font-size: 14px;
    color: #666;
`;

const PendingBadge = styled.div`
    display: inline-block;
    padding: 4px 8px;
    background: #fef3c7;
    color: #92400e;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 600;
    margin-top: 4px;
`;

const ButtonGroup = styled.div`
    display: flex;
    gap: 8px;
`;

const ActionButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 16px;
    background: #667eea;
    color: white;
    border: none;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
        background: #5568d3;
        transform: translateY(-1px);
    }
`;

const AcceptButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
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
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
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

const RemoveButton = styled.button`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
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
