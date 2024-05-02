import React, { useContext } from "react";
import { TodaysAppointmentsContext } from "../../context/todaysAppointments";
import { UserContext } from "../../context/user";
import { PetsContext } from "../../context/pets"
import "bootstrap/dist/css/bootstrap.min.css";
import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Rates from "./Rates";

export default function LoggedInHome() {

    const { todaysAppointments } = useContext(TodaysAppointmentsContext)
    const { user, setUser } = useContext(UserContext)
    const { pets } = useContext(PetsContext)

    const updateUserRates = (rates) => {
        setUser({ ...user, ...rates });
        window.alert("Rates have been updated!")
    };

    return (
        <>
            <h1 className="display-4 m-3">Welcome, {user.username}.</h1>
            <Card className="m-2">
                <Card.Header as="h5">Today's Schedule</Card.Header>
                <Card.Body>
                    {todaysAppointments?.length === 0 && (
                        <Card.Title>You have no appointments scheduled for today.</Card.Title>
                    )}
                    {todaysAppointments?.length === 1 && (
                        <Card.Title>You have {todaysAppointments?.length} appointment today.</Card.Title>
                    )}
                    {todaysAppointments?.length > 1 && (
                        <Card.Title>You have {todaysAppointments?.length} appointments today.</Card.Title>
                    )}
                    <Card.Text>
                        Visit the "Today" page to view appointments and mark them as completed as you go. Invoices will be created as you go and can be viewed on the "Finances" Page
                    </Card.Text>
                    <Button variant="primary" href="/todayswalkspage">Today's Walks</Button>
                </Card.Body>
            </Card>
            <Card className="m-2">
                <Card.Header as="h5">Set Your Rates</Card.Header>
                <Card.Body>
                    <Card.Title>Your current rates for appointments.</Card.Title>
                    {user.thirty === null && user.fourty === null && user.sixty === null && (
                        <Card.Text>
                            You have not yet set your rates! This means walks will be defaulted to $22 for 30 minute walks, $28 for 45 minute walks, & $33 for 60 minute walks. Use the form below to update your rates.
                        </Card.Text>
                    )}
                    {user.thirty !== null && user.fourty !== null && user.sixty !== null && (
                        <Card.Text>
                            Use the form below to update your rates. This wll be reflected on new invoices.
                        </Card.Text>
                    )}
                    <Rates user={user} updateUserRates={updateUserRates} />
                </Card.Body>
            </Card>
            <Card className="m-2">
                <Card.Header as="h5">Current Pets</Card.Header>
                <Card.Body>
                    <Card.Title>You have {pets?.length} pets in your database!</Card.Title>
                    <Card.Text>
                        Visit the "Pets" page to view, edit, & delete these pets. Here you can create appointments for each pet as well.
                    </Card.Text>
                    <Button variant="primary" href="/petspage">Pets Page</Button>
                </Card.Body>
            </Card>
            <Card className="m-2">
                <Card.Header as="h5">Finances</Card.Header>
                <Card.Body>
                    <Card.Title>Personal finances for all pets</Card.Title>
                    <Card.Text>
                        Visit the "Finance" page to view current invoices (unpaid), and past invoices (paid) for each pet in your database. Here you can add additional incomes/past payments & view yearly income totals.
                    </Card.Text>
                    <Button variant="primary" href="/invoicespage">Finances Page</Button>
                </Card.Body>
            </Card>
        </>
    )
}
