import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { DollarSign, Calendar, TrendingUp, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  padding-bottom: 100px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 25px;
`;

const BackButton = styled.button`
  background: none;
  border: none;
  padding: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  color: #666;
  transition: color 0.2s;

  &:hover {
    color: #333;
  }
`;

const Title = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const SummaryCards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const SummaryCard = styled.div`
  background: linear-gradient(135deg, ${props => props.$gradientFrom || '#667eea'} 0%, ${props => props.$gradientTo || '#764ba2'} 100%);
  padding: 25px;
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const SummaryLabel = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const SummaryValue = styled.div`
  font-size: 32px;
  font-weight: 700;
`;

const ClientCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  }
`;

const ClientHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f3f4f6;
`;

const ClientInfo = styled.div`
  flex: 1;
`;

const ClientName = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
`;

const ClientDetails = styled.div`
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
`;

const EarningsBox = styled.div`
  text-align: right;
`;

const EarningsLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
  margin-bottom: 5px;
`;

const EarningsValue = styled.div`
  font-size: 28px;
  font-weight: 700;
  color: #10b981;
`;

const AppointmentsList = styled.div`
  margin-top: 15px;
`;

const AppointmentItem = styled.div`
  background: #f9fafb;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  border-left: 4px solid #667eea;
`;

const AppointmentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const AppointmentTime = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #374151;
`;

const AppointmentPrice = styled.div`
  font-size: 18px;
  font-weight: 700;
  color: #059669;
`;

const DaysOfWeek = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const DayBadge = styled.span`
  background: ${props => props.$active ? '#667eea' : '#e5e7eb'};
  color: ${props => props.$active ? 'white' : '#9ca3af'};
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
`;

const StatItem = styled.div`
  text-align: center;
`;

const StatLabel = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  font-size: 18px;
  color: #6b7280;
`;

const ErrorMessage = styled.div`
  background: #fee;
  border: 1px solid #fcc;
  color: #c33;
  padding: 20px;
  border-radius: 8px;
  margin: 20px 0;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #6b7280;

  h3 {
    font-size: 20px;
    margin-bottom: 10px;
  }

  p {
    font-size: 16px;
  }
`;

export default function ClientFinancialOverview() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFinancialOverview();
  }, []);

  const fetchFinancialOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch("/appointments/client_financial_overview", {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch financial overview");
      }

      const json = await response.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const date = new Date(`2000-01-01T${timeString}`);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getDayAbbreviation = (day) => {
    const days = {
      monday: 'Mon',
      tuesday: 'Tue',
      wednesday: 'Wed',
      thursday: 'Thu',
      friday: 'Fri',
      saturday: 'Sat',
      sunday: 'Sun'
    };
    return days[day] || day;
  };

  if (loading) {
    return (
      <Container>
        <LoadingMessage>Loading financial overview...</LoadingMessage>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>Error: {error}</ErrorMessage>
      </Container>
    );
  }

  if (!data || data.pets.length === 0) {
    return (
      <Container>
        <Header>
          <BackButton onClick={() => navigate('/dashboard')}>
            <ArrowLeft size={24} />
          </BackButton>
          <Title>Client Financial Overview</Title>
        </Header>
        <EmptyState>
          <h3>No Active Clients</h3>
          <p>You don't have any active clients with recurring appointments yet.</p>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <BackButton onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={24} />
        </BackButton>
        <Title>Client Financial Overview</Title>
      </Header>

      <SummaryCards>
        <SummaryCard $gradientFrom="#10b981" $gradientTo="#059669">
          <SummaryLabel>
            <DollarSign size={20} />
            Weekly Income
          </SummaryLabel>
          <SummaryValue>{formatCurrency(data.totals.total_weekly_income)}</SummaryValue>
        </SummaryCard>

        <SummaryCard $gradientFrom="#3b82f6" $gradientTo="#2563eb">
          <SummaryLabel>
            <Calendar size={20} />
            Monthly Income
          </SummaryLabel>
          <SummaryValue>{formatCurrency(data.totals.total_monthly_income)}</SummaryValue>
        </SummaryCard>

        <SummaryCard $gradientFrom="#8b5cf6" $gradientTo="#7c3aed">
          <SummaryLabel>
            <TrendingUp size={20} />
            Annual Projection
          </SummaryLabel>
          <SummaryValue>{formatCurrency(data.totals.total_annual_income)}</SummaryValue>
        </SummaryCard>
      </SummaryCards>

      {data.pets.map((pet) => (
        <ClientCard key={pet.pet_id}>
          <ClientHeader>
            <ClientInfo>
              <ClientName>{pet.pet_name}</ClientName>
              <ClientDetails>
                {pet.client_name && <div><strong>Owner:</strong> {pet.client_name}</div>}
                {pet.client_phone && <div><strong>Phone:</strong> {pet.client_phone}</div>}
                {pet.address && <div><strong>Address:</strong> {pet.address}</div>}
              </ClientDetails>
            </ClientInfo>
            <EarningsBox>
              <EarningsLabel>Monthly</EarningsLabel>
              <EarningsValue>{formatCurrency(pet.monthly_income)}</EarningsValue>
            </EarningsBox>
          </ClientHeader>

          {pet.recurring_appointments.length > 0 && (
            <AppointmentsList>
              {pet.recurring_appointments.map((apt) => (
                <AppointmentItem key={apt.id}>
                  <AppointmentHeader>
                    <AppointmentTime>
                      {formatTime(apt.start_time)} - {formatTime(apt.end_time)}
                      {apt.duration && ` (${apt.duration} min)`}
                      {apt.walk_type && ` • ${apt.walk_type}`}
                    </AppointmentTime>
                    <AppointmentPrice>{formatCurrency(apt.price)}</AppointmentPrice>
                  </AppointmentHeader>
                  <DaysOfWeek>
                    {Object.entries(apt.days).map(([day, active]) => (
                      <DayBadge key={day} $active={active}>
                        {getDayAbbreviation(day)}
                      </DayBadge>
                    ))}
                  </DaysOfWeek>
                </AppointmentItem>
              ))}
            </AppointmentsList>
          )}

          <StatsGrid>
            <StatItem>
              <StatLabel>Walks/Week</StatLabel>
              <StatValue>{pet.walks_per_week}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Weekly Income</StatLabel>
              <StatValue>{formatCurrency(pet.weekly_income)}</StatValue>
            </StatItem>
            <StatItem>
              <StatLabel>Annual Projection</StatLabel>
              <StatValue>{formatCurrency(pet.annual_income)}</StatValue>
            </StatItem>
          </StatsGrid>
        </ClientCard>
      ))}
    </Container>
  );
}
