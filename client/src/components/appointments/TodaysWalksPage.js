import React, { useContext } from "react";
import styled from "styled-components";
import { AppointmentsContext } from "../../context/appointments";
import TodaysAppointmentsCard from "./TodaysAppointmentsCard";
import dayjs from 'dayjs';

// Styled Components
const Container = styled.div`
    background: #f8f9fa;
    padding: 10px;  /* Match the padding from PetsPage */
    margin: 0 10px; /* Match the margin from PetsPage */
`;

const Header = styled.h2`
    font-size: 2rem;
    color: #343a40;
    margin: 0; /* Remove default margin */
    text-align: center;

    @media (max-width: 768px) {
        font-size: 1.75em;
    }
`;

const InstructionParagraph = styled.div`
    background: #ffffff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 15px 20px;
    margin: 10px auto;
    max-width: 600px;
    font-size: 1.125rem;
    color: #495057;
    text-align: left;

    @media (max-width: 768px) {
        font-size: 1rem;
    }
`;

const SubHeader = styled.h4`
    font-size: 1.5rem;
    margin: 10px 0;
    color: #495057;
    text-align: center; /* Align subheader text to center */
`;

const NoAppointmentsCard = styled.div`
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    padding: 20px;
    max-width: 600px;
    margin: 20px auto;
`;

const CardHeader = styled.h5`
    font-size: 1.5rem;
    color: #007bff;
    margin-bottom: 10px;
`;

const CardBody = styled.div`
    margin-top: 10px;
`;

const CardTitle = styled.h6`
    font-size: 1.25rem;
    color: #495057;
    margin: 10px 0;
`;

const CardText = styled.p`
    color: #6c757d;
`;

export default function TodaysWalksPage() {
    const { todaysAppointments, setTodaysAppointments } = useContext(AppointmentsContext);

    function getCurrentDateFormatted() {
        const currentDate = dayjs();
        return currentDate.format('MMMM DD, YYYY');
    }

    function updateAppointments(newApt) {
        const newAppointments = todaysAppointments.map((apt) => {
            if (apt.id === newApt.id) {
                return newApt;
            }
            return apt;
        });
        setTodaysAppointments(newAppointments);
    }

    const todayFormatted = getCurrentDateFormatted();

    return (
        <Container>
            <Header>Today's Appointments</Header>
            <SubHeader>{todayFormatted}</SubHeader>
            <InstructionParagraph>
                Below is your list of today's appointments (Total: {todaysAppointments.length}). As you finish each walk, mark it as completed, and the corresponding invoice will be automatically saved.
            </InstructionParagraph>
            {todaysAppointments?.length > 0 ? (
                <>
                    {todaysAppointments.map((apt) => (
                        <TodaysAppointmentsCard updateAppointments={updateAppointments} key={apt.id} apt={apt} />
                    ))}
                </>
            ) : (
                <NoAppointmentsCard>
                    <CardHeader>No appointments scheduled for today</CardHeader>
                    <CardBody>
                        <CardTitle>Visit the "Pets" page to create new appointments</CardTitle>
                        <CardText>
                            Appointments that are scheduled for today's date will be displayed here. You can complete them as you go, and an invoice will be created for each completed walk.
                        </CardText>
                    </CardBody>
                </NoAppointmentsCard>
            )}
        </Container>
    );
}
