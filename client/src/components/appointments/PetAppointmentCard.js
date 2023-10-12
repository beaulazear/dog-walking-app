import Card from 'react-bootstrap/Card';

export default function TextExample({ apt, pet }) {

    console.log(pet, apt)

    return (
        <Card style={{ width: '18rem' }}>
            <Card.Body>
                {apt.recurring === true && (
                    <Card.Title>Recurring Appointment</Card.Title>
                )}
                {apt.recurring === false && (
                    <>
                        <Card.Title>One Time Appointment</Card.Title>
                        <Card.Subtitle className="mb-2 text-muted"><b>Date:</b> {apt.appointment_date} </Card.Subtitle>
                    </>
                )}
                <Card.Text>
                    Some quick example text to build on the card title and make up the
                    bulk of the card's content.
                </Card.Text>
                <Card.Link href="#">Card Link</Card.Link>
                <Card.Link href="#">Another Link</Card.Link>
            </Card.Body>
        </Card>
    );
}
