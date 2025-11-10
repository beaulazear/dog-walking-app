import React, { useContext, useState } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import {
    TrendingUp,
    DollarSign,
    Calendar,
    PiggyBank,
    Receipt,
    BarChart3
} from "lucide-react";

dayjs.extend(weekOfYear);

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

    // Calculate weekly income data for chart
    const weeklyData = calculateWeeklyData(invoicesFromCurrentYear);
    const maxWeeklyIncome = Math.max(...weeklyData.map(w => w.amount), 1);

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
            
            {/* Weekly Income Chart */}
            <ChartSection>
                <SectionTitle>
                    <BarChart3 size={18} />
                    Weekly Income Overview
                </SectionTitle>
                <ChartContainer>
                    <ChartWithAxes>
                        <YAxisLabels>
                            <YAxisLabel>${Math.round(maxWeeklyIncome).toLocaleString()}</YAxisLabel>
                            <YAxisLabel>${Math.round(maxWeeklyIncome * 0.75).toLocaleString()}</YAxisLabel>
                            <YAxisLabel>${Math.round(maxWeeklyIncome * 0.5).toLocaleString()}</YAxisLabel>
                            <YAxisLabel>${Math.round(maxWeeklyIncome * 0.25).toLocaleString()}</YAxisLabel>
                            <YAxisLabel>$0</YAxisLabel>
                        </YAxisLabels>
                        <ChartContent>
                            <GridLines>
                                <GridLine />
                                <GridLine />
                                <GridLine />
                                <GridLine />
                                <GridLine />
                            </GridLines>
                            <ChartGrid>
                                {weeklyData.map((week, index) => (
                                    <BarWrapper key={index}>
                                        <Bar
                                            $height={(week.amount / maxWeeklyIncome) * 100}
                                            $delay={index * 0.02}
                                            $isCurrentWeek={week.isCurrent}
                                        >
                                            <BarTooltip>
                                                <TooltipWeek>Week {week.week}</TooltipWeek>
                                                <TooltipAmount>${week.amount.toLocaleString()}</TooltipAmount>
                                            </BarTooltip>
                                        </Bar>
                                        {week.isCurrent && <CurrentWeekLabel>Now</CurrentWeekLabel>}
                                    </BarWrapper>
                                ))}
                            </ChartGrid>
                            <XAxisLabels>
                                <XAxisLabel>1</XAxisLabel>
                                <XAxisLabel>10</XAxisLabel>
                                <XAxisLabel>20</XAxisLabel>
                                <XAxisLabel>30</XAxisLabel>
                                <XAxisLabel>40</XAxisLabel>
                                <XAxisLabel>52</XAxisLabel>
                            </XAxisLabels>
                        </ChartContent>
                    </ChartWithAxes>
                    <ChartLabel>Week of the Year</ChartLabel>
                </ChartContainer>
            </ChartSection>

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

        // First get the duration-based rate
        if (duration === 30) {
            rate = user.thirty || 0;
        } else if (duration === 45) {
            rate = user.fortyfive || 0;
        } else if (duration === 60) {
            rate = user.sixty || 0;
        }

        // Add solo upcharge if this is a solo walk
        if (appointment.solo) {
            rate += user.solo_rate || 0;
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

function calculateWeeklyData(invoices) {
    // Initialize array for 52 weeks
    const weeks = Array.from({ length: 52 }, (_, i) => ({
        week: i + 1,
        amount: 0,
        isCurrent: false
    }));

    const currentWeekNumber = dayjs().week();

    // Aggregate invoices by week
    invoices.forEach(invoice => {
        const invoiceDate = dayjs(invoice.date_completed);
        const weekNumber = invoiceDate.week();

        if (weekNumber > 0 && weekNumber <= 52) {
            weeks[weekNumber - 1].amount += invoice.compensation || 0;
        }
    });

    // Mark current week
    if (currentWeekNumber > 0 && currentWeekNumber <= 52) {
        weeks[currentWeekNumber - 1].isCurrent = true;
    }

    return weeks;
}

const Container = styled.div`
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(20px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
    width: 100%;
    padding: 24px 20px;
    box-sizing: border-box;
    overflow: hidden;
    animation: fadeInUp 0.8s ease;
    position: relative;
    z-index: 1;

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

// Chart Styles
const ChartSection = styled.div`
    margin-bottom: 24px;
    width: 100%;
    overflow: visible;
    box-sizing: border-box;
`;

const ChartContainer = styled.div`
    background: rgba(255, 255, 255, 0.05);
    border-radius: 16px;
    padding: 24px 16px 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    overflow: visible;
    width: 100%;
    box-sizing: border-box;

    @media (max-width: 768px) {
        padding: 16px 12px 12px;
    }
`;

const ChartWithAxes = styled.div`
    display: flex;
    gap: 12px;
    position: relative;
    width: 100%;
    overflow: visible;

    @media (max-width: 768px) {
        gap: 8px;
    }
`;

const YAxisLabels = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 200px;
    padding-bottom: 8px;
    padding-top: 60px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        height: 150px;
        padding-top: 50px;
    }
`;

const YAxisLabel = styled.div`
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;
    white-space: nowrap;
    text-align: right;
    min-width: 50px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        font-size: 0.6rem;
        min-width: 35px;
    }

    @media (max-width: 480px) {
        font-size: 0.55rem;
        min-width: 30px;
    }
`;

const ChartContent = styled.div`
    flex: 1;
    position: relative;
    min-width: 0;
    overflow: visible;
`;

const GridLines = styled.div`
    position: absolute;
    top: 60px;
    left: 0;
    right: 0;
    height: 200px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding-bottom: 8px;
    pointer-events: none;

    @media (max-width: 768px) {
        height: 150px;
        top: 50px;
    }
`;

const GridLine = styled.div`
    width: 100%;
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
`;

const XAxisLabels = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    padding: 0 4px;
    width: 100%;

    @media (max-width: 768px) {
        margin-top: 6px;
        padding: 0 2px;
    }
`;

const XAxisLabel = styled.div`
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 600;

    @media (max-width: 768px) {
        font-size: 0.6rem;
    }

    @media (max-width: 480px) {
        font-size: 0.55rem;
    }
`;

const ChartGrid = styled.div`
    display: flex;
    align-items: flex-end;
    gap: 4px;
    height: 200px;
    padding-bottom: 8px;
    padding-top: 60px;
    overflow-x: auto;
    overflow-y: visible;
    position: relative;
    z-index: 1;

    &::-webkit-scrollbar {
        height: 6px;
    }

    &::-webkit-scrollbar-track {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.2);
        border-radius: 3px;
    }

    @media (max-width: 768px) {
        height: 150px;
        gap: 2px;
        padding-top: 50px;
    }
