import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import toast from 'react-hot-toast';
import dayjs from "dayjs";
import { Users, UserPlus, Search, Check, X, Trash2, Share2, Clock, MapPin, DollarSign, Dog, Plus } from "lucide-react";

export default function TeamAndShares() {
    const [connections, setConnections] = useState([]);
    const [shares, setShares] = useState({
        received_pending: [],
        received_all: [],
        sent: []
    });
    const [financials, setFinancials] = useState(null);
    const [searchEmail, setSearchEmail] = useState("");
    const [searchResult, setSearchResult] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("team"); // "team", "walks", "financials"
    const [showSearchBar, setShowSearchBar] = useState(false);
    const searchInputRef = useRef(null);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchData = async () => {
        await Promise.all([fetchConnections(), fetchShares(), fetchFinancials()]);
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

    const fetchFinancials = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("/appointments/team_financials", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setFinancials(data);
            } else {
                toast.error("Failed to load team financials");
            }
        } catch (error) {
            console.error("Error fetching financials:", error);
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
                    <HeaderContent>
                        <PageTitle>
                            <Users size={24} />
                            My Team
                        </PageTitle>
                        <PageSubtitle>
                            {acceptedConnections.length} member{acceptedConnections.length !== 1 ? 's' : ''} • {pendingReceived.length} pending
                        </PageSubtitle>
                    </HeaderContent>
                    <HeaderButtonGroup>
                        <HeaderButton
                            onClick={() => {
                                if (showSearchBar) {
                                    // Closing search bar - clear search state
                                    setShowSearchBar(false);
                                    setSearchEmail("");
                                    setSearchResult(null);
                                } else {
                                    // Opening search bar - focus input
                                    setShowSearchBar(true);
                                    setTimeout(() => searchInputRef.current?.focus(), 100);
                                }
                            }}
                            title={showSearchBar ? "Close search" : "Add team member"}
                        >
                            {showSearchBar ? <X size={18} /> : <Plus size={18} />}
                        </HeaderButton>
                    </HeaderButtonGroup>
                </Header>

                {/* Search Section */}
                {showSearchBar && (
                <SearchAndFilterSection>
                    <SearchAndFilter as="form" onSubmit={handleSearchUser}>
                        <SearchBar>
                            <Search size={20} />
                            <input
                                ref={searchInputRef}
                                type="email"
                                placeholder="Search by email to add team members..."
                                value={searchEmail}
                                onChange={(e) => setSearchEmail(e.target.value)}
                            />
                        </SearchBar>
                        <AddTeamMemberButton type="submit" disabled={isSearching}>
                            <UserPlus size={18} />
                            {isSearching ? "Searching..." : "Add"}
                        </AddTeamMemberButton>
                    </SearchAndFilter>

                    {searchResult && (
                        <SearchResultCard>
                            <UserInfo>
                                <UserName>{searchResult.name}</UserName>
                                <UserEmail>@{searchResult.username}</UserEmail>
                            </UserInfo>
                            <SendButton onClick={() => handleSendRequest(searchResult.id)}>
                                <UserPlus size={16} />
                                <span>Send Request</span>
                            </SendButton>
                        </SearchResultCard>
                    )}
                </SearchAndFilterSection>
                )}

                {/* Tab Navigation */}
                <TabContainer>
                    <Tab
                        $active={activeTab === "team"}
                        onClick={() => setActiveTab("team")}
                    >
                        <TabLabel>Team</TabLabel>
                        <TabCount $active={activeTab === "team"}>
                            {acceptedConnections.length + pendingReceived.length + pendingSent.length}
                        </TabCount>
                    </Tab>
                    <Tab
                        $active={activeTab === "walks"}
                        onClick={() => setActiveTab("walks")}
                    >
                        <TabLabel>Walks</TabLabel>
                        <TabCount $active={activeTab === "walks"}>
                            {shares.received_pending.length + shares.received_all.length + shares.sent.length}
                        </TabCount>
                    </Tab>
                    <Tab
                        $active={activeTab === "financials"}
                        onClick={() => setActiveTab("financials")}
                    >
                        <TabLabel>Financials</TabLabel>
                        <TabCount $active={activeTab === "financials"}>
                            {financials ? (financials.my_earnings.length + financials.team_payouts.length) : 0}
                        </TabCount>
                    </Tab>
                </TabContainer>

                {/* Tab Content */}
                <ContentSection>
                    {activeTab === "team" && (
                        <>
                            {/* Active Team Members */}
                            {acceptedConnections.length > 0 && (
                                <>
                                    <SectionTitle>Team Members ({acceptedConnections.length})</SectionTitle>
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
                                </>
                            )}

                            {/* Pending Requests */}
                            {(pendingReceived.length > 0 || pendingSent.length > 0) && (
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

                            {/* Empty state for completely new team */}
                            {acceptedConnections.length === 0 && pendingReceived.length === 0 && pendingSent.length === 0 && (
                                <EmptyState>
                                    <Users size={48} />
                                    <EmptyText>No team members yet</EmptyText>
                                    <EmptySubtext>Search for walkers above to build your team</EmptySubtext>
                                </EmptyState>
                            )}
                        </>
                    )}

                    {activeTab === "walks" && (
                        <>
                            {/* Pending Walk Requests */}
                            {shares.received_pending.length > 0 && (
                                <>
                                    <SectionTitle>Pending Requests ({shares.received_pending.length})</SectionTitle>
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
                                                    <DetailText>${(share.appointment.price / 100).toFixed(2)}</DetailText>
                                                </DetailRow>

                                                {/* Income Split Display */}
                                                {share.covering_walker_percentage && (
                                                    <IncomeSplitBox>
                                                        <SplitLabel>Income Split</SplitLabel>
                                                        <SplitRow>
                                                            <SplitItem>
                                                                <SplitLabel>You get:</SplitLabel>
                                                                <SplitValue $highlight>
                                                                    {share.covering_walker_percentage}%
                                                                    (${((share.appointment.price / 100) * share.covering_walker_percentage / 100).toFixed(2)})
                                                                </SplitValue>
                                                            </SplitItem>
                                                            <SplitDivider>•</SplitDivider>
                                                            <SplitItem>
                                                                <SplitLabel>{share.other_user.name} keeps:</SplitLabel>
                                                                <SplitValue>
                                                                    {share.original_walker_percentage}%
                                                                    (${((share.appointment.price / 100) * share.original_walker_percentage / 100).toFixed(2)})
                                                                </SplitValue>
                                                            </SplitItem>
                                                        </SplitRow>
                                                    </IncomeSplitBox>
                                                )}

                                                {/* Share Dates for Recurring Appointments */}
                                                {share.share_dates && share.share_dates.length > 0 && (
                                                    <ShareDatesBox>
                                                        <ShareDatesLabel>Shared dates ({share.share_dates.length}):</ShareDatesLabel>
                                                        <ShareDatesGrid>
                                                            {share.share_dates.slice(0, 6).map((date, idx) => (
                                                                <DateChip key={idx}>
                                                                    {dayjs(date).format('MMM D')}
                                                                </DateChip>
                                                            ))}
                                                            {share.share_dates.length > 6 && (
                                                                <DateChip>+{share.share_dates.length - 6} more</DateChip>
                                                            )}
                                                        </ShareDatesGrid>
                                                    </ShareDatesBox>
                                                )}

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
                                </>
                            )}

                            {/* Walk History */}
                            {(shares.received_all.length > 0 || shares.sent.length > 0) && (
                                <>
                                    <SectionTitle>Walk History ({shares.received_all.length + shares.sent.length})</SectionTitle>
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
                                                            <span>${(share.appointment.price / 100).toFixed(2)}</span>
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
                                                            <span>${(share.appointment.price / 100).toFixed(2)}</span>
                                                            {share.covering_walker_percentage && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{share.covering_walker_percentage}% / {share.original_walker_percentage}%</span>
                                                                </>
                                                            )}
                                                        </HistoryDetails>
                                                        {share.status === 'pending' && (
                                                            <CancelShareButton onClick={() => handleCancelShare(share.id)}>
                                                                <X size={14} />
                                                                Cancel
                                                            </CancelShareButton>
                                                        )}
                                                        {share.status === 'accepted' && (
                                                            <CancelShareButton
                                                                onClick={() => handleCancelShare(share.id)}
                                                                style={{ background: '#fb923c', borderColor: '#f97316' }}
                                                            >
                                                                <X size={14} />
                                                                Unshare
                                                            </CancelShareButton>
                                                        )}
                                                    </HistoryCard>
                                                ))}
                                            </List>
                                        </>
                                    )}
                                </>
                            )}

                            {/* Empty state for no walks */}
                            {shares.received_pending.length === 0 && shares.received_all.length === 0 && shares.sent.length === 0 && (
                                <EmptyState>
                                    <Share2 size={48} />
                                    <EmptyText>No shared walks</EmptyText>
                                    <EmptySubtext>Shared walks will appear here</EmptySubtext>
                                </EmptyState>
                            )}
                        </>
                    )}

                    {activeTab === "financials" && (
                        <>
                            <SectionTitle>Team Financials</SectionTitle>

                            {/* Summary Cards */}
                            {financials && (
                                <FinancialSummary>
                                    <SummaryCard $type="earning">
                                        <SummaryLabel>My Earnings (Covering)</SummaryLabel>
                                        <SummaryValue>${(financials.totals.total_earnings / 100).toFixed(2)}</SummaryValue>
                                        <SummarySubtext>Unpaid: ${(financials.totals.total_earnings_unpaid / 100).toFixed(2)}</SummarySubtext>
                                    </SummaryCard>
                                    <SummaryCard $type="payout">
                                        <SummaryLabel>Team Payouts (I Owe)</SummaryLabel>
                                        <SummaryValue>${(financials.totals.total_payouts / 100).toFixed(2)}</SummaryValue>
                                        <SummarySubtext>Unpaid: ${(financials.totals.total_payouts_unpaid / 100).toFixed(2)}</SummarySubtext>
                                    </SummaryCard>
                                </FinancialSummary>
                            )}

                            {/* My Earnings Section */}
                            <SubSectionTitle>💰 My Earnings (Walks I Covered)</SubSectionTitle>
                            {!financials || financials.my_earnings.length === 0 ? (
                                <EmptyState>
                                    <DollarSign size={48} />
                                    <EmptyText>No covering earnings yet</EmptyText>
                                    <EmptySubtext>Accept shared walks to start earning</EmptySubtext>
                                </EmptyState>
                            ) : (
                                <List>
                                    {financials.my_earnings.map(earning => (
                                        <FinancialCard key={earning.id} $type="earning">
                                            <CardHeader>
                                                <CardTitle>
                                                    <Dog size={18} />
                                                    {earning.pet?.name || 'Walk'}
                                                </CardTitle>
                                                <Amount $paid={earning.paid}>
                                                    ${(earning.compensation / 100).toFixed(2)}
                                                </Amount>
                                            </CardHeader>
                                            <CardDetails>
                                                <DetailItem>
                                                    <Clock size={14} />
                                                    {dayjs(earning.date_completed).format('MMM D, YYYY')}
                                                </DetailItem>
                                                <Badge $type="earning">
                                                    {earning.split_percentage}% split
                                                </Badge>
                                                {earning.paid ? (
                                                    <Badge $type="paid">Paid</Badge>
                                                ) : (
                                                    <Badge $type="unpaid">Unpaid</Badge>
                                                )}
                                            </CardDetails>
                                        </FinancialCard>
                                    ))}
                                </List>
                            )}

                            {/* Team Payouts Section */}
                            <SubSectionTitle>📤 Team Payouts (I Need to Pay)</SubSectionTitle>
                            {!financials || financials.team_payouts.length === 0 ? (
                                <EmptyState>
                                    <DollarSign size={48} />
                                    <EmptyText>No team payouts</EmptyText>
                                    <EmptySubtext>Share walks with your team to see payouts here</EmptySubtext>
                                </EmptyState>
                            ) : (
                                <List>
                                    {financials.team_payouts.map(payout => (
                                        <FinancialCard key={payout.id} $type="payout">
                                            <CardHeader>
                                                <CardTitle>
                                                    <Dog size={18} />
                                                    {payout.pet?.name || 'Walk'} • {payout.walker?.name}
                                                </CardTitle>
                                                <Amount $paid={payout.paid}>
                                                    ${(payout.compensation / 100).toFixed(2)}
                                                </Amount>
                                            </CardHeader>
                                            <CardDetails>
                                                <DetailItem>
                                                    <Clock size={14} />
                                                    {dayjs(payout.date_completed).format('MMM D, YYYY')}
                                                </DetailItem>
                                                <Badge $type="payout">
                                                    {payout.split_percentage}% split
                                                </Badge>
                                                {payout.paid ? (
                                                    <Badge $type="paid">Paid</Badge>
                                                ) : (
                                                    <Badge $type="unpaid">Unpaid - Pay {payout.walker?.name}</Badge>
                                                )}
                                            </CardDetails>
                                        </FinancialCard>
                                    ))}
                                </List>
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
    width: 100%;
    max-width: 448px;
    margin: 0 auto 20px;
    z-index: 100;
    position: relative;
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;

    @media (min-width: 768px) {
        margin: 0 auto 24px;
    }

    @media (max-width: 768px) {
        padding: 0 12px;
    }
`;

const HeaderContent = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
`;

const HeaderButtonGroup = styled.div`
    display: flex;
    gap: 6px;
    align-items: center;
`;

const HeaderButton = styled.button`
    background: rgba(255, 255, 255, 0.2);
    backdrop-filter: blur(12px);
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 10;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
        transform: translateY(0);
    }
`;

const PageTitle = styled.h1`
    color: white;
    font-size: 26px;
    font-weight: 700;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 10px;

    @media (min-width: 768px) {
        font-size: 32px;
    }
`;

const PageSubtitle = styled.p`
    color: rgba(255, 255, 255, 0.9);
    font-size: 14px;
    margin: 0;

    @media (min-width: 768px) {
        font-size: 15px;
    }
`;

const SearchAndFilterSection = styled.div`
    max-width: 448px;
    margin: 0 auto 20px;
    animation: slideDown 0.3s ease-out;

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;

const SearchAndFilter = styled.div`
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
    }
`;

const SearchBar = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.95);
    padding: 12px 20px;
    border-radius: 12px;
    backdrop-filter: blur(10px);
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.2s ease;

    &:focus-within {
        background: rgba(255, 255, 255, 1);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
    }

    input {
        flex: 1;
        border: none;
        background: none;
        font-family: 'Poppins', sans-serif;
        font-size: 1rem;
        color: #111827;
        outline: none;

        &::placeholder {
            color: #9ca3af;
        }
    }
`;

const AddTeamMemberButton = styled.button`
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 10px 12px;
    background: rgba(255, 255, 255, 0.95);
    color: #667eea;
    border: none;
    border-radius: 10px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);

    &:hover:not(:disabled) {
        background: white;
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        width: 100%;
        justify-content: center;
        padding: 8px 14px;
        font-size: 0.85rem;
        gap: 5px;

        svg {
            width: 15px;
            height: 15px;
        }
    }

    @media (max-width: 480px) {
        padding: 7px 10px;
        font-size: 0.8rem;
        gap: 4px;

        svg {
            width: 14px;
            height: 14px;
        }
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
    display: flex;
    gap: 8px;
    background: rgba(255, 255, 255, 0.15);
    padding: 6px;
    border-radius: 14px;
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    width: fit-content;
    margin: 0 auto 20px;
    max-width: 90%;

    @media (max-width: 768px) {
        gap: 5px;
        padding: 4px;
        width: calc(100% - 32px);
        max-width: 448px;
    }

    @media (max-width: 480px) {
        gap: 3px;
        padding: 3px;
    }
`;

const Tab = styled.button`
    background: ${props => props.$active ? 'rgba(255, 255, 255, 0.95)' : 'transparent'};
    color: ${props => props.$active ? '#667eea' : 'rgba(255, 255, 255, 0.9)'};
    border: none;
    border-radius: 10px;
    padding: 10px 20px;
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    justify-content: center;
    white-space: nowrap;

    @media (max-width: 768px) {
        padding: 8px 12px;
        font-size: 0.85rem;
        gap: 6px;
    }

    @media (max-width: 480px) {
        padding: 7px 8px;
        font-size: 0.75rem;
        gap: 4px;
    }

    &:hover {
        background: ${props => props.$active ? 'rgba(255, 255, 255, 1)' : 'rgba(255, 255, 255, 0.2)'};
        transform: translateY(-1px);
    }
`;

const TabLabel = styled.span`
    font-size: inherit;
`;

const TabCount = styled.span`
    background: ${props => props.$active ? 'rgba(102, 126, 234, 0.1)' : 'rgba(255, 255, 255, 0.2)'};
    color: ${props => props.$active ? '#667eea' : 'rgba(255, 255, 255, 0.9)'};
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 0.85em;
    font-weight: 700;

    @media (max-width: 480px) {
        padding: 2px 6px;
        font-size: 0.8em;
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

const IncomeSplitBox = styled.div`
    margin-top: 12px;
    padding: 12px;
    background: linear-gradient(135deg, #f0f4ff, #f9f0ff);
    border-radius: 8px;
    border: 2px solid rgba(102, 126, 234, 0.3);
`;

const SplitRow = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 8px;
`;

const SplitItem = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

const SplitLabel = styled.div`
    font-size: 11px;
    font-weight: 600;
    color: #667eea;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const SplitValue = styled.div`
    font-size: 14px;
    font-weight: ${props => props.$highlight ? 700 : 600};
    color: ${props => props.$highlight ? '#667eea' : '#666'};
`;

const SplitDivider = styled.div`
    color: #e0e0e0;
    font-weight: bold;
`;

const ShareDatesBox = styled.div`
    margin-top: 12px;
    padding: 10px;
    background: rgba(102, 126, 234, 0.08);
    border-radius: 8px;
    border: 1px solid rgba(102, 126, 234, 0.2);
`;

const ShareDatesLabel = styled.div`
    font-size: 11px;
    font-weight: 600;
    color: #667eea;
    margin-bottom: 8px;
`;

const ShareDatesGrid = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
`;

const DateChip = styled.div`
    padding: 4px 8px;
    background: white;
    border: 1px solid rgba(102, 126, 234, 0.3);
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    color: #667eea;
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


const FinancialSummary = styled.div`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 24px;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

const SummaryCard = styled.div`
    background: ${props => props.$type === 'earning' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'};
    padding: 20px;
    border-radius: 12px;
    color: white;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SummaryLabel = styled.div`
    font-size: 13px;
    font-weight: 600;
    opacity: 0.9;
    margin-bottom: 8px;
`;

const SummaryValue = styled.div`
    font-size: 28px;
    font-weight: 700;
    margin-bottom: 4px;
`;

const SummarySubtext = styled.div`
    font-size: 12px;
    opacity: 0.8;
`;

const SubSectionTitle = styled.h3`
    font-size: 18px;
    font-weight: 700;
    color: #1f2937;
    margin: 24px 0 16px 0;
`;

const FinancialCard = styled.div`
    background: white;
    border-radius: 12px;
    padding: 16px;
    border-left: 4px solid ${props => props.$type === 'earning' ? '#10b981' : '#f59e0b'};
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
    }
`;

const Amount = styled.div`
    font-size: 20px;
    font-weight: 700;
    color: ${props => props.$paid ? '#10b981' : '#f59e0b'};
`;


const SectionTitle = styled.h2`
    font-size: 20px;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 20px 0;
`;

const CardHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
`;

const CardTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
    color: #1f2937;
    flex: 1;

    svg {
        flex-shrink: 0;
    }
`;

const CardDetails = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
`;

const DetailItem = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;

    svg {
        width: 14px;
        height: 14px;
    }
`;

const Badge = styled.span`
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    background: ${props => {
        if (props.$type === 'earning') return '#d1fae5';
        if (props.$type === 'payout') return '#fef3c7';
        if (props.$type === 'paid') return '#d1fae5';
        if (props.$type === 'unpaid') return '#fee2e2';
        return '#e5e7eb';
    }};
    color: ${props => {
        if (props.$type === 'earning') return '#065f46';
        if (props.$type === 'payout') return '#92400e';
        if (props.$type === 'paid') return '#065f46';
        if (props.$type === 'unpaid') return '#991b1b';
        return '#374151';
    }};
`;
