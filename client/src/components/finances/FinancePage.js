import React, { useContext, useState } from "react";
import styled from "styled-components";
import { PetsContext } from "../../context/pets";

const currentYear = new Date().getFullYear();

const Container = styled.div`
    background: #f8f9fa;
    padding: 20px;
    margin-bottom: 10px;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.h3`
    font-size: 1.5rem;
    color: #343a40;
    margin-bottom: 10px;

    @media (max-width: 768px) {
        text-align: center;
    }
`;

const Select = styled.select`
    font-size: 1rem;
    padding: 10px;
    border-radius: 4px;
    border: 1px solid #ced4da;
    background: #fff;
    cursor: pointer;
    transition: border-color 0.3s ease;

    &:hover {
        border-color: #007bff;
    }
`;

const DetailRow = styled.div`
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    font-size: 1rem;
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
    const monthlyIncome = calculateMonthlyIncome(pets, currentYear);
    const weeklyIncome = calculateWeeklyIncome(pets, currentYear);
    const taxEstimate = Math.round((totalIncome * taxPercentage) / 100);

    function handleTaxPercentageChange(e) {
        setTaxPercentage(parseInt(e.target.value));
    }

    return (
        <Container>
            <Header>Overview for {currentYear}</Header>
            <DetailRow>
                <DetailLabel>Total Income:</DetailLabel>
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
                <DetailLabel>Tax Estimate:</DetailLabel>
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

function calculateMonthlyIncome(pets, year) {
    let monthlyIncome = Array(12).fill(0);
    pets?.forEach(pet => {
        pet.invoices.forEach(inv => {
            if (inv.date_completed.slice(0, 4) === year.toString()) {
                const month = parseInt(inv.date_completed.slice(5, 7)) - 1;
                monthlyIncome[month] += inv.compensation;
            }
        });
    });

    const today = new Date();
    const monthsPassed = today.getFullYear() === year ? today.getMonth() + 1 : 12;
    const totalIncome = monthlyIncome.slice(0, monthsPassed).reduce((a, b) => a + b, 0);

    return monthsPassed > 0 ? Math.round(totalIncome / monthsPassed) : 0;
}

function calculateWeeklyIncome(pets, year) {
    let totalIncome = 0;
    const today = new Date();
    const currentYearStart = new Date(year, 0, 1);

    // Calculate the number of weeks that have passed in the current year
    const weeksPassed = Math.ceil(((today - currentYearStart) / (1000 * 60 * 60 * 24 * 7)));

    pets?.forEach(pet => {
        pet.invoices.forEach(inv => {
            const invDate = new Date(inv.date_completed);
            if (invDate.getFullYear() === year && invDate <= today) {
                totalIncome += inv.compensation;
            }
        });
    });

    return weeksPassed > 0 ? Math.round(totalIncome / weeksPassed) : 0;
}
