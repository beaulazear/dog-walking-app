import React, { useContext, useState } from "react";
import styled from 'styled-components';
import { PetsContext } from "../../context/pets";

const currentYear = new Date().getFullYear();

const Container = styled.div`
    padding: 20px;
    background: #ffffff;
    margin: 20px auto; // Center horizontally with auto margins
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    max-width: 600px;
    width: 100%; // Ensure it takes full width up to max-width
    box-sizing: border-box; // Include padding and border in the element's total width and height
`;

const Header = styled.h3`
    font-size: 1.75rem;
    color: #343a40;
    margin-bottom: 20px;
    text-align: center; // Centered text for better appearance
`;

const Select = styled.select`
    font-size: 1.1rem;
    padding: 12px;
    border-radius: 5px;
    border: 1px solid #ced4da;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.3s ease;
    margin-top: 20px;
    width: 100%; // Full width of the container
    box-sizing: border-box; // Include padding and border in the element's total width and height

    &:hover {
        border-color: #007bff;
    }
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 15px;
    font-size: 1.3rem;
`;

const DetailLabel = styled.span`
    font-weight: bold;
    color: #495057;
`;

const DetailValue = styled.span`
    color: #007bff;
`;

export default function FinancePage() {
    const [taxPercentage, setTaxPercentage] = useState(15);
    const { pets } = useContext(PetsContext);

    const totalIncome = calculateTotalIncome(pets, currentYear);
    const dailyAverage = calculateDailyAverage(totalIncome, currentYear);
    const monthlyIncome = calculateMonthlyIncome(dailyAverage);
    const weeklyIncome = calculateWeeklyIncome(dailyAverage);
    const estimatedYearlyTotal = calculateEstimatedYearlyTotal(dailyAverage);
    const taxEstimate = Math.round((estimatedYearlyTotal * taxPercentage) / 100);

    function handleTaxPercentageChange(e) {
        setTaxPercentage(parseInt(e.target.value));
    }

    return (
        <Container>
            <Header>Overview for {currentYear}</Header>
            <DetailRow>
                <DetailLabel>Current Income This Year:</DetailLabel>
                <DetailValue>${totalIncome}</DetailValue>
            </DetailRow>
            <DetailRow>
                <DetailLabel>Monthly Average Income:</DetailLabel>
                <DetailValue>${monthlyIncome}</DetailValue>
            </DetailRow>
            <DetailRow>
                <DetailLabel>Weekly Average Income:</DetailLabel>
                <DetailValue>${weeklyIncome}</DetailValue>
            </DetailRow>
            <DetailRow>
                <DetailLabel>Estimated Yearly Total:</DetailLabel>
                <DetailValue>${estimatedYearlyTotal}</DetailValue>
            </DetailRow>
            <DetailRow>
                <DetailLabel>Yearly Estimate Taxes:</DetailLabel>
                <DetailValue>${taxEstimate}</DetailValue>
            </DetailRow>
            <Select onChange={handleTaxPercentageChange} value={taxPercentage}>
                <option value={15}>15%</option>
                <option value={20}>20%</option>
                <option value={25}>25%</option>
            </Select>
        </Container>
    );
}

function calculateTotalIncome(pets, year) {
    let totalIncome = 0;
    pets?.forEach(pet => {
        pet.invoices.forEach(inv => {
            if (inv.date_completed.slice(0, 4) === year.toString()) {
                totalIncome += inv.compensation;
            }
        });
        pet.additional_incomes.forEach(income => {
            totalIncome += income.compensation;
        });
    });
    return totalIncome;
}

function calculateDailyAverage(totalIncome, year) {
    const today = new Date();
    const startOfYear = new Date(year, 0, 1);

    const daysPassed = Math.ceil((today - startOfYear) / (1000 * 60 * 60 * 24));

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
