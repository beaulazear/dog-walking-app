import React, { useContext, useState } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import dayjs from "dayjs";
import { 
    TrendingUp, 
    DollarSign, 
    Calendar, 
    Calculator,
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

    function handleTaxChange(e) {
        setTaxPercentage(parseInt(e.target.value));
    }

    return (
        <Container>
            <Header>
                <TrendingUp size={24} />
                Yearly Finance Overview ({currentYear})
            </Header>
            
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
            </StatsGrid>

            <TaxSelector>
                <TaxLabel>
                    <PiggyBank size={18} />
                    Tax Rate
                </TaxLabel>
                <TaxSelectWrapper>
                    <Select onChange={handleTaxChange} value={taxPercentage}>
                        <option value={15}>15%</option>
                        <option value={20}>20%</option>
                        <option value={25}>25%</option>
                    </Select>
                </TaxSelectWrapper>
            </TaxSelector>
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

const Container = styled.div`
    background: linear-gradient(145deg, rgba(74, 26, 74, 0.9), rgba(107, 43, 107, 0.8));
    border-radius: 16px;
    border: 2px solid rgba(139, 90, 140, 0.4);
    backdrop-filter: blur(20px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    transition: all 0.3s ease;
    width: 100%;
    max-width: 600px;
    margin: 16px 0;
    padding: 16px;
    box-sizing: border-box;
    
    &:hover {
        transform: translateY(-1px);
        box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
        border-color: #a569a7;
    }
`;

const Header = styled.h2`
    font-family: 'Poppins', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: #ffffff;
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
    gap: 8px;
    text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
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

const TaxSelector = styled.div`
    background: rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    /* Mobile-first: stack vertically with smaller padding */
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: stretch;
    
    /* Larger screens: horizontal layout with more padding */
    @media (min-width: 481px) {
        padding: 16px;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
    }
`;

const TaxLabel = styled.label`
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    gap: 8px;
`;

const TaxSelectWrapper = styled.div`
    position: relative;
`;

const Select = styled.select`
    background: rgba(255, 255, 255, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 10px 16px;
    font-family: 'Poppins', sans-serif;
    font-size: 1rem;
    font-weight: 500;
    color: #ffffff;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 80px;
    
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
`;