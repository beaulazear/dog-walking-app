import React, { useContext, useState } from "react";
import { PetsContext } from "../../context/pets";
import { UserContext } from "../../context/user";
import Card from 'react-bootstrap/Card';
import Button from "react-bootstrap/Button";
import Modal from 'react-bootstrap/Modal';
import styled from 'styled-components';

const StyledCard = styled(Card)`
    margin: 20px auto;
    width: 90%;
    max-width: 600px;
    min-width: 320px;
    box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.2);
    border-radius: 10px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;

    &:hover {
        transform: translateY(-5px);
        box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.25);
    }
`;

const ImageContainer = styled.div`
    width: 120px;
    height: 120px;
    overflow: hidden;
    border-radius: 50%;
    margin: 10px;
`;

const InfoContainer = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    text-align: left;
    align-items: flex-start;
    padding: 10px;
`;

const StyledImage = styled.img`
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;
`;

const StyledTitle = styled.h3`
    font-size: 1.4em;
    font-weight: 600;
    margin-bottom: 5px;
    color: ${({ theme }) => theme.primaryColor || '#333'};
`;

const StyledText = styled.p`
    font-size: 1em;
    color: #444;
    line-height: 1.5;
    margin: 5px 0;
`;

const StyledButton = styled(Button)`
    margin: 8px;
    padding: 10px 20px;
    font-size: 1em;
    border-radius: 5px;
    transition: background-color 0.3s ease, transform 0.2s ease;

    &:hover {
        background-color: ${({ theme }) => theme.primaryColor || '#0056b3'};
        transform: scale(1.05);
    }

    @media (max-width: 600px) {
        width: 100%;
        margin: 5px 0;
    }
`;

const StyledModal = styled(Modal)`
    text-align: center;
`;

const StyledModalBody = styled(Modal.Body)`
    text-align: left;
    padding: 20px;
`;

const StyledInput = styled.input`
    width: 100%;
    max-width: 300px;
    border: 2px solid ${({ theme }) => theme.successColor || '#4CAF50'};
    border-radius: 5px;
    padding: 10px;
    font-size: 1em;
    margin-top: 10px;
    box-sizing: border-box;
    transition: border-color 0.3s ease;

    &:focus {
        border-color: ${({ theme }) => theme.primaryColor || '#0056b3'};
        outline: none;
    }
