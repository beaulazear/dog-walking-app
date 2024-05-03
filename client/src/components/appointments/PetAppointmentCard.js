import Card from 'react-bootstrap/Card';
import Button from "react-bootstrap/Button";
import { useContext, useState } from 'react';
import { TodaysAppointmentsContext } from "../../context/todaysAppointments";
import UpdateAppointmentForm from './UpdateAppointmentForm';

export default function PetAppointmentCard({ apt, updateAppointmentsDelete }) {

    const [updateAptButton, setUpdateAptButton] = useState(false)

    const { todaysAppointments, setTodaysAppointments } = useContext(TodaysAppointmentsContext)

    let datetimeString = apt.appointment_date

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
        const [, timePart] = timestampString.split("T"); // Splitting the string to extract the time part
        const [time,] = timePart.split(/[.+-]/); // Splitting the time part to separate time and offset
        const [hours, minutes] = time.split(":"); // Splitting the time to extract hours and minutes
        return `${hours}:${minutes}`;
    }


    const startTime = extractHourAndMinutes(apt.start_time);
    const endTime = extractHourAndMinutes(apt.end_time);

    let daysOfWeekArr = []

    if (apt.recurring) {
        if (apt.monday) {
            daysOfWeekArr.push("Monday")
        }
        if (apt.tuesday) {
            daysOfWeekArr.push("Tuesday")
        }
        if (apt.wednesday) {
            daysOfWeekArr.push("Wednesday")
        }
        if (apt.thursday) {
            daysOfWeekArr.push("Thursday")
        }
        if (apt.friday) {
            daysOfWeekArr.push("Friday")
        }
        if (apt.saturday) {
            daysOfWeekArr.push("Saturday")
        }
        if (apt.sunday) {
            daysOfWeekArr.push("Sunday")
        }
    }

    function handleCancel() {
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
                const newTodaysAppointments = todaysAppointments.filter((apt) => apt.id !== oldApt.id)
                updateAppointmentsDelete(oldApt)
                setTodaysAppointments(newTodaysAppointments)
            })
    }

    function changeUpdateFormView() {
        setUpdateAptButton(!updateAptButton)
    }

    return (
        <Card className="border border-primary" style={{ width: '100%', marginBottom: '5px' }}>
            <Card.Body>
                {apt.recurring === true && (
                    <>
                        <Card.Title>Recurring Appointment</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted"><b>Walk Duration:</b> {apt.duration} minutes</Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Walk Type:</b> {apt.solo ? 'Solo' : 'Group'} Walk</Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Earliest Pickup Time:</b> {startTime} </Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Latest Pickup Time:</b> {endTime} </Card.Subtitle>
                        <Card.Text>
                            This is a recurring appointment and will be repeated every {daysOfWeekArr.join(', ')}
                        </Card.Text>
                    </>
                )}
                {apt.recurring === false && (
                    <>
                        <Card.Title>One Time Appointment</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted"><b>Date:</b> {datetimeString} </Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Walk Duration:</b> {apt.duration} minutes</Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Walk Type:</b> {apt.solo ? 'Solo' : 'Group'} Walk</Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Earliest Pickup Time:</b> {startTime} </Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Latest Pickup Time:</b> {endTime} </Card.Subtitle>
                        <Card.Text>
                            This is a one time appointment and will be displayed on the Today page on the date of the appointment.
                        </Card.Text>
                    </>
                )}
            </Card.Body>
            <div className="d-grid gap-2 mx-4 mb-3">
                <Button onClick={changeUpdateFormView} className="btn-block">
                    {updateAptButton === true && (
                        "Close Update Form"
                    )}
                    {updateAptButton === false && (
                        "Update Appointment"
                    )}
                </Button>
                <Button onClick={handleCancel} className="btn btn-danger btn-block">Cancel Appointment</Button>
            </div>
            {updateAptButton === true && (
                <UpdateAppointmentForm changeUpdateFormView={changeUpdateFormView} apt={apt} />
            )}
        </Card>
    );
}
