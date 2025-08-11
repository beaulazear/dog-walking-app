import React, { useContext, useState } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import dayjs from "dayjs";
import { 
    TrendingUp, 
    DollarSign, 
    Calendar, 
    PiggyBank,
    Receipt
} from "lucide-react";

const currentYear = dayjs().year();

export default function YearlyFinanceOverview() {
    const { user } = useContext(UserContext);
    const [taxPercentage, setTaxPercentage] = useState(15);

    const invoicesFromCurrentYear = user?.invoices?.filter(inv =>
        dayjs(inv.date_completed).year() === currentYear
    ) || [];

    const totalIncome = calculateTotalIncome(invoicesFromCurrentYear);
    const dailyAverage = calculateDailyAverage(totalIncome);
    const weeklyIncome = calculateWeeklyIncome(dailyAverage);
    const monthlyIncome = calculateMonthlyIncome(dailyAverage);
    const estimatedYearlyTotal = calculateEstimatedYearlyTotal(dailyAverage);
    const taxEstimate = Math.round((estimatedYearlyTotal * taxPercentage) / 100);
    
    // Calculate recurring revenue
    const { weeklyRecurring, yearlyRecurring } = calculateRecurringRevenue(user);

    function handleTaxChange(e) {
        setTaxPercentage(parseInt(e.target.value));
    }

    return (
        <Container>
            <Header>
                <TrendingUp size={24} />
                Financial Overview ({currentYear})
            </Header>
            
            {/* Recurring Revenue Section */}
            <RecurringSection>
                <SectionTitle>
                    <Calendar size={18} />
                    Recurring Revenue Projection
                </SectionTitle>
                <RecurringGrid>
                    <RecurringCard $weekly>
                        <RecurringIcon $weekly>
                            <Calendar size={24} />
                        </RecurringIcon>
                        <RecurringInfo>
                            <RecurringLabel>Weekly Recurring</RecurringLabel>
                            <RecurringAmount>${weeklyRecurring.toLocaleString()}</RecurringAmount>
                            <RecurringDetail>From all recurring walks</RecurringDetail>
                        </RecurringInfo>
                    </RecurringCard>
                    
                    <RecurringCard $yearly>
                        <RecurringIcon $yearly>
                            <TrendingUp size={24} />
                        </RecurringIcon>
                        <RecurringInfo>
                            <RecurringLabel>Yearly Projection</RecurringLabel>
                            <RecurringAmount>${yearlyRecurring.toLocaleString()}</RecurringAmount>
                            <RecurringDetail>52 weeks projected</RecurringDetail>
                        </RecurringInfo>
                    </RecurringCard>
                </RecurringGrid>
            </RecurringSection>
            
            {/* Historical Stats Section */}
            <StatsGrid>
                <StatCard>
                    <StatIcon>
                        <DollarSign size={20} />
                    </StatIcon>
                    <StatContent>
                        <StatLabel>Total Income This Year</StatLabel>
                        <StatValue>${totalIncome.toLocaleString()}</StatValue>
                    </StatContent>
                </StatCard>

                <StatCard>
                    <StatIcon>
                        <TrendingUp size={20} />
                    </StatIcon>
                    <StatContent>
                        <StatLabel>Estimated Yearly Total</StatLabel>
                        <StatValue>${estimatedYearlyTotal.toLocaleString()}</StatValue>
                    </StatContent>
                </StatCard>

                <StatCard>
                    <StatIcon>
                        <Calendar size={20} />
                    </StatIcon>
                    <StatContent>
                        <StatLabel>Monthly Average</StatLabel>
                        <StatValue>${monthlyIncome.toLocaleString()}</StatValue>
                    </StatContent>
                </StatCard>

                <StatCard>
                    <StatIcon>
                        <Calendar size={20} />
                    </StatIcon>
                    <StatContent>
                        <StatLabel>Weekly Average</StatLabel>
                        <StatValue>${weeklyIncome.toLocaleString()}</StatValue>
                    </StatContent>
                </StatCard>

                <StatCard>
                    <StatIcon>
                        <Receipt size={20} />
                    </StatIcon>
                    <StatContent>
                        <StatLabel>Tax Estimate</StatLabel>
                        <StatValue>${taxEstimate.toLocaleString()}</StatValue>
                    </StatContent>
                </StatCard>

                <StatCard>
                    <StatIcon>
                        <PiggyBank size={20} />
                    </StatIcon>
                    <StatContent>
                        <StatLabel>Tax Rate</StatLabel>
                        <TaxSelectWrapper>
                            <CompactSelect onChange={handleTaxChange} value={taxPercentage}>
                                <option value={15}>15%</option>
                                <option value={20}>20%</option>
                                <option value={25}>25%</option>
                            </CompactSelect>
                        </TaxSelectWrapper>
                    </StatContent>
                </StatCard>
            </StatsGrid>
        </Container>
    );
}

function calculateTotalIncome(invoices) {
    return invoices.reduce((total, inv) => total + (inv.compensation || 0), 0);
}

function calculateDailyAverage(totalIncome) {
    const today = dayjs();
    const startOfYear = dayjs().startOf("year");
    const daysPassed = today.diff(startOfYear, "day") + 1;

    return daysPassed > 0 ? totalIncome / daysPassed : 0;
}

function calculateWeeklyIncome(dailyAverage) {
    return Math.round(dailyAverage * 7);
}

function calculateMonthlyIncome(dailyAverage) {
    return Math.round(dailyAverage * 30.44);
}

function calculateEstimatedYearlyTotal(dailyAverage) {
    return Math.round(dailyAverage * 365);
}

