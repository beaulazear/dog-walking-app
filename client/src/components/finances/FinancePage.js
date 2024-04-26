import React, { useContext, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import { PetsContext } from "../../context/pets"

export default function FinancePage() {

    const [fifteen, setFifteen] = useState(true)
    const [twenty, setTwenty] = useState(false)
    const [twentyFive, setTwentyFive] = useState(false)

    function updateTaxPercentage(e) {
        console.log(e.target.value)
        if (e.target.value === '20') {
            setFifteen(false)
            setTwenty(true)
            setTwentyFive(false)
        } else if (e.target.value === '25') {
            setFifteen(false)
            setTwenty(false)
            setTwentyFive(true)
        } else {
            setFifteen(true)
            setTwenty(false)
            setTwentyFive(false)
        }
    }

    const { pets } = useContext(PetsContext)

    let totalIncome = 0

    const thisYearStr = new Date().getFullYear().toString()

    pets?.forEach(pet => {
        pet.invoices.forEach(inv => {
            if (inv.date_completed.slice(0, 4) === thisYearStr) {
                totalIncome += inv.compensation
            }
        })
        pet.additional_incomes.forEach(income => {
            totalIncome += income.compensation
        })
    });

    return (
        <div style={{ marginBottom: '35px', marginLeft: '15px' }}>
            <h3>{thisYearStr} Income: ${totalIncome}</h3>
            {fifteen && (
                <h3>Tax Estimate: ${Math.round(totalIncome * 0.15)}</h3>
            )}
            {twenty && (
                <h3>Tax Estimate: ${Math.round(totalIncome * 0.20)}</h3>
            )}
            {twentyFive && (
                <h3>Tax Estimate: ${Math.round(totalIncome * 0.25)}</h3>
            )}
            <select onChange={updateTaxPercentage} defaultValue="15">
                <option value="15">15%</option>
                <option value="20">20%</option>
                <option value="25">25%</option>
            </select>
        </div>
    )
}
