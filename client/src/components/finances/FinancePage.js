import React, { useContext, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { PetsContext } from "../../context/pets";

const currentYear = new Date().getFullYear();

export default function FinancePage() {
    const [taxPercentage, setTaxPercentage] = useState(15);
    const { pets } = useContext(PetsContext);

    const totalIncome = calculateTotalIncome(pets, currentYear);
    const taxEstimate = Math.round((totalIncome * taxPercentage) / 100);

    function handleTaxPercentageChange(e) {
        setTaxPercentage(parseInt(e.target.value));
    }

    return (
        <div style={{ marginBottom: '35px', marginLeft: '15px' }}>
            <h3>{currentYear} Income: ${totalIncome}</h3>
            <h3>Tax Estimate: ${taxEstimate}</h3>
            <select onChange={handleTaxPercentageChange} value={taxPercentage}>
                <option value={15}>15%</option>
                <option value={20}>20%</option>
                <option value={25}>25%</option>
            </select>
        </div>
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
