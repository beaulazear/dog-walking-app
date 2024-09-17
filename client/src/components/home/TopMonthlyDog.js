import React, { useContext } from "react";
import { PetsContext } from "../../context/pets";
import styled from "styled-components";

const Card = styled.div`
    background: #ffffff;
    border-radius: 12px;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
    margin: 20px 0;
    padding: 20px;
    width: 100%;
    max-width: 900px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    &:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
    }
    box-sizing: border-box;
    text-align: center;
`;

const PetImage = styled.img`
    border-radius: 50%;
    width: 100px;
    height: 100px;
    object-fit: cover;
    margin: 0 auto 10px auto;
`;

const PetName = styled.h2`
    font-size: 1.5em;
    margin: 0;
`;

const PetInfo = styled.p`
    font-size: 1em;
    color: #555;
`;

export default function TopMonthlyDog() {
    const { pets } = useContext(PetsContext);

    // Get current month and year
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth(); // 0 for January, 11 for December
    const currentYear = currentDate.getFullYear();

    // Filter invoices by current month and year
    const getMonthlyInvoices = (invoices) => {
        return invoices.filter((invoice) => {
            const invoiceDate = new Date(invoice.date); // Assuming each invoice has a 'date' field
            return (
                invoiceDate.getMonth() === currentMonth &&
                invoiceDate.getFullYear() === currentYear
            );
        });
    };

    // Find the pet with the most invoices for the current month
    const topPet = pets.reduce((maxPet, pet) => {
        const monthlyInvoices = getMonthlyInvoices(pet.invoices || []);
        if (monthlyInvoices.length > (getMonthlyInvoices(maxPet.invoices || []).length)) {
            return pet;
        }
        return maxPet;
    }, {});

    const monthlyInvoicesCount = getMonthlyInvoices(topPet.invoices || []).length;

    return (
        <Card>
            <PetImage src={topPet.profile_pic || 'https://via.placeholder.com/100'} alt={topPet.name} />
            <PetName>{topPet.name}</PetName>
            <PetInfo>Most Walks this Month: {monthlyInvoicesCount || 0}</PetInfo>
            <PetInfo>Congratulations {topPet.name}! 💕</PetInfo>
        </Card>
    );
}
