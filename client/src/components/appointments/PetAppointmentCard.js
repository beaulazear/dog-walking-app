import Card from 'react-bootstrap/Card';
import Button from "react-bootstrap/Button";

export default function PetAppointmentCard({ apt, updateAppointmentsDelete }) {

    let datetimeString = apt.appointment_date

    if (datetimeString) {

        function formatDateToYYYYMMDD(datetimeString) {
            const year = datetimeString.slice(0, 4);
            const month = datetimeString.slice(5, 7);
            const day = datetimeString.slice(8, 10);
            return datetimeString = `${year}-${month}-${day}`;
        }

        datetimeString = formatDateToYYYYMMDD(datetimeString);
    }

    function extractHourAndMinutes(timestampString) {
        const date = new Date(timestampString);
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hour}:${minutes}`;
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
            .then((oldApt) => updateAppointmentsDelete(oldApt))
    }

    return (
        <Card className="border border-primary" style={{ width: '100%' }}>
            <Card.Body>
                {apt.recurring === true && (
                    <>
                        <Card.Title>Recurring Appointment</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted"><b>Earliest Pickup Time:</b> {startTime} </Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Latest Pickup Time:</b> {endTime} </Card.Subtitle>
                        <Card.Text>
                            This walk is to be repeated every {daysOfWeekArr.join(', ')}
                        </Card.Text>
                    </>
                )}
                {apt.recurring === false && (
                    <>
                        <Card.Title>One Time Appointment</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted"><b>Date:</b> {datetimeString} </Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Earliest Pickup Time:</b> {startTime} </Card.Subtitle>
                        <Card.Subtitle className="mb-2 text-muted"><b>Latest Pickup Time:</b> {endTime} </Card.Subtitle>
                        <Card.Text>
                            This is a one time appointment and will be displayed on the Appointments page on the date of the appointment.
                        </Card.Text>
                    </>
                )}
            </Card.Body>
            <Button onClick={handleCancel} className="btn btn-danger m-4">Cancel Appointment</Button>
        </Card>
    );
}
