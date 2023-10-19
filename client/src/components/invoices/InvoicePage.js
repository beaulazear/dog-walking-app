import React, { useState, useEffect } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from 'react-bootstrap/Col';
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

    if (pets) {
        return (
            <>
                <Container className="m-3">
                    <Row>
                        <Col>
                            <h2 className="display-4">Invoices</h2>
                        </Col>
                    </Row>
                    {pets.map((pet) => (
                        <InvoicePetCard key={pet.id} pet={pet} />
                    ))}
                </Container>
            </>
        )
    } else {
        return (
            <div>...loading</div>
        )
    }
}