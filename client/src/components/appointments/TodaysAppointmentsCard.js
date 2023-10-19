import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Button from "react-bootstrap/Button";

export default function TodaysAppointmentsCard({ apt, updateAppointments }) {

    function getHourAndMinutes(timestampString) {
        const date = new Date(timestampString);
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hour}:${minutes}`;
    }

    const startTime = getHourAndMinutes(apt.start_time);
    const endTime = getHourAndMinutes(apt.end_time);

    function replaceDateWithToday(timestamp) {
        const today = new Date();
        const timePart = timestamp.substr(11); // Extract time part (HH:mm:ss.sssZ)
        const todayDatePart = today.toISOString().substr(0, 10); // Get today's date in yyyy-mm-dd format

        return `${todayDatePart}T${timePart}`;
    }

    const photoStyles = {
        width: '100px',
        height: '100px',
        margin: '15px',
        borderRadius: '50%',
        objectFit: 'cover',
    }

    function handleNewInvoice() {

        let compensation = 0

        if (apt.duration === 30) {
            compensation = 22
        } else if (apt.duration === 45) {
            compensation = 27
        } else {
            compensation = 33
        }

        if (apt.recurring === false) {
            fetch(`/appointments/${apt.id}/canceled`)
                .then((resp) => resp.json())
                .then((oldApt) => console.log(oldApt))
        }

        fetch('/invoices', {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                pet_id: apt.pet.id,
                appointment_id: apt.id,
                date_completed: replaceDateWithToday(apt.start_time),
                paid: false,
                compensation: compensation
            })
        })
            .then((response) => response.json())
            .then((newInvoice) => {
                let newApt = apt
                newApt.invoices.push(newInvoice)
                updateAppointments(newApt)
            })
    }

    const invoice = apt.invoices.filter((invoice) => invoice.date_completed === replaceDateWithToday(apt.start_time))

    if (invoice.length > 0) {
        return (
            <Card className="bg-success" style={{ width: '90%' }}>
                <Card.Body>
                    <img alt="Pet associated with appointment" style={photoStyles} src={apt.pet.profile_pic} />
                    <Card.Title>{apt.pet.name}, {apt.duration} minute walk between {startTime} & {endTime}.</Card.Title>
                    <Card.Text className='display-6'>Walk Completed</Card.Text>
                </Card.Body>
            </Card>
        );
    } else {
        return (
            <Card style={{ width: '90%' }}>
                <Card.Body>
                    <img alt="Pet associated with appointment" style={photoStyles} src={apt.pet.profile_pic} />
                    <Card.Title>{apt.pet.name}</Card.Title>
                    <Card.Text>
                        {apt.pet.supplies_location}
                    </Card.Text>
                    <Card.Text>
                        {apt.pet.behavorial_notes}
                    </Card.Text>
                </Card.Body>
                <ListGroup className="list-group-flush">
                    <ListGroup.Item><b>Earliest pick up time:</b> {startTime}</ListGroup.Item>
                    <ListGroup.Item><b>Latest pick up time:</b> {endTime}</ListGroup.Item>
                    <ListGroup.Item><b>Address:</b> {apt.pet.address}</ListGroup.Item>
                    <ListGroup.Item><b>Walk Duration:</b> {apt.duration} minutes</ListGroup.Item>
                </ListGroup>
                <Card.Body>
                    <Button onClick={handleNewInvoice}>Complete Walk</Button>
                </Card.Body>
            </Card>
        )
    }
}