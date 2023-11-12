import React, { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import InvoicePetCard from "./InvoicePetCard";

export default function InvoicesPage() {

    const [pets, setPets] = useState([])

    useEffect(() => {
        fetch("/pets").then((response) => {
            if (response.ok) {
                response.json().then((pets) => {
                    setPets(pets)
                });
            }
        });
    }, []);

    if (pets.length > 0) {
        return (
            <Container>
                <h2 className="display-4 m-3">Invoices</h2>
                {pets.map((pet) => (
                    <InvoicePetCard key={pet.id} pet={pet} />
                ))}
            </Container>
        )
    } else {
        return (
            <>
                <Container className="m-3">
                    <Row>
                        <Col>
                            <h2 className="display-4">Invoices</h2>
                        </Col>
                    </Row>
                </Container>
                <Card className="m-2">
                    <Card.Header as="h5">No pets currently in database</Card.Header>
                    <Card.Body>
                        <Card.Title>Visit the "pets" page to create your first pet.</Card.Title>
                        <Card.Text>
                            Once a pet has been created, you can schedule appointments for said pet. Once an appointment is completed, an invoice will be created and displayed on this page.
                        </Card.Text>
                    </Card.Body>
                </Card>
            </>
        )
    }
}