import React, { useContext } from "react";
import { TodaysAppointmentsContext } from "../../context/todaysAppointments";
import { UserContext } from "../../context/user";
import { PetsContext } from "../../context/pets"
import "bootstrap/dist/css/bootstrap.min.css";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

export default function LoggedInHome() {

    const { todaysAppointments } = useContext(TodaysAppointmentsContext)
    const { user } = useContext(UserContext)
    const { pets } = useContext(PetsContext)

    return (
        <>
            <h1 className="display-4 m-3">Welcome, {user.username}.</h1>
            <Card className="m-2">
                <Card.Header as="h5">Today's Schedule</Card.Header>
                <Card.Body>
                    {todaysAppointments?.length > 0 && (
                        <Card.Title>You have {todaysAppointments?.length} appointments today.</Card.Title>
                    )}
                    <Card.Text>
                        Visit the "Today" page to view appointments and mark them as completed as you go.
                    </Card.Text>
                    <Button variant="primary" href="/todayswalkspage">Today's Walks</Button>
                </Card.Body>
            </Card>
            <Card className="m-2">
                <Card.Header as="h5">Current Pets</Card.Header>
                <Card.Body>
                    <Card.Title>You have {pets?.length} pets in your database!</Card.Title>
                    <Card.Text>
                        Visit the "Pets" page to view, edit, & delete these pets.
                    </Card.Text>
                    <Button variant="primary" href="/petspage">Pets Page</Button>
                </Card.Body>
            </Card>
            <Card className="m-2">
                <Card.Header as="h5">View Invoices</Card.Header>
                <Card.Body>
                    <Card.Title>Current and past invoices for all pets</Card.Title>
                    <Card.Text>
                        Visit the "Invoice" page to view current invoices (unpaid), and past invoices (paid) for each pet in your database.
                    </Card.Text>
                    <Button variant="primary" href="/invoicespage">Invoices Page</Button>
                </Card.Body>
            </Card>
        </>
    )
}

