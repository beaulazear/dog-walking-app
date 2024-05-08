import React, { useContext } from "react";
import { PetsContext } from "../../context/pets";
import FinancePage from "../finances/FinancePage";
import Card from 'react-bootstrap/Card';
import InvoicePetCard from "./InvoicePetCard";

export default function InvoicesPage() {

    const { pets } = useContext(PetsContext)

    if (pets?.length > 0) {
        return (
            <div style={{marginBottom: '35px', marginLeft: '10px', marginRight: '10px'}}>
                <h2 className="display-4 m-3">Finances</h2>
                <FinancePage />
                {pets.map((pet) => (
                    <InvoicePetCard key={pet.id} pet={pet} />
                ))}
            </div>
        )
    } else {
        return (
            <div style={{marginBottom: '35px', marginLeft: '10px', marginRight: '10px'}}>
                <h2 className="display-4 m-3">Finances</h2>
                <Card className="m-2">
                    <Card.Header as="h5">No pets currently in database</Card.Header>
                    <Card.Body>
                        <Card.Title>Visit the "pets" page to create your first pet.</Card.Title>
                        <Card.Text>
                            Once a pet has been created, you can schedule appointments for said pet. Once an appointment is completed, an invoice will be created and displayed on this page.
                        </Card.Text>
                    </Card.Body>
                </Card>
            </div>
        )
    }
}