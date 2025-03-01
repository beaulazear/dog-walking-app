import React, { useContext, useState, useEffect } from "react";
import styled from "styled-components";
import dayjs from "dayjs";
import { UserContext } from "../context/user";
import dogPlaceholder from "../assets/dog.png";

const getUpcomingBirthday = (pets) => {
    const today = dayjs().startOf("day");
    let closestPet = null;
    let minDays = Infinity;

    pets.forEach(pet => {
        if (pet.birthdate) {
            const birthdate = dayjs(pet.birthdate);
            const birthdayThisYear = birthdate.year(today.year());
            const birthdayNextYear = birthdate.year(today.year() + 1);

            let upcomingBirthday = birthdayThisYear.isAfter(today) 
                ? birthdayThisYear 
                : birthdayNextYear;

            const daysUntil = upcomingBirthday.diff(today, "day");

            if (daysUntil < minDays) {
                minDays = daysUntil;
                closestPet = { ...pet, upcomingBirthday };
            }
        }
    });

    return closestPet;
};

export default function Dashboard() {
    const { user, setUser } = useContext(UserContext);
    const [selectedDate, setSelectedDate] = useState(dayjs().format("YYYY-MM-DD"));
    const [upcomingBirthdayPet, setUpcomingBirthdayPet] = useState(null);
    const [rates, setRates] = useState({
        thirty: user?.thirty || "",
        fourty: user?.fourty || "",
        sixty: user?.sixty || "",
        solo_rate: user?.solo_rate || "",
    });

    useEffect(() => {
        if (user?.pets) {
            setUpcomingBirthdayPet(getUpcomingBirthday(user.pets));
        }
    }, [user]);

    const handleRateChange = (e) => {
        setRates({
            ...rates,
            [e.target.name]: e.target.value
        });
    };

    const handleRateUpdate = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("/change_rates", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(rates),
                credentials: "include"
            });

            if (response.ok) {
                const updatedUser = await response.json();
                setUser(updatedUser);
                alert("Rates updated successfully!");
            } else {
                console.error("Failed to update rates.");
            }
        } catch (error) {
            console.error("Error updating rates:", error);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch("/logout", {
                method: "DELETE",
                credentials: "include",
            });

            if (response.ok) {
                setUser(null);
            } else {
                console.error("Logout failed.");
            }
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    const isRecurringOnDate = (appointment, date) => {
        const dayOfWeek = dayjs(date).day();
        const recurringDays = {
            0: appointment.sunday,
            1: appointment.monday,
            2: appointment.tuesday,
            3: appointment.wednesday,
            4: appointment.thursday,
            5: appointment.friday,
            6: appointment.saturday
        };
        return recurringDays[dayOfWeek];
    };

    const getAppointmentsForDate = (date) => {
        return user?.appointments?.filter(appointment => {
            if (appointment.canceled) return false;
            if (appointment.recurring) {
                return isRecurringOnDate(appointment, date);
            }
            return dayjs(appointment.appointment_date).format("YYYY-MM-DD") === date;
        }) || [];
    };

    const appointments = getAppointmentsForDate(selectedDate);

    return (
        <Container>
            <Section>
                <Title>📅 Schedule Overview</Title>
                <Text>Select a date to view scheduled appointments.</Text>
                <DateInput
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                />
                <ListGroup>
                    {appointments.length === 0 ? (
                        <Text>No appointments scheduled for this date.</Text>
                    ) : (
                        appointments.map((appointment) => (
                            <ListItem key={appointment.id}>
                                <PetImage
                                    src={appointment.pet?.profile_pic || dogPlaceholder}
                                    onError={(e) => (e.target.src = dogPlaceholder)}
                                    alt={appointment.pet?.name}
                                />
                                <div>
                                    <Text><strong>{appointment.pet?.name}</strong></Text>
                                    <Text>{dayjs(appointment.start_time).format("h:mm A")} - {dayjs(appointment.end_time).format("h:mm A")}</Text>
                                </div>
                            </ListItem>
                        ))
                    )}
                </ListGroup>
            </Section>
            {upcomingBirthdayPet && (
                <BirthdayCard>
                    <PetImage
                        src={upcomingBirthdayPet.profile_pic || dogPlaceholder}
                        onError={(e) => (e.target.src = dogPlaceholder)}
                        alt={upcomingBirthdayPet.name}
                        style={{ width: "80px", height: "80px" }}
                    />
                    <div>
                        <Title>🎂 Upcoming Birthday</Title>
                        <Text>{upcomingBirthdayPet.name} has a birthday on {dayjs(upcomingBirthdayPet.birthdate).format("MMMM D")}!</Text>
                    </div>
                </BirthdayCard>
            )}
            <RateSection>
                <Title>💰 Update Your Rates</Title>
                <Form onSubmit={handleRateUpdate}>
                    <InputGroup>
                        <Label>30-Minute Walk:</Label>
                        <InputWrapper>
                            <DollarSign>$</DollarSign>
                            <Input type="number" name="thirty" value={rates.thirty} onChange={handleRateChange} required />
                        </InputWrapper>
                    </InputGroup>
                    <InputGroup>
                        <Label>40-Minute Walk:</Label>
                        <InputWrapper>
                            <DollarSign>$</DollarSign>
                            <Input type="number" name="fourty" value={rates.fourty} onChange={handleRateChange} required />
                        </InputWrapper>
                    </InputGroup>
                    <InputGroup>
                        <Label>60-Minute Walk:</Label>
                        <InputWrapper>
                            <DollarSign>$</DollarSign>
                            <Input type="number" name="sixty" value={rates.sixty} onChange={handleRateChange} required />
                        </InputWrapper>
                    </InputGroup>
                    <InputGroup>
                        <Label>Solo Rate:</Label>
                        <InputWrapper>
                            <DollarSign>$</DollarSign>
                            <Input type="number" name="solo_rate" value={rates.solo_rate} onChange={handleRateChange} required />
                        </InputWrapper>
                    </InputGroup>
                    <UpdateButton type="submit">Update Rates</UpdateButton>
                </Form>
            </RateSection>
            <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </Container>
    );
}