function calculateRecurringRevenue(user) {
    if (!user || !user.appointments) {
        return { weeklyRecurring: 0, yearlyRecurring: 0 };
    }
    
    let weeklyTotal = 0;
    
    // Filter for recurring appointments that are not cancelled
    const recurringAppointments = user.appointments.filter(apt => 
        apt.recurring && !apt.canceled
    );
    
    recurringAppointments.forEach(appointment => {
        // Calculate the rate based on duration and whether it's solo
        let rate = 0;
        const duration = appointment.duration;
        
        if (appointment.solo) {
            rate = user.solo_rate || 0;
        } else {
            if (duration === 30) {
                rate = user.thirty || 0;
            } else if (duration === 40) {
                rate = user.fourty || 0;
            } else if (duration === 60) {
                rate = user.sixty || 0;
            }
        }
        
        // Count how many days per week this appointment occurs
        let daysPerWeek = 0;
        if (appointment.monday) daysPerWeek++;
        if (appointment.tuesday) daysPerWeek++;
        if (appointment.wednesday) daysPerWeek++;
        if (appointment.thursday) daysPerWeek++;
        if (appointment.friday) daysPerWeek++;
        if (appointment.saturday) daysPerWeek++;
        if (appointment.sunday) daysPerWeek++;
        
        // Add to weekly total
        weeklyTotal += rate * daysPerWeek;
    });
    
    return {
        weeklyRecurring: Math.round(weeklyTotal),
        yearlyRecurring: Math.round(weeklyTotal * 52)
    };
}

const Container = styled.div`
    background: rgba(255, 255, 255, 0.08);
    backdrop-filter: blur(20px);
    border-radius: 24px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    width: 100%;
    max-width: 800px;
    margin: 16px 0;
    padding: 24px;
    box-sizing: border-box;
    animation: fadeInUp 0.8s ease;
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    @media (max-width: 768px) {
        padding: 20px;
        border-radius: 20px;
    }
`;

const Header = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.3rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 20px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
`;

// New Recurring Revenue Section Styles
const RecurringSection = styled.div`
    margin-bottom: 24px;
`;

const SectionTitle = styled.h3`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;
`;

const RecurringGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    margin-bottom: 20px;
    
    @media (max-width: 480px) {
        grid-template-columns: 1fr;
    }
`;

const RecurringCard = styled.div`
    background: ${props => props.$weekly 
        ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.1))' 
        : 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(217, 70, 239, 0.1))'};
    border: 1px solid ${props => props.$weekly 
        ? 'rgba(16, 185, 129, 0.3)' 
        : 'rgba(168, 85, 247, 0.3)'};
    border-radius: 20px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s ease;
    animation: slideIn ${props => props.$weekly ? '0.5s' : '0.6s'} ease;
    
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-20px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    &:hover {
        transform: translateY(-2px) scale(1.02);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        background: ${props => props.$weekly 
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.15))' 
            : 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(217, 70, 239, 0.15))'};
    }
`;

const RecurringIcon = styled.div`
    width: 56px;
    height: 56px;
    background: ${props => props.$weekly 
        ? 'linear-gradient(135deg, #10b981, #06b6d4)' 
        : 'linear-gradient(135deg, #8b5cf6, #d946ef)'};
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
    box-shadow: ${props => props.$weekly 
        ? '0 6px 20px rgba(16, 185, 129, 0.3)' 
        : '0 6px 20px rgba(139, 92, 246, 0.3)'};
`;

const RecurringInfo = styled.div`
    flex: 1;
`;

const RecurringLabel = styled.div`
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 4px;
    font-weight: 500;
`;

const RecurringAmount = styled.div`
    font-size: 1.8rem;
    font-weight: 700;
    color: #ffffff;
    line-height: 1;
    margin-bottom: 6px;
    
    @media (max-width: 480px) {
        font-size: 1.5rem;
    }
`;

const RecurringDetail = styled.div`
    font-size: 0.75rem;
    color: rgba(255, 255, 255, 0.5);
    font-style: italic;
`;

const StatsGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    margin-bottom: 12px;
`;

const StatCard = styled.div`
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    
    /* Mobile-first padding */
    padding: 12px;
    
    &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: translateY(-1px);
        border-color: rgba(255, 255, 255, 0.25);
    }
    
    /* Larger screens get more padding */
    @media (min-width: 769px) {
        padding: 16px;
        gap: 12px;
    }
`;

const StatIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(165, 105, 167, 0.3);
    border-radius: 50%;
    color: #ffffff;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.2);
    
    /* Mobile-first smaller icons */
    width: 36px;
    height: 36px;
    
    /* Larger screens get bigger icons */
    @media (min-width: 769px) {
        width: 40px;
        height: 40px;
    }
`;

const StatContent = styled.div`
    flex: 1;
    text-align: left;
`;

const StatLabel = styled.div`
    font-family: 'Poppins', sans-serif;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 4px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const StatValue = styled.div`
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    
    /* Mobile-first smaller text */
    font-size: 1.1rem;
    
    /* Larger screens get bigger text */
    @media (min-width: 769px) {
        font-size: 1.2rem;
    }
`;

const TaxSelectWrapper = styled.div`
    position: relative;
`;

const CompactSelect = styled.select`
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 8px 12px;
    font-family: 'Poppins', sans-serif;
    font-size: 1.1rem;
    font-weight: 700;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 80px;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
    margin-top: 4px;
    
    &:focus {
        outline: none;
        border-color: #a569a7;
        background: rgba(255, 255, 255, 0.15);
    }
    
    &:hover {
        border-color: rgba(255, 255, 255, 0.3);
        background: rgba(255, 255, 255, 0.12);
    }
    
    option {
        background: #4a1a4a;
        color: #ffffff;
        padding: 8px;
    }
    
    @media (min-width: 769px) {
        font-size: 1.2rem;
    }
`;