import React, { useContext, useState } from "react";
import styled from "styled-components";
import { UserContext } from "../context/user";
import dayjs from "dayjs";

const currentYear = dayjs().year();

export default function YearlyFinanceOverview() {
    const { user } = useContext(UserContext);
    const [taxPercentage, setTaxPercentage] = useState(15);

    // Filter invoices from 2025
    const invoicesFromCurrentYear = user?.invoices?.filter(inv =>
        dayjs(inv.date_completed).year() === currentYear
    ) || [];

    // Calculate totals and estimates
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
            <Header>📊 Yearly Finance Overview ({currentYear})</Header>
            <DetailRow>
                <DetailLabel>💰 Total Income This Year:</DetailLabel>
                <DetailValue>${totalIncome.toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
                <DetailLabel>📅 Estimated Yearly Total:</DetailLabel>
                <DetailValue>${estimatedYearlyTotal.toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
                <DetailLabel>📆 Monthly Average Income:</DetailLabel>
                <DetailValue>${monthlyIncome.toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
                <DetailLabel>📖 Weekly Average Income:</DetailLabel>
                <DetailValue>${weeklyIncome.toLocaleString()}</DetailValue>
            </DetailRow>
            <DetailRow>
                <DetailLabel>🏛 Tax Estimate:</DetailLabel>
                <DetailValue>${taxEstimate.toLocaleString()}</DetailValue>
            </DetailRow>

            <TaxSelector>
                <Label>💸 Tax Rate:</Label>
                <Select onChange={handleTaxChange} value={taxPercentage}>
                    <option value={15}>15%</option>
                    <option value={20}>20%</option>
                    <option value={25}>25%</option>
                </Select>
            </TaxSelector>
        </Container>
    );
}

// ✅ Function to calculate total income from invoices
function calculateTotalIncome(invoices) {
    return invoices.reduce((total, inv) => total + (inv.compensation || 0), 0);
}

// ✅ Function to calculate daily average income
function calculateDailyAverage(totalIncome) {
    const today = dayjs();
    const startOfYear = dayjs().startOf("year");
    const daysPassed = today.diff(startOfYear, "day") + 1; // Ensure at least 1 day

    return daysPassed > 0 ? totalIncome / daysPassed : 0;
}

// ✅ Function to calculate estimated weekly income
function calculateWeeklyIncome(dailyAverage) {
    return Math.round(dailyAverage * 7);
}

// ✅ Function to calculate estimated monthly income
function calculateMonthlyIncome(dailyAverage) {
    return Math.round(dailyAverage * 30.44); // Avg. days in a month
}

// ✅ Function to estimate total yearly income
function calculateEstimatedYearlyTotal(dailyAverage) {
    return Math.round(dailyAverage * 365);
}

// 📌 Styled Components
const Container = styled.div`
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 800px;
    text-align: center;
`;

const Header = styled.h2`
    font-size: 1.75rem;
    color: white;
    margin-bottom: 15px;
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    font-size: 1rem;
    margin-bottom: 8px;
    padding: 10px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
`;

const DetailLabel = styled.span`
    font-weight: bold;
    color: white;
`;

const DetailValue = styled.span`
    color: white;
`;

const TaxSelector = styled.div`
    margin-top: 15px;
`;

const Label = styled.label`
    font-size: 1rem;
    color: white;
    margin-right: 10px;
`;

const Select = styled.select`
    font-size: 1rem;
    padding: 8px;
    border-radius: 4px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    cursor: pointer;
    transition: background 0.3s;

    &:hover {
        background: rgba(255, 255, 255, 0.3);
    }
`;