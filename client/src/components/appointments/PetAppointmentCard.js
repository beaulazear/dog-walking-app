import React, { useContext, useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import { AppointmentsContext } from "../../context/appointments";
import UpdateAppointmentForm from './UpdateAppointmentForm';
import CancelAppointmentModal from './CancelAppointmentModal';
import EditCancellationsModal from './EditCancellationsModal';
import InvoiceForm from '../invoices/InvoiceForm';

// Styled components
const CardContainer = styled.div`
    border: 1px solid #007bff;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
    width: 100%;
`;

const CardTitle = styled.h5`
    margin-bottom: 8px;
    font-weight: bold;
`;

const CardSubtitle = styled.h6`
    margin-bottom: 4px;
    color: #6c757d;
`;

const CardText = styled.p`
    margin-bottom: 16px;
`;

const Button = styled.button`
    display: block;
    width: 100%;
    padding: 10px;
    margin-bottom: 8px;
    border: none;
    border-radius: 4px;
    color: #fff; /* Ensures text color is white */
    font-size: 16px;
    cursor: pointer;
    transition: background-color 0.3s ease;

    &.btn-success {
        background-color: #28a745; /* Green background */
    }

    &.btn-secondary {
        background-color: #6c757d; /* Grey background */
    }

    &.btn-danger {
        background-color: #dc3545; /* Red background */
    }

    &:hover {
        opacity: 0.8;
    }
`;

const ListGroup = styled.ul`
    list-style: none;
    padding: 0;
    margin: 0;
`;

const ListGroupItem = styled.li`
    padding: 8px;
    border-bottom: 1px solid #ddd;
`;

export default function PetAppointmentCard({ apt, updateAppointmentsDelete }) {
    const [updateAptButton, setUpdateAptButton] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const { petsAppointments, setPetsAppointments } = useContext(AppointmentsContext);
    const [showEditModal, setShowEditModal] = useState(false);

    const cancellations = useMemo(() => (apt.cancellations || []).sort((a, b) => new Date(a.date) - new Date(b.date)), [apt.cancellations]);

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
                        const updatedCancellations = appointment.cancellations.filter(c => c.id !== cancellationId);
                        return {
                            ...appointment,
                            cancellations: updatedCancellations.sort((a, b) => new Date(a.date) - new Date(b.date))
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
            console.log("Appointment cancelled.");
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
        <CardContainer>
            {apt.recurring ? (
                <div>
                    <CardTitle>Recurring Appointment</CardTitle>
                    <CardSubtitle><b>Walk Duration:</b> {apt.duration} minutes</CardSubtitle>
                    <CardSubtitle><b>Walk Type:</b> {apt.solo ? 'Solo' : 'Group'} Walk</CardSubtitle>
                    <CardSubtitle><b>Earliest Pickup Time:</b> {startTime} </CardSubtitle>
                    <CardSubtitle><b>Latest Pickup Time:</b> {endTime} </CardSubtitle>
                    <CardText>
                        This is a recurring appointment and will be repeated every {daysOfWeekArr.join(', ')}
                    </CardText>
                    <CardSubtitle><b>Canceled Dates:</b></CardSubtitle>
                    {cancellations.length < 1 && (
                        <CardText>No cancellations currently, use button below to submit date that the appointment is to be skipped.</CardText>
                    )}
                    {cancellations.length > 0 && (
                        <ListGroup>
                            {cancellations.map(cancellation => (
                                <ListGroupItem key={cancellation.id}>{formatDate(cancellation.date)}</ListGroupItem>
                            ))}
                        </ListGroup>
                    )}
                    <InvoiceForm apt={apt} />
                    <Button onClick={handleModalShow} className="btn-success">Add Cancellations</Button>
                    {cancellations.length > 0 && (
                        <Button onClick={handleEditModalShow} className="btn-secondary">Edit Cancellations</Button>
                    )}
                    <Button className="btn btn-info btn-block" onClick={changeUpdateFormView}>
                        {updateAptButton ? "Close Update Form" : "Update Appointment"}
                    </Button>
                    {updateAptButton && (
                        <UpdateAppointmentForm changeUpdateFormView={changeUpdateFormView} apt={apt} />
                    )}
                    <Button onClick={handleCancel} className="btn-danger">Cancel Appointment</Button>
                    <CancelAppointmentModal
                        show={showModal}
                        handleClose={handleModalClose}
                        appointmentId={apt.id}
                    />
                    <EditCancellationsModal
                        show={showEditModal}
                        handleClose={handleEditModalClose}
                        cancellations={cancellations}
                        deleteCancellation={deleteCancellation}
                    />
                </div>
            ) : (
                <div>
                    <CardTitle>One Time Appointment</CardTitle>
                    <CardSubtitle><b>Date:</b> {datetimeString} </CardSubtitle>
                    <CardSubtitle><b>Walk Duration:</b> {apt.duration} minutes</CardSubtitle>
                    <CardSubtitle><b>Walk Type:</b> {apt.solo ? 'Solo' : 'Group'} Walk</CardSubtitle>
                    <CardSubtitle><b>Earliest Pickup Time:</b> {startTime} </CardSubtitle>
                    <CardSubtitle><b>Latest Pickup Time:</b> {endTime} </CardSubtitle>
                    <CardText>
                        This is a one-time appointment and will be displayed on the Today page on the date of the appointment.
                    </CardText>
                    <InvoiceForm apt={apt} />
                    <Button onClick={changeUpdateFormView}>
                        {updateAptButton ? "Close Update Form" : "Update Appointment"}
                    </Button>
                    {updateAptButton && (
                        <UpdateAppointmentForm changeUpdateFormView={changeUpdateFormView} apt={apt} />
                    )}
                    <Button onClick={handleCancel} className="btn-danger">Cancel Appointment</Button>
                    <CancelAppointmentModal
                        show={showModal}
                        handleClose={handleModalClose}
                        appointmentId={apt.id}
                    />
                </div>
            )}
        </CardContainer>
    );
}

