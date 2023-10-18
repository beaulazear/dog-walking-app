import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Card from 'react-bootstrap/Card';

export default function HomePage() {
    return (
        <>
            <h1 className="display-4 m-3">Welcome to PocketWalks</h1>
            <h2 className="m-3">Login or Signup to gain access to the following:</h2>
            <Card className="m-2">
                <Card.Header as="h5">Current Pets</Card.Header>
                <Card.Body>
                    <Card.Title>Your Own Pet Database</Card.Title>
                    <Card.Text>
                        the "Pets" page to view, edit, & delete these pets.
                    </Card.Text>
                </Card.Body>
            </Card>
            <Card className="m-2">
                <Card.Header as="h5">Appointment Scheduling</Card.Header>
                <Card.Body>
                    <Card.Title>Keep track of your pet care appointments</Card.Title>
                    <Card.Text>
                        Add, edit, and delete appointments for pets in your database. Gain access to the "Today" page to view appointments scheduled for today and mark them as completed as you go. Invoices are created upon completion of appointment.
                    </Card.Text>
                </Card.Body>
            </Card>
            <Card className="m-2">
                <Card.Header as="h5">View Invoices</Card.Header>
                <Card.Body>
                    <Card.Title>Current and past invoices for all pets</Card.Title>
                    <Card.Text>
                        Visit the "Invoice" page to view current invoices (unpaid), and past invoices (paid) for each pet in your database.
                    </Card.Text>
                </Card.Body>
            </Card>
        </>
    )
}