`;

export default function TodaysAppointmentsCard({ apt, updateAppointments }) {

    const { pets, setPets } = useContext(PetsContext);
    const { user } = useContext(UserContext);

    const [offset, setOffset] = useState(0);
    const [selectedOption, setSelectedOption] = useState("Upcharge");
    const [showModal, setShowModal] = useState(false);
    const [cancelledCompensation, setCancelledCompensation] = useState(0);
    const [duration, setDuration] = useState(apt.duration);

    const handleChange = (event) => {
        setSelectedOption(event.target.value);
    };

    const handleDurationChange = (event) => {
        const number = parseFloat(event.target.value);
        setDuration(number);
    };

    const handleCompensationChange = (event) => {
        setCancelledCompensation(event.target.value);
    };

    const handleShowModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

    function getHourAndMinutes(timestampString) {
        const [, timePart] = timestampString.split("T"); // Splitting the string to extract the time part
        const [time,] = timePart.split(/[.+-]/); // Splitting the time part to separate time and offset
        const [hours, minutes] = time.split(":"); // Splitting the time to extract hours and minutes
        return `${hours}:${minutes}`;
    }

    const startTime = getHourAndMinutes(apt.start_time);
    const endTime = getHourAndMinutes(apt.end_time);

    function replaceDateWithToday(timestamp) {
        const now = new Date();
        const timePart = timestamp.substr(11, 8);

        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const timezoneOffset = (now.getTimezoneOffset() / 60) * -1;
        const timezoneSign = timezoneOffset >= 0 ? '+' : '-';
        const timezoneOffsetHours = String(Math.abs(timezoneOffset)).padStart(2, '0');

        const todayDatePart = `${year}-${month}-${day}`;
        const timezonePart = `${timezoneSign}${timezoneOffsetHours}00`;

        return `${todayDatePart} ${timePart} ${timezonePart}`;
    }

    function handleNewInvoice() {

        const title = `${duration} minute ${apt.solo ? 'solo' : 'group'} walk`

        let compensation = 0

        if (user.thirty !== null) {
            if (duration === 30) {
                compensation = user.thirty
            } else if (duration === 45) {
                compensation = user.fourty
            } else {
                compensation = user.sixty
            }
        } else {
            if (duration === 30) {
                compensation = 22
            } else if (duration === 45) {
                compensation = 27
            } else {
                compensation = 33
            }
        }

        if (apt.solo && user.solo_rate) {
            compensation += user.solo_rate
        }

        if (offset > 0) {
            if (selectedOption === "Upcharge") {
                compensation += parseFloat(offset)
            } else {
                compensation -= parseFloat(offset)
            }
        }

        const newDate = replaceDateWithToday(apt.start_time)

        const confirm = window.confirm(`Mark walk as completed? An invoice will be created for $${compensation}`)

        if (confirm) {
            fetch('/invoices', {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    pet_id: apt.pet.id,
                    appointment_id: apt.id,
                    date_completed: newDate,
                    paid: false,
                    compensation: compensation,
                    title
                })
            })
                .then((response) => response.json())
                .then((newInvoice) => {
                    const newApt = { ...apt, invoices: [...apt.invoices, newInvoice] }
                    const newPets = pets.map((pet) => {
                        if (pet.id === newInvoice.pet_id) {
                            pet.invoices = [...pet.invoices, newInvoice]
                            return pet
                        } else {
                            return pet
                        }
                    })
                    setPets(newPets)
                    updateAppointments(newApt)
                })
        } else {
            console.log("Walk not completed")
        }
    }

    function handleNewCancelInvoice() {
        handleShowModal();
    }

    function confirmCancelWalk() {

        const newDate = replaceDateWithToday(apt.start_time);
        const newCancelledCompensation = parseFloat(cancelledCompensation) || 0;

        const title = `Canceled ${apt.duration} minute ${apt.solo ? 'solo' : 'group'} walk`

        fetch('/invoices', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                pet_id: apt.pet.id,
                appointment_id: apt.id,
                date_completed: newDate,
                paid: false,
                compensation: newCancelledCompensation,
                title,
                cancelled: true
            })
        })
            .then((response) => response.json())
            .then((newInvoice) => {
                const newApt = { ...apt, invoices: [...apt.invoices, newInvoice] }
                const newPets = pets.map((pet) => {
                    if (pet.id === newInvoice.pet_id) {
                        pet.invoices = [...pet.invoices, newInvoice]
                        return pet
                    } else {
                        return pet
                    }
                })
                setPets(newPets)
                updateAppointments(newApt)
            });
        setShowModal(false);
    }

    function hasInvoiceForToday(appointmentStartTime, invoices) {
        const today = new Date();
        const offset = today.getTimezoneOffset();
        const todayAdjusted = new Date(today.getTime() - (offset * 60 * 1000));
        const todayString = todayAdjusted.toISOString().slice(0, 10);

        const matchingInvoice = invoices.map(invoice => {
            const invoiceDate = invoice.date_completed.slice(0, 22);
            if (invoiceDate === todayString + appointmentStartTime.slice(10, 22)) {
                return invoice;
            }
            return false;
        }).filter(invoice => invoice);

        return matchingInvoice.length ? matchingInvoice[0] : false;
    }

    let invoices = hasInvoiceForToday(apt.start_time, apt.invoices)

    function isTimestampInPast(timestamp) {
        const date = new Date(timestamp);

        const timestampTime = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();

        const currentTime = new Date();

        const currentTimeInSeconds = currentTime.getHours() * 3600 + currentTime.getMinutes() * 60 + currentTime.getSeconds();

        return timestampTime < currentTimeInSeconds;
    }

    const isAptLate = isTimestampInPast(apt.end_time)

    return (
        <div>
            {invoices && invoices.cancelled !== true && (
                <StyledCard style={{ backgroundColor: '#6fd388' }}>
                    <Card.Body>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ImageContainer>
                                <StyledImage alt="Pet associated with appointment" src={apt.pet.profile_pic} />
                            </ImageContainer>
                            <InfoContainer>
                                <StyledTitle>Completed</StyledTitle>
                                <StyledTitle>{apt.pet.name}</StyledTitle>
                                <StyledText>{apt.duration} minute {apt.solo ? 'solo' : 'group'} walk</StyledText>
                            </InfoContainer>
                        </div>

                    </Card.Body>
                </StyledCard>
            )}
            {invoices && invoices.cancelled && (
                <StyledCard style={{ backgroundColor: '#FFB6C1' }}>
                    <Card.Body>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <ImageContainer>
                                <StyledImage alt="Pet associated with appointment" src={apt.pet.profile_pic} />
                            </ImageContainer>
                            <InfoContainer>
                                <StyledTitle>Canceled</StyledTitle>
                                <StyledTitle>{apt.pet.name}</StyledTitle>
                                <StyledText>{apt.duration} minute {apt.solo ? 'solo' : 'group'} walk</StyledText>
                            </InfoContainer>
                        </div>
                    </Card.Body>
                </StyledCard>
            )}
            {!invoices && isAptLate && (
                <StyledCard style={{ backgroundColor: '#FFFF99' }}>
                    <Card.Body>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <InfoContainer>
                                <StyledTitle>Overdue</StyledTitle>
                                <StyledText><b>Pet Details:</b><br />{apt.pet.name}
                                    <br />{apt.pet.address}</StyledText>
                                <StyledText><b>Pickup Window:</b><br />{startTime} - {endTime}</StyledText>
                            </InfoContainer>
                            <ImageContainer>
                                <StyledImage alt="Pet associated with appointment" src={apt.pet.profile_pic} />
                            </ImageContainer>
                        </div>
                        <InfoContainer>
                            <StyledText><b>Supplies:</b> {apt.pet.supplies_location}</StyledText>
                            <StyledText><b>Notes:</b> {apt.pet.behavorial_notes}</StyledText>
                            <StyledText>
                                <b>{apt.solo ? 'Solo Walk' : 'Group Walk'}:</b>
                                <select onChange={handleDurationChange} value={duration} style={{ marginLeft: '10px', marginRight: '5px' }}>
                                    <option value="30">30 Minutes</option>
                                    <option value="45">45 Minutes</option>
                                    <option value="60">60 Minutes</option>
                                </select>
                            </StyledText>
                            <StyledText>
                                <b>Offset:</b> <input size="3" type='text' name="offset" maxLength={3} value={"$" + offset} onChange={(e) => setOffset(e.target.value.substring(1))} />
                            </StyledText>
                            {offset > 0 && (
                                <StyledText>
                                    <b>Upcharge or Discount?</b>
                                    <select onChange={handleChange} value={selectedOption} style={{ marginLeft: '10px' }}>
                                        <option value="Upcharge">Upcharge</option>
                                        <option value="Discount">Discount</option>
                                    </select>
                                </StyledText>
                            )}
                        </InfoContainer>
                        <StyledButton onClick={handleNewInvoice}>Complete Walk</StyledButton>
                        <StyledButton onClick={handleNewCancelInvoice}>Cancel Walk</StyledButton>
                    </Card.Body>
                </StyledCard>
            )}
            {!invoices && !isAptLate && (
                <StyledCard style={{ backgroundColor: '#E6F7FF' }}>
                    <Card.Body>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <InfoContainer>
                                <StyledTitle>Incomplete</StyledTitle>
                                <StyledText><b>Pet Name:</b><br />{apt.pet.name}</StyledText>
                                <StyledText><b>Address:</b><br />{apt.pet.address}</StyledText>
                                <StyledText><b>Pickup Window:</b><br />{startTime} - {endTime}</StyledText>
                            </InfoContainer>
                            <ImageContainer>
                                <StyledImage alt="Pet associated with appointment" src={apt.pet.profile_pic} />
                            </ImageContainer>
                        </div>
                        <InfoContainer>
                            <StyledText><b>Supplies:</b> {apt.pet.supplies_location}</StyledText>
                            <StyledText><b>Notes:</b> {apt.pet.behavorial_notes}</StyledText>
                            <StyledText>
                                <b>{apt.solo ? 'Solo Walk' : 'Group Walk'}:</b>
                                <select onChange={handleDurationChange} value={duration} style={{ marginLeft: '10px', marginRight: '5px' }}>
                                    <option value="30">30 Minutes</option>
                                    <option value="45">45 Minutes</option>
                                    <option value="60">60 Minutes</option>
                                </select>
                            </StyledText>
                            <StyledText>
                                <b>Offset:</b> <input size="3" type='text' name="offset" maxLength={3} value={"$" + offset} onChange={(e) => setOffset(e.target.value.substring(1))} />
                            </StyledText>
                            {offset > 0 && (
                                <StyledText>
                                    <b>Upcharge or Discount?</b>
                                    <select onChange={handleChange} value={selectedOption} style={{ marginLeft: '10px' }}>
                                        <option value="Upcharge">Upcharge</option>
                                        <option value="Discount">Discount</option>
                                    </select>
                                </StyledText>
                            )}
                        </InfoContainer>
                        <StyledButton onClick={handleNewInvoice}>Complete Walk</StyledButton>
                        <StyledButton onClick={handleNewCancelInvoice}>Cancel Walk</StyledButton>
                    </Card.Body>
                </StyledCard>
            )}
            <StyledModal show={showModal} onHide={handleCloseModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Walk Cancellation</Modal.Title>
                </Modal.Header>
                <StyledModalBody>
                    <p>Please confirm the cancellation of the walk.</p>
                    <p>Cancellation Fee: $</p>
                    <StyledInput type="number" placeholder="Amount in $USD" value={cancelledCompensation} onChange={handleCompensationChange} />
                </StyledModalBody>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseModal}>Close</Button>
                    <Button variant="primary" onClick={confirmCancelWalk}>Confirm</Button>
                </Modal.Footer>
            </StyledModal>
        </div>
    );
}