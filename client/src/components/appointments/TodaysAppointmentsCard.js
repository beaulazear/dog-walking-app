import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';

export default function TodaysAppointmentsCard({ apt }) {

    function getHourAndMinutes(timestampString) {
        const date = new Date(timestampString);
        const hour = String(date.getUTCHours()).padStart(2, '0');
        const minutes = String(date.getUTCMinutes()).padStart(2, '0');
        return `${hour}:${minutes}`;
    }

    const startTime = getHourAndMinutes(apt.start_time);
    const endTime = getHourAndMinutes(apt.end_time);

    return (
        <Card style={{ width: '100%' }}>
            <Card.Img variant="top" src="holder.js/100px180?text=Image cap" />
            <Card.Body>
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
            </ListGroup>
            <Card.Body>
                <Card.Link href="#">Card Link</Card.Link>
                <Card.Link href="#">Another Link</Card.Link>
            </Card.Body>
        </Card>
    );
}