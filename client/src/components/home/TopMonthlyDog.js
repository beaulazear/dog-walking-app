import React, { useContext } from "react";
import { PetsContext } from "../../context/pets";
import styled from "styled-components";
import dog from '../appointments/dog.jpg'

// Updated Card styling to match BirthdayAlert
const Card = styled.div`
  background: #f8f9fa;
  border-radius: 12px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin: 20px 0;
  font-size: 1.25rem;
  max-width: 900px;
  width: 100%;
  display: flex;
  align-items: center;
  gap: 20px;
  flex-direction: row;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }
`;

const PetImage = styled.img`
  width: 80px; /* Match the birthday card image size */
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
`;

const PetDetails = styled.div`
  display: flex;
  flex-direction: column;
  text-align: left;
  gap: 5px;
`;

const PetName = styled.h3`
  font-size: 1.5rem;
  color: #007bff;
  margin: 0;
`;

const PetInfo = styled.p`
  color: #495057;
  margin: 0;
`;

export default function TopMonthlyDog() {
    const { pets } = useContext(PetsContext);

    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();

    const getInvoicesFromAppointments = (appointments) => {
        return appointments.reduce((invoices, appointment) => {
            return [...invoices, ...(appointment.invoices || [])];
        }, []);
    };

    const getMonthlyInvoices = (invoices) => {
        return invoices.filter((invoice) => {
            const invoiceDate = new Date(invoice.date_completed);
            return (
                invoiceDate.getMonth() === currentMonth &&
                invoiceDate.getFullYear() === currentYear
            );
        });
    };

    const topPet = pets.reduce((maxPet, pet) => {
        const monthlyInvoices = getMonthlyInvoices(
            getInvoicesFromAppointments(pet.appointments || [])
        );
        if (
            monthlyInvoices.length >
            getMonthlyInvoices(
                getInvoicesFromAppointments(maxPet.appointments || [])
            ).length
        ) {
            return pet;
        }
        return maxPet;
    }, {});

    const monthlyInvoicesCount = getMonthlyInvoices(
        getInvoicesFromAppointments(topPet.appointments || [])
    ).length;

    return (
        <>
            {topPet && (
                <Card>
                    <PetImage
                        src={topPet.profile_pic || dog}
                        onError={(e) => { e.target.src = dog; }}
                        alt={topPet.name}
                    />
                    <PetDetails>
                        <PetName>Your Top Walker</PetName>
                        <PetInfo>
                            {topPet.name} has walked with you {monthlyInvoicesCount || 0} times this month. 💕
                        </PetInfo>
                    </PetDetails>
                </Card>
            )}
        </>
    );
}
