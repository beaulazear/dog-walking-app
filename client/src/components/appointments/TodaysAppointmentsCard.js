import React, { useContext, useState } from "react";
import { PetsContext } from "../../context/pets";
import { UserContext } from "../../context/user";
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from "react-bootstrap/Button";
import Modal from 'react-bootstrap/Modal';
import styled from 'styled-components';

const StyledCard = styled(Card)`
    margin: 10px auto;
    max-width: 425px;
    text-align: center;
`;

const StyledImage = styled.img`
    width: 50%;
    height: auto;
    margin-bottom: 8px;
    border-radius: 50%;
`;

const StyledTitle = styled(Card.Title)`
    font-size: 1.2em;
`;

const StyledText = styled(Card.Text)`
    font-size: 1.1em;
    text-align: left;
`;

const StyledButton = styled(Button)`
    margin: 5px;
`;

const StyledListGroup = styled(ListGroup)`
    background-color: #FFFF99;
`;

const StyledListItem = styled(ListGroup.Item)`
    background-color: #FFFF99;
    text-align: left;
`;

const StyledListItemNew = styled(ListGroup.Item)`
    background-color: #E6F7FF;
    text-align: left;
`;

const StyledModal = styled(Modal)`
    text-align: center;
`;

const StyledModalBody = styled(Modal.Body)`
    text-align: left;
`;

const StyledInput = styled.input`
    width: 100%;
`;

export default function TodaysAppointmentsCard({ apt, updateAppointments }) {

    const { pets, setPets } = useContext(PetsContext)
    const { user } = useContext(UserContext)

    const [offset, setOffset] = useState(0)
    const [selectedOption, setSelectedOption] = useState("Upcharge");
    const [showModal, setShowModal] = useState(false);
    const [cancelledCompensation, setCancelledCompensation] = useState(0);

    const handleChange = (event) => {
        setSelectedOption(event.target.value);
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

        const title = `${apt.duration} minute ${apt.solo ? 'solo' : 'group'} walk`

        let compensation = 0

        if (user.thirty !== null) {
            if (apt.duration === 30) {
                compensation = user.thirty
            } else if (apt.duration === 45) {
                compensation = user.fourty
            } else {
                compensation = user.sixty
            }
        } else {
            if (apt.duration === 30) {
                compensation = 22
            } else if (apt.duration === 45) {
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

        console.log(invoices)
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
        <>
            {invoices && invoices.cancelled !== true && (
                <StyledCard style={{ backgroundColor: '#6fd388' }}>
                    <Card.Body>
                        <StyledTitle>{apt.pet.name}: Completed Walk</StyledTitle>
                        <StyledImage alt="Pet associated with appointment" src={apt.pet.profile_pic} />
                        <StyledTitle>{apt.duration} minute {apt.solo ? 'solo' : 'group'} walk between {startTime} & {endTime}.</StyledTitle>
                    </Card.Body>
                </StyledCard>
            )}
            {invoices.cancelled && (
                <StyledCard style={{ backgroundColor: '#FFB6C1' }}>
                    <Card.Body>
                        <StyledTitle>{apt.pet.name}: Canceled Walk</StyledTitle>
                        <StyledImage alt="Pet associated with appointment" src={apt.pet.profile_pic} />
                        <StyledTitle>{apt.duration} minute {apt.solo ? 'solo' : 'group'} walk between {startTime} & {endTime}.</StyledTitle>
                    </Card.Body>
                </StyledCard>
            )}
            {!invoices && isAptLate && (
                <StyledCard style={{ backgroundColor: '#FFFF99' }}>
                    <Card.Body>
                        <StyledTitle>{apt.pet.name}: Overdue Walk</StyledTitle>
                        <StyledImage alt="Pet associated with appointment" src={apt.pet.profile_pic} />
                        <StyledText>
                            {apt.pet.supplies_location} {apt.pet.behavorial_notes}
                        </StyledText>
                        <StyledListGroup>
                            <StyledListItem><b>Earliest pick up time:</b> {startTime}</StyledListItem>
                            <StyledListItem><b>Latest pick up time:</b> {endTime}</StyledListItem>
                            <StyledListItem><b>Address:</b> {apt.pet.address}</StyledListItem>
                            <StyledListItem><b>Walk Duration:</b> {apt.duration} minutes</StyledListItem>
                            <StyledListItem><b>Walk Type:</b> {apt.solo ? 'Solo Walk' : 'Group Walk'}</StyledListItem>
                            <StyledListItem><b>Add an Upcharge or Discount:</b></StyledListItem>
                            <StyledListItem><StyledInput type='text' name="offset" maxLength={3} value={"$" + offset} onChange={(e) => setOffset(e.target.value.substring(1))} /></StyledListItem>
                            {offset > 0 && (
                                <StyledListItem>
                                    <b>Upcharge or Discount?</b>
                                    <select onChange={handleChange} value={selectedOption} style={{ marginLeft: '10px' }}>
                                        <option value="Upcharge">Upcharge</option>
                                        <option value="Discount">Discount</option>
                                    </select>
                                </StyledListItem>
                            )}
                        </StyledListGroup>
                        <StyledButton onClick={handleNewInvoice}>Complete Walk</StyledButton>
                        <StyledButton className="btn btn-danger" onClick={handleNewCancelInvoice}>Cancel Walk</StyledButton>
                    </Card.Body>
                </StyledCard>
            )}
            {!invoices && !isAptLate && (
                <StyledCard style={{ backgroundColor: '#E6F7FF' }}>
                    <Card.Body>
                        <StyledTitle>{apt.pet.name}: Uncompleted Walk</StyledTitle>
                        <StyledImage alt="Pet associated with appointment" src={apt.pet.profile_pic} />
                        <StyledText>
                            {apt.pet.supplies_location} : {apt.pet.behavorial_notes}
                        </StyledText>
                        <StyledListGroup>
                            <StyledListItemNew><b>Earliest pick up time:</b> {startTime}</StyledListItemNew>
                            <StyledListItemNew><b>Latest pick up time:</b> {endTime}</StyledListItemNew>
                            <StyledListItemNew><b>Address:</b> {apt.pet.address}</StyledListItemNew>
                            <StyledListItemNew><b>Walk Duration:</b> {apt.duration} minutes</StyledListItemNew>
                            <StyledListItemNew><b>Walk Type:</b> {apt.solo ? 'Solo Walk' : 'Group Walk'}</StyledListItemNew>
                            <StyledListItemNew><b>Add an Upcharge or Discount:</b></StyledListItemNew>
                            <StyledListItemNew><StyledInput type='text' name="offset" maxLength={3} value={"$" + offset} onChange={(e) => setOffset(e.target.value.substring(1))} /></StyledListItemNew>
                            {offset > 0 && (
                                <StyledListItemNew>
                                    <b>Upcharge or Discount?</b>
                                    <select onChange={handleChange} value={selectedOption} style={{ marginLeft: '10px' }}>
                                        <option value="Upcharge">Upcharge</option>
                                        <option value="Discount">Discount</option>
                                    </select>
                                </StyledListItemNew>
                            )}
                        </StyledListGroup>
                        <StyledButton onClick={handleNewInvoice}>Complete Walk</StyledButton>
                        <StyledButton className="btn btn-danger" onClick={handleNewCancelInvoice}>Cancel Walk</StyledButton>
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
        </>
    )
}