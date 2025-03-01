import React, { useContext, useState } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";

export default function TodaysWalks() {
    const { user } = useContext(UserContext);

    const todaysAppointments = (user?.appointments
        ?.filter(appointment => {
            if (appointment.canceled) return false;

            const todayFormatted = dayjs().format("YYYY-MM-DD");

            const hasCancellationToday = appointment.cancellations?.some(cancellation =>
                dayjs(cancellation.date).format("YYYY-MM-DD") === todayFormatted
            );

            if (appointment.recurring) {
                return appointment[dayjs().format("dddd").toLowerCase()] && !hasCancellationToday;
            }

            return dayjs(appointment.appointment_date).format("YYYY-MM-DD") === todayFormatted;
        })
        ?.sort((a, b) => {
            const startA = dayjs(a.start_time, "HH:mm");
            const startB = dayjs(b.start_time, "HH:mm");
            const endA = dayjs(a.end_time, "HH:mm");
            const endB = dayjs(b.end_time, "HH:mm");

            if (startA.isBefore(startB)) return -1;
            if (startA.isAfter(startB)) return 1;

            return endA.isBefore(endB) ? -1 : 1;
        }) || []);

    return (
        <Container>
            <Title>Today's Walks</Title>
            <Subtitle>{dayjs().format("MMMM D, YYYY")}</Subtitle>
            <Text>You have {todaysAppointments.length} {todaysAppointments.length === 1 ? 'walk' : 'walks'} scheduled for today.</Text>

            {todaysAppointments.length === 0 ? (
                <NoWalksCard>No scheduled walks for today.</NoWalksCard>
            ) : (
                <WalkList>
                    {todaysAppointments.map(appointment => (
                        <WalkCard key={appointment.id} appointment={appointment} />
                    ))}
                </WalkList>
            )}
        </Container>
    );
}

const hasInvoiceForToday = (appointment, invoices) => {
    const todayString = dayjs().format("YYYY-MM-DD");
    return invoices?.some(invoice => {
        const invoiceDate = invoice.date_completed.slice(0, 10);
        return invoiceDate === todayString && invoice.appointment_id === appointment.id && !invoice.cancelled;
    });
};

const hasCancelledInvoiceForToday = (appointment, invoices) => {
    const todayString = dayjs().format("YYYY-MM-DD");
    return invoices?.some(invoice => {
        const invoiceDate = invoice.date_completed.slice(0, 10);
        return invoiceDate === todayString && invoice.appointment_id === appointment.id && invoice.cancelled;
    });
};