`;

const BarWrapper = styled.div`
    flex: 1;
    min-width: 12px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    position: relative;
`;

const BarTooltip = styled.div`
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(0);
    background: rgba(0, 0, 0, 0.9);
    padding: 8px 12px;
    border-radius: 8px;
    white-space: nowrap;
    opacity: 0;
    pointer-events: none;
    transition: all 0.3s ease;
    z-index: 9999;
    border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Bar = styled.div`
    width: 100%;
    height: ${props => props.$height}%;
    min-height: ${props => props.$height > 0 ? '3px' : '0'};
    background: ${props => props.$isCurrentWeek
        ? 'linear-gradient(to top, #fbbf24, #f59e0b)'
        : 'linear-gradient(to top, #10b981, #06b6d4)'};
    border-radius: 4px 4px 0 0;
    position: relative;
    transition: all 0.3s ease;
    animation: growBar ${props => 0.5 + props.$delay}s ease-out;
    cursor: pointer;
    box-shadow: ${props => props.$isCurrentWeek
        ? '0 -2px 12px rgba(251, 191, 36, 0.4)'
        : '0 -2px 8px rgba(16, 185, 129, 0.3)'};

    @keyframes growBar {
        from {
            height: 0%;
            opacity: 0;
        }
        to {
            height: ${props => props.$height}%;
            opacity: 1;
        }
    }

    &:hover {
        transform: scaleY(1.05);
        filter: brightness(1.2);
        box-shadow: ${props => props.$isCurrentWeek
            ? '0 -4px 20px rgba(251, 191, 36, 0.6)'
            : '0 -4px 16px rgba(16, 185, 129, 0.5)'};

        ${BarTooltip} {
            opacity: 1;
            transform: translateX(-50%) translateY(-8px);
        }
    }
`;

const TooltipWeek = styled.div`
    font-size: 0.7rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 2px;
`;

const TooltipAmount = styled.div`
    font-size: 0.9rem;
    font-weight: 700;
    color: #ffffff;
`;

const CurrentWeekLabel = styled.div`
    position: absolute;
    bottom: -20px;
    font-size: 0.65rem;
    font-weight: 700;
    color: #fbbf24;
    text-transform: uppercase;
    letter-spacing: 0.5px;
`;

const ChartLabel = styled.div`
    text-align: center;
    margin-top: 16px;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.6);
    text-transform: uppercase;
    letter-spacing: 1px;

    @media (max-width: 768px) {
        font-size: 0.75rem;
        margin-top: 12px;
    }
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