const LogoutButton = styled.button`
    background: #ff758c;
    color: white;
    padding: 10px 15px;
    font-size: 14px;
    font-weight: bold;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.3s ease-in-out;

    &:hover {
        background: #ff5864;
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

const Section = styled.div`
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-radius: 12px;
    box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.2);
    width: 100%;
    max-width: 800px;
    margin-bottom: 20px;
`;

const Title = styled.h2`
    font-size: 1.75rem;
    color: white;
    margin-bottom: 15px;
`;

const DateInput = styled.input`
    width: 90%;
    padding: 12px;
    margin: 15px 0;
    border-radius: 8px;
    border: none;
    font-size: 1rem;
    text-align: center;
    background: rgba(255, 255, 255, 0.3);
    color: white;
    transition: background 0.3s ease-in-out;

    &:focus {
        background: rgba(255, 255, 255, 0.5);
        outline: none;
    }
`;

const ListGroup = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

const ListItem = styled.li`
    background: rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    margin-bottom: 12px;
    padding: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: transform 0.2s ease-in-out;

    &:hover {
        transform: translateY(-3px);
    }
`;

const PetImage = styled.img`
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
`;

const Text = styled.p`
    color: white;
    margin: 0;
`;

const BirthdayCard = styled(Section)`
    display: flex;
    align-items: center;
    gap: 15px;
`;

const RateSection = styled(Section)`
    background: rgba(255, 255, 255, 0.2);
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

const InputGroup = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
`;

const Label = styled.label`
    font-size: 1rem;
    color: white;
`;

const Input = styled.input`
    width: 40px;
    padding: 5px;
    border: none;
    border-radius: 5px;
    text-align: center;
`;

const UpdateButton = styled.button`
    margin-top: 15px;
    padding: 10px;
    background: #ff758c;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background 0.3s ease-in-out;

    &:hover {
        background: #ff5864;
    }
`;

const InputWrapper = styled.div`
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 5px;
    padding: 5px;
`;

const DollarSign = styled.span`
    color: white;
    font-size: 1rem;
    margin-right: 5px;
`;