const WalkCard = ({ appointment }) => {
    const { user, setUser } = useContext(UserContext);
    const [isCompleted, setIsCompleted] = useState(
        hasInvoiceForToday(appointment, user?.invoices)
    );
    const [isCancelled, setIsCancelled] = useState(
        hasCancelledInvoiceForToday(appointment, user?.invoices)
    );

    const handleCompleteWalk = async () => {
        const offsetInput = window.prompt("Enter an upcharge or discount amount ($):\n(Negative number for discount, positive for upcharge)", "0");

        const offset = parseFloat(offsetInput) || 0;

        let compensation = appointment.duration === 30 ? user.thirty :
            appointment.duration === 40 ? user.fourty :
                appointment.duration === 60 ? user.sixty : 0;

        compensation += offset;

        const response = await fetch("/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pet_id: appointment.pet.id,
                appointment_id: appointment.id,
                date_completed: dayjs().toISOString(),
                paid: false,
                compensation,
                title: `${appointment.duration} min walk`
            }),
        });

        if (response.ok) {
            const newInvoice = await response.json();
            setUser(prevUser => ({
                ...prevUser,
                invoices: [...prevUser.invoices, newInvoice]
            }));
            setIsCompleted(true);
        }
    };

    const handleCancelWalk = async () => {
        const cancellationFee = prompt("Enter a cancellation fee (or leave blank for $0):", "0");
        if (cancellationFee === null) return;

        const response = await fetch("/invoices", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                pet_id: appointment.pet.id,
                appointment_id: appointment.id,
                date_completed: dayjs().toISOString(),
                paid: false,
                compensation: parseFloat(cancellationFee) || 0,
                title: `Canceled ${appointment.duration} min walk`,
                cancelled: true
            }),
        });

        if (response.ok) {
            const newInvoice = await response.json();
            setUser(prevUser => ({
                ...prevUser,
                invoices: [...prevUser.invoices, newInvoice]
            }));
            setIsCancelled(true)
        }
    };

    return (
        <Card $completed={isCompleted} $cancelled={isCancelled}>
            <PetImage
                src={appointment.pet?.profile_pic || dogPlaceholder}
                onError={(e) => (e.target.src = dogPlaceholder)}
                alt={appointment.pet?.name}
            />
            {!isCompleted && !isCancelled && (
                <>
                    <WalkDetails>
                        <Text><strong>{appointment.pet?.name}</strong></Text>
                        <Text>{appointment.duration} minute {appointment.solo ? 'solo' : 'group'} walk</Text>
                        <Text>{dayjs(appointment.start_time).format("h:mm A")} - {dayjs(appointment.end_time).format("h:mm A")}</Text>
                    </WalkDetails>
                    <ButtonContainer>
                        <CompleteButton onClick={handleCompleteWalk}>Complete</CompleteButton>
                        <CancelButton onClick={handleCancelWalk}>Cancel</CancelButton>
                    </ButtonContainer>
                </>
            )}
            {(isCompleted || isCancelled) && (
                <WalkDetails>
                    <Text><strong>{appointment.pet?.name}</strong></Text>
                    <Text>{appointment.duration} minute {appointment.solo ? 'solo' : 'group'} walk</Text>
                </WalkDetails>
            )}
            {isCompleted && <CompletedTag><strong>✅Completed</strong></CompletedTag>}
            {isCancelled && <CompletedTag><strong>❌Cancelled</strong></CompletedTag>}
        </Card>
    );
};

const ButtonContainer = styled.div`
    display: flex;
    flex-direction: row;
    gap: 10px;

    @media (max-width: 600px) {
        flex-direction: column;
    }
`;

const Container = styled.div`
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    min-height: 100vh;
    padding: 40px 20px;
    padding-top: 80px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
`;

const Title = styled.h2`
    font-size: 2rem;
    color: white;
    margin-bottom: 10px;
`;

const Subtitle = styled.h3`
    font-size: 1.5rem;
    margin: 0;
    color: #fff;
`;

const Text = styled.p`
    color: white;
    font-size: 1rem;
    margin: 10px 0;
`;

const NoWalksCard = styled.div`
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 500px;
    margin-top: 20px;
    text-align: center;
`;

const WalkList = styled.div`
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: 600px;
    margin-top: 20px;
`;

const Card = styled.div`
    background: ${({ $completed, $cancelled }) =>
        $completed ? "#1E7D32" :  // Dark green for completed walks
            $cancelled ? "#B22222" :  // Firebrick red for cancelled walks
                "#8750A6"};

    backdrop-filter: blur(10px);
    padding: 15px;
    border-radius: 12px;
    box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
    transition: 0.3s ease-in-out;

    &:hover {
        transform: scale(1.02);
    }
`;

const WalkDetails = styled.div`
    flex-grow: 1;
    text-align: left;
`;

const PetImage = styled.img`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 15px;
`;

const CompleteButton = styled.button`
    background: #198754; /* Dark green for completion */
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.3s ease-in-out;

    &:hover {
        background: #146c43; /* Deeper green for contrast */
    }
`;

const CancelButton = styled.button`
    background: #d9534f; /* Bold red for cancellation */
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-weight: bold;
    transition: background 0.3s ease-in-out;

    &:hover {
        background: #b52b27; /* Deeper red for better contrast */
    }
`;

const CompletedTag = styled.div`
    color: white;
    padding: 6px 12px;
    border-radius: 6px;
`;