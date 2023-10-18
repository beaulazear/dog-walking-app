import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Accordion from 'react-bootstrap/Accordion';
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";

export default function InvoicePetCard({ pet, updateUserPets }) {

    const [invoices, setInvoices] = useState(pet.invoices)

    let currentInvoices = invoices.filter((invoice) => invoice.paid === false)

    let paidInvoices = invoices.filter((invoice) => invoice.paid === true)

    let currentTotal = 0

    currentInvoices.forEach((invoice) => currentTotal += invoice.compensation)

    function UpdateCurrentInvoice() {
        currentInvoices.forEach((invoice) => {
            fetch(`/invoices/${invoice.id}/paid`)
            .then((response) => response.json())
            .then((newInvoice) => {
                paidInvoices.push(newInvoice)
            })
        })
        setInvoices(paidInvoices)
    }

    return (
        <Accordion className='m-3'>
            <Accordion.Item className="text-bg-light p-3" eventKey="0">
                <Accordion.Header>Current Invoice for {pet.name}</Accordion.Header>
                <Accordion.Body>
                    <h3 classsex="display-3">Current Invoice For "{pet.name}"</h3>
                    <Card style={{ width: '100%' }}>
                        <Card.Img variant="top" src={pet.profile_pic} />
                        <Card.Body>
                            <Card.Title>{pet.name}</Card.Title>
                        </Card.Body>
                        <ListGroup className="list-group-flush">
                            {currentInvoices.map((invoice) => (
                                <ListGroup.Item key={invoice.id}>{invoice.date_completed}, ${invoice.compensation}</ListGroup.Item>
                            ))}
                        </ListGroup>
                        <Card.Text className='m-3'>
                            <b>Total = ${currentTotal}</b>
                        </Card.Text>
                        <Button onClick={UpdateCurrentInvoice}>Paid</Button>
                    </Card>
                </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item className="text-bg-light p-3" eventKey="1">
                <Accordion.Header>Past invoices for {pet.name}</Accordion.Header>
                <Accordion.Body>
                    <h3 classsex="display-3">Past Invoices For "{pet.name}"</h3>
                    <ListGroup className="list-group-flush">
                        {paidInvoices.map((invoice) => (
                            <ListGroup.Item key={invoice.id}>{invoice.date_completed}, ${invoice.compensation}</ListGroup.Item>
                        ))}
                    </ListGroup>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}