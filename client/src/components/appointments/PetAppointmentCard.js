import React, { useContext, useState, useEffect, useMemo } from 'react';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import ListGroup from 'react-bootstrap/ListGroup';
import { AppointmentsContext } from "../../context/appointments";
import UpdateAppointmentForm from './UpdateAppointmentForm';
import CancelAppointmentModal from './CancelAppointmentModal';
import EditCancellationsModal from './EditCancellationsModal'; // Import the new modal

export default function PetAppointmentCard({ apt, updateAppointmentsDelete }) {

    const [updateAptButton, setUpdateAptButton] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const { petsAppointments, setPetsAppointments } = useContext(AppointmentsContext);

    const [showEditModal, setShowEditModal] = useState(false); // Add new state for Edit Modal

    const cancellations = useMemo(() => apt.cancellations || [], [apt.cancellations]);

    function handleEditModalShow() {
        setShowEditModal(true);
    }

    function handleEditModalClose() {
        setShowEditModal(false);
    }

    function deleteCancellation(cancellationId) {
        fetch(`/cancellations/${cancellationId}`, {
            method: 'DELETE'
        })
            .then(response => response.json())
            .then(() => {
                const updatedAppointments = petsAppointments.map(appointment => {
                    if (appointment.id === apt.id) {
                        return {
                            ...appointment,
                            cancellations: appointment.cancellations.filter(c => c.id !== cancellationId)
                        };
                    }
                    return appointment;
                });
                setPetsAppointments(updatedAppointments);
            })
            .catch(error => {
                console.error('Error deleting cancellation:', error);
            });
    }

    let datetimeString = apt.appointment_date;

    if (datetimeString) {
        function formatDateToYYYYMMDD(datetimeString) {
            const year = datetimeString.slice(0, 4);
            const month = datetimeString.slice(5, 7);
            const day = datetimeString.slice(8, 10);
            return datetimeString = `${month}-${day}-${year}`;
        }
        datetimeString = formatDateToYYYYMMDD(datetimeString);
    }

    function extractHourAndMinutes(timestampString) {
        const [, timePart] = timestampString.split("T");
        const [time,] = timePart.split(/[.+-]/);
        const [hours, minutes] = time.split(":");
        return `${hours}:${minutes}`;
    }

    const startTime = extractHourAndMinutes(apt.start_time);
    const endTime = extractHourAndMinutes(apt.end_time);

    let daysOfWeekArr = [];

    if (apt.recurring) {
        if (apt.monday) daysOfWeekArr.push("Monday");
        if (apt.tuesday) daysOfWeekArr.push("Tuesday");
        if (apt.wednesday) daysOfWeekArr.push("Wednesday");
        if (apt.thursday) daysOfWeekArr.push("Thursday");
        if (apt.friday) daysOfWeekArr.push("Friday");
        if (apt.saturday) daysOfWeekArr.push("Saturday");
        if (apt.sunday) daysOfWeekArr.push("Sunday");
    }

    function handleCancel() {
        const confirmed = window.confirm("Are you sure you want to cancel this appointment? This can not be undone!");

        if (confirmed) {
            fetch(`/appointments/${apt.id}/canceled`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': "application/json"
                },
                body: JSON.stringify({
                    canceled: true
                })
            })
                .then((resp) => resp.json())
                .then((oldApt) => {
                    const newPetsAppointments = petsAppointments.filter((appointment) => appointment.id !== oldApt.id);
                    updateAppointmentsDelete(oldApt);
                    setPetsAppointments(newPetsAppointments);
                });
        } else {
            console.log("Cancellation canceled.");
        }
    }

    function changeUpdateFormView() {
        setUpdateAptButton(!updateAptButton);
    }

    function handleModalShow() {
        setShowModal(true);
    }

    function handleModalClose() {
        setShowModal(false);
    }

    function handleModalSubmit(date) {
        fetch('/cancellations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                appointment_id: apt.id,
                date: date
            })
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Invalid date, date must be in the future.');
                }
                return response.json();
            })
            .then(data => {
                console.log('Cancellation added:', data);
                const updatedAppointments = petsAppointments.map(appointment => {
                    if (appointment.id === apt.id) {
                        return {
                            ...appointment,
                            cancellations: [...appointment.cancellations, data]
                        };
                    }
                    return appointment;
                });
                setPetsAppointments(updatedAppointments);
                handleModalClose();
            })
            .catch(error => {
                console.error('Error:', error.message);
            });
    }


    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    useEffect(() => {
        const now = new Date();
        const oneDayBefore = new Date(now);
        oneDayBefore.setDate(oneDayBefore.getDate() - 1);

        const pastCancellations = cancellations.filter(cancellation => new Date(cancellation.date) < oneDayBefore);

        if (pastCancellations.length > 0) {
            pastCancellations.forEach(cancellation => {
                fetch(`/cancellations/${cancellation.id}`, {
                    method: 'DELETE'
                })
                    .then(response => response.json())
                    .then(() => {
                        const updatedAppointments = petsAppointments.map(appointment => {
                            if (appointment.id === apt.id) {
                                return {
                                    ...appointment,
                                    cancellations: appointment.cancellations.filter(c => c.id !== cancellation.id)
                                };
                            }
                            return appointment;
                        });
                        setPetsAppointments(updatedAppointments);
                    })
                    .catch(error => {
                        console.error('Error deleting cancellation:', error);
                    });
            });
        }
    }, [cancellations, apt.id, petsAppointments, setPetsAppointments]);

    return (
        <Card className="border border-primary" style={{ width: '100%', marginBottom: '5px' }}>
            <Card.Body>
                {apt.recurring ? (
                    <div>
                        <Card.Title>Recurring Appointment</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted"><b>Walk Duration:</b> {apt.duration} minutes</Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Walk Type:</b> {apt.solo ? 'Solo' : 'Group'} Walk</Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Earliest Pickup Time:</b> {startTime} </Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Latest Pickup Time:</b> {endTime} </Card.Subtitle>
                        <Card.Text>
                            This is a recurring appointment and will be repeated every {daysOfWeekArr.join(', ')}
                        </Card.Text>
                        <Card.Subtitle className="mb-2 text-muted"><b>Canceled Dates:</b></Card.Subtitle>
                        {cancellations.length < 1 && (
                            <Card.Text>No cancellations currently, use button below to submit date that the appointment is to be skipped.</Card.Text>
                        )}
                        {cancellations.length > 0 && (
                            <ListGroup variant="flush">
                                {cancellations.map(cancellation => (
                                    <ListGroup.Item key={cancellation.id}>{formatDate(cancellation.date)}</ListGroup.Item>
                                ))}
                            </ListGroup>
                        )}
                    </div>
                ) : (
                    <div>
                        <Card.Title>One Time Appointment</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted"><b>Date:</b> {datetimeString} </Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Walk Duration:</b> {apt.duration} minutes</Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Walk Type:</b> {apt.solo ? 'Solo' : 'Group'} Walk</Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Earliest Pickup Time:</b> {startTime} </Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Latest Pickup Time:</b> {endTime} </Card.Subtitle>
                        <Card.Text>
                            This is a one time appointment and will be displayed on the Today page on the date of the appointment.
                        </Card.Text>
                    </div>
                )}
            </Card.Body>
            <div className="d-grid gap-2 mx-4 mb-3">
                <Button onClick={handleModalShow} className="btn btn-secondary btn-block">Add Cancellations</Button>
                {cancellations.length > 0 && (
                    <Button onClick={handleEditModalShow} className="btn btn-warning btn-block">Edit Cancellations</Button>
                )}
                <Button onClick={changeUpdateFormView} className="btn-block">
                    {updateAptButton ? "Close Update Form" : "Update Appointment"}
                </Button>
                {updateAptButton && (
                    <UpdateAppointmentForm changeUpdateFormView={changeUpdateFormView} apt={apt} />
                )}
                <Button onClick={handleCancel} className="btn btn-danger btn-block">Cancel Appointment</Button>
                <CancelAppointmentModal
                    show={showModal}
                    handleClose={handleModalClose}
                    appointmentId={apt.id}
                    onSubmit={handleModalSubmit}
                />
                <EditCancellationsModal
                    show={showEditModal}
                    handleClose={handleEditModalClose}
                    cancellations={cancellations}
                    deleteCancellation={deleteCancellation}
                />
            </div>
        </Card>
    );
}
