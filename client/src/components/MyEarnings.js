import React, { useState, useEffect } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { DollarSign, Calendar, CreditCard, Receipt, TrendingUp, Users } from "lucide-react";
import toast from 'react-hot-toast';

const MyEarnings = () => {
    const [activeTab, setActiveTab] = useState("unpaid");
    const [earningsData, setEarningsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [invoiceLimit, setInvoiceLimit] = useState(50);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchEarnings();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchEarnings = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/appointments/my_earnings?per_page=${invoiceLimit === "all" ? 1000 : invoiceLimit}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setEarningsData(data);
            } else {
                toast.error("Failed to load earnings");
            }
        } catch (error) {
            toast.error("Error loading earnings");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Container>
                <LoadingMessage>Loading earnings...</LoadingMessage>
            </Container>
        );
    }

    if (!earningsData) {
        return (
            <Container>
                <ErrorMessage>Unable to load earnings data</ErrorMessage>
            </Container>
        );
    }

    // Combine invoices and walker earnings into a single list
    const allEarnings = [
        ...earningsData.invoices.map(invoice => ({
            ...invoice,
            type: 'invoice',
            amount: invoice.compensation,
            title: invoice.title || 'Walk',
            date: invoice.date_completed,
            petName: invoice.pet?.name || 'Unknown',
            appointmentTime: invoice.appointment ?
                `${invoice.appointment.start_time} - ${invoice.appointment.end_time}` : '',
            splitInfo: invoice.is_shared ? {
                isShared: true,
                percentage: invoice.split_percentage,
                role: 'Original Owner'
            } : null
        })),
        ...earningsData.walker_earnings.map(earning => ({
            ...earning,
            type: 'walker_earning',
            amount: earning.compensation,
            title: earning.title || 'Walk',
            date: earning.date_completed,
            petName: earning.pet?.name || 'Unknown',
            appointmentTime: earning.appointment ?
                `${earning.appointment.start_time} - ${earning.appointment.end_time}` : '',
            splitInfo: {
                isShared: true,
                percentage: earning.split_percentage,
                role: 'Covering Walker'
            }
        }))
    ];

    // Sort by date descending
    const sortByDateDesc = (a, b) => new Date(b.date) - new Date(a.date);

    const unpaidEarnings = allEarnings
        .filter(item => !item.paid)
        .sort(sortByDateDesc);

    const allEarningsSorted = allEarnings
        .sort(sortByDateDesc);

    const totalUnpaid = earningsData.totals.total_unpaid / 100;
    const totalEarnings = earningsData.totals.total_earnings / 100;
    const totalInvoiceEarnings = earningsData.totals.total_invoice_earnings / 100;
    const totalWalkerEarnings = earningsData.totals.total_walker_earnings / 100;

    const displayedEarnings = activeTab === "unpaid" ? unpaidEarnings : allEarningsSorted;

    return (
        <Container>
            <Header>
                <Title>
                    <TrendingUp size={28} />
                    My Earnings
                </Title>
                <Subtitle>Track your income from walks and shared appointments</Subtitle>
            </Header>

            <StatsGrid>
                <StatCard>
                    <StatLabel>Total Earnings</StatLabel>
                    <StatValue>${totalEarnings.toFixed(2)}</StatValue>
                </StatCard>
                <StatCard>
                    <StatLabel>Pet Owner Earnings</StatLabel>
                    <StatValue>${totalInvoiceEarnings.toFixed(2)}</StatValue>
                    <StatCount>{earningsData.invoices.length} invoices</StatCount>
                </StatCard>
                <StatCard>
                    <StatLabel>Covering Walker Earnings</StatLabel>
                    <StatValue>${totalWalkerEarnings.toFixed(2)}</StatValue>
                    <StatCount>{earningsData.walker_earnings.length} walks</StatCount>
                </StatCard>
                <StatCard $highlight>
                    <StatLabel>Total Unpaid</StatLabel>
                    <StatValue>${totalUnpaid.toFixed(2)}</StatValue>
                    <StatCount>{unpaidEarnings.length} items</StatCount>
                </StatCard>
            </StatsGrid>

            <TabContainer>
                <TabButton $active={activeTab === "unpaid"} onClick={() => setActiveTab("unpaid")}>
                    <CreditCard size={16} />
                    Unpaid ({unpaidEarnings.length})
                </TabButton>

                <TabButton $active={activeTab === "all"} onClick={() => setActiveTab("all")}>
                    <Receipt size={16} />
                    All Earnings
                </TabButton>
            </TabContainer>

            <EarningsSection>
                {displayedEarnings.length === 0 ? (
                    <EmptyState>
                        <EmptyIcon>
                            {activeTab === "unpaid" ? <CreditCard size={48} /> : <Receipt size={48} />}
                        </EmptyIcon>
                        <EmptyTitle>
                            {activeTab === "unpaid" ? "No unpaid earnings" : "No earnings yet"}
                        </EmptyTitle>
                        <EmptyText>
                            {activeTab === "unpaid"
                                ? "All your earnings are paid up!"
                                : "Complete walks to start earning"}
                        </EmptyText>
                    </EmptyState>
                ) : (
                    <EarningsList>
                        {displayedEarnings.map((item, index) => (
                            <EarningCard key={`${item.type}-${item.id}-${index}`} $paid={item.paid}>
                                <EarningHeader>
                                    <EarningTitleRow>
                                        <EarningTitle>{item.title}</EarningTitle>
                                        <TypeBadge $type={item.type}>
                                            {item.type === 'invoice' ? (
                                                <>
                                                    <Receipt size={12} />
                                                    Invoice
                                                </>
                                            ) : (
                                                <>
                                                    <Users size={12} />
                                                    Covering
                                                </>
                                            )}
                                        </TypeBadge>
                                    </EarningTitleRow>
                                    <EarningAmount>${(item.amount / 100).toFixed(2)}</EarningAmount>
                                </EarningHeader>

                                <EarningDetails>
                                    <DetailRow>
                                        <PetName>{item.petName}</PetName>
                                        {item.appointmentTime && (
                                            <Time>{item.appointmentTime}</Time>
                                        )}
                                    </DetailRow>
                                    <DetailRow>
                                        <DateText>
                                            <Calendar size={14} />
                                            {dayjs(item.date).format("MMM D, YYYY")}
                                        </DateText>
                                        {item.splitInfo && (
                                            <SplitBadge>
                                                {item.splitInfo.role} ({item.splitInfo.percentage}%)
                                            </SplitBadge>
                                        )}
                                        {item.paid && (
                                            <PaidBadge>Paid</PaidBadge>
                                        )}
                                        {item.pending && (
                                            <PendingBadge>Pending</PendingBadge>
                                        )}
                                    </DetailRow>
                                </EarningDetails>
                            </EarningCard>
                        ))}
                    </EarningsList>
                )}
            </EarningsSection>
        </Container>
    );
};

export default MyEarnings;

// Styled Components
const Container = styled.div`
    padding: 20px;
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: 100px;

    @media (max-width: 768px) {
        padding: 15px;
    }
`;

const Header = styled.div`
    margin-bottom: 24px;
`;

const Title = styled.h1`
    font-size: 28px;
    font-weight: 700;
    color: #1a1a1a;
    margin: 0 0 8px 0;
    display: flex;
    align-items: center;
    gap: 12px;

    svg {
        color: #4f46e5;
    }
`;

const Subtitle = styled.p`
    font-size: 14px;
    color: #666;
    margin: 0;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;

    @media (max-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
    }
`;

const StatCard = styled.div`
    background: ${props => props.$highlight ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : 'white'};
    border: 1px solid ${props => props.$highlight ? 'transparent' : '#e5e7eb'};
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    color: ${props => props.$highlight ? 'white' : '#1a1a1a'};
`;

const StatLabel = styled.div`
    font-size: 13px;
    font-weight: 500;
    opacity: ${props => props.$highlight ? 0.9 : 0.7};
    margin-bottom: 8px;
`;

const StatValue = styled.div`
    font-size: 24px;
    font-weight: 700;
    margin-bottom: 4px;
`;

const StatCount = styled.div`
    font-size: 12px;
    opacity: 0.8;
`;

const TabContainer = styled.div`
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    border-bottom: 2px solid #e5e7eb;
`;

const TabButton = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: ${props => props.$active ? 'white' : 'transparent'};
    border: none;
    border-bottom: 2px solid ${props => props.$active ? '#4f46e5' : 'transparent'};
    color: ${props => props.$active ? '#4f46e5' : '#666'};
    font-weight: ${props => props.$active ? '600' : '400'};
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: -2px;

    &:hover {
        color: #4f46e5;
        background: #f9fafb;
    }
`;

const EarningsSection = styled.div`
    min-height: 300px;
`;

const EarningsList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

const EarningCard = styled.div`
    background: white;
    border: 1px solid ${props => props.$paid ? '#e5e7eb' : '#fbbf24'};
    border-left: 4px solid ${props => props.$paid ? '#10b981' : '#f59e0b'};
    border-radius: 8px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;

    &:hover {
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
    }
`;

const EarningHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
`;

const EarningTitleRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
`;

const EarningTitle = styled.div`
    font-weight: 600;
    font-size: 16px;
    color: #1a1a1a;
`;

const EarningAmount = styled.div`
    font-weight: 700;
    font-size: 18px;
    color: #10b981;
`;

const EarningDetails = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
`;

const PetName = styled.div`
    font-size: 14px;
    color: #4b5563;
    font-weight: 500;
`;

const Time = styled.div`
    font-size: 13px;
    color: #6b7280;
`;

const DateText = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: #6b7280;

    svg {
        color: #9ca3af;
    }
`;

const TypeBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    background: ${props => props.$type === 'invoice' ? '#dbeafe' : '#fef3c7'};
    color: ${props => props.$type === 'invoice' ? '#1e40af' : '#92400e'};

    svg {
        width: 12px;
        height: 12px;
    }
`;

const SplitBadge = styled.span`
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    background: #e0e7ff;
    color: #4338ca;
`;

const PaidBadge = styled.span`
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    background: #d1fae5;
    color: #065f46;
`;

const PendingBadge = styled.span`
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    background: #fef3c7;
    color: #92400e;
`;

const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
`;

const EmptyIcon = styled.div`
    color: #d1d5db;
    margin-bottom: 16px;
`;

const EmptyTitle = styled.h3`
    font-size: 18px;
    font-weight: 600;
    color: #374151;
    margin: 0 0 8px 0;
`;

const EmptyText = styled.p`
    font-size: 14px;
    color: #6b7280;
    margin: 0;
`;

const LoadingMessage = styled.div`
    text-align: center;
    padding: 40px;
    font-size: 16px;
    color: #666;
`;

const ErrorMessage = styled.div`
    text-align: center;
    padding: 40px;
    font-size: 16px;
    color: #ef4444;
`;
