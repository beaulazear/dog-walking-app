import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Accordion from 'react-bootstrap/Accordion';
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Space } from 'antd';

// getting cleanup error when switching out of invoice page... saying it starts from invoicepetcard i believe.

export default function InvoicePetCard({ pet, updateUserPets }) {

    const [invoices, setInvoices] = useState(pet.invoices.filter((invoice) => invoice.paid !== true))

    const [paidInvoices, setPaidInvoices] = useState(pet.invoices.filter((invoice) => invoice.paid === true))

    const [allInvoicesSelected, setAllInvoicesSelected] = useState(false)
    const [tenInvoicesSelected, setTenInvoicesSelected] = useState(true)
    const [thirtyInvoicesSelected, setThirtyInvoicesSelected] = useState(false)

    const lastTenInvoices = paidInvoices.slice(-10)
    const lastThirtyInvoices = paidInvoices.slice(-10)

    function changeToAllInvoices() {
        setAllInvoicesSelected(true)
        setTenInvoicesSelected(false)
        setThirtyInvoicesSelected(false)
    }
    function changeToTenInvoices() {
        setAllInvoicesSelected(false)
        setTenInvoicesSelected(true)
        setThirtyInvoicesSelected(false)
    }
    function changeTo30Invoices() {
        setAllInvoicesSelected(false)
        setTenInvoicesSelected(false)
        setThirtyInvoicesSelected(true)
    }

    const items = [
        {
            key: '1',
            label: (
                <button rel="noopener noreferrer" onClick={changeToAllInvoices}>
                    View all invoices
                </button>
            ),
        },
        {
            key: '2',
            label: (
                <button rel="noopener noreferrer" onClick={changeToTenInvoices}>
                    View past 10 invoices
                </button>
            ),
        },
        {
            key: '3',
            label: (
                <button rel="noopener noreferrer" onClick={changeTo30Invoices}>
                    View past 30 invoices
                </button>
            ),
        }
    ];

    let currentTotal = 0

    invoices.forEach((invoice) => currentTotal += invoice.compensation)

    function UpdateCurrentInvoice() {

        let arrayOfAppointmentIds = []

        invoices.forEach((invoice) => {
            arrayOfAppointmentIds.push(invoice.id)
        })

        fetch(`/invoices/paid`, {
            method: 'PATCH',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_array: arrayOfAppointmentIds
            })
        })
            .then((response) => response.json())
            .then((newPaidInvoices) => {

                setPaidInvoices([...paidInvoices, ...newPaidInvoices])

                setInvoices([])
            })
    }

    function formatDateTime(dateTime) {
        // Split the timestamp string
        const [datePart, timePart] = dateTime.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');

        // Format the components as desired (without weekday)
        const formattedDateTime = `${getMonthName(month)} ${day}, ${year} ${hour}:${minute}`;
        return formattedDateTime;
    }

    const dayjs = require('dayjs');

    function getMonthName(month) {
        // Create a day.js object to get month name
        const dateObj = dayjs().month(parseInt(month, 10) - 1);
        // Get the month name
        return dateObj.format('MMMM');
    }

    return (
        <Accordion style={{ marginBottom: '10px' }}>
            <Accordion.Item className="text-bg-light p-3" eventKey="0">
                <Accordion.Header>Current Invoice for {pet.name}</Accordion.Header>
                <Accordion.Body>
                    <h3 classsex="display-3">Current Invoices For "{pet.name}"</h3>
                    <Card style={{ width: '100%' }}>
                        <Card.Img
                            variant="top"
                            src={pet.profile_pic}
                            style={{
                                width: '150px', // Adjust the width as needed
                                height: '150px', // Adjust the height as needed
                                objectFit: 'cover',
                                borderRadius: '50%',
                                margin: '10px 0 0 10px', // Adjust the margin values as needed
                                display: 'inline-block',
                            }}
                        />
                        <Card.Body>
                            <Card.Title>{pet.name}</Card.Title>
                        </Card.Body>
                        {invoices?.length > 0 && (
                            <>
                                <ListGroup className="list-group-flush">
                                    {invoices.map((invoice) => (
                                        <ListGroup.Item key={invoice.id}>{formatDateTime(invoice.date_completed)}, ${invoice.compensation}</ListGroup.Item>
                                    ))}
                                </ListGroup>
                                <Card.Text className='m-3'>
                                    <b>Total = ${currentTotal}</b>
                                </Card.Text>
                                <Button onClick={UpdateCurrentInvoice}>Paid</Button>
                            </>
                        )}
                        {invoices?.length < 1 && (
                            <p style={{ padding: '10px' }}>There are currently no invoices for {pet.name}. Invoices will be displayed here as walks are completed on the Today page.</p>
                        )}
                    </Card>
                </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item className="text-bg-light p-3" eventKey="1">
                <Accordion.Header>Past invoices for {pet.name}</Accordion.Header>
                <Accordion.Body>
                    <Card.Img
                        variant="top"
                        src={pet.profile_pic}
                        style={{
                            width: '150px', // Adjust the width as needed
                            height: '150px', // Adjust the height as needed
                            objectFit: 'cover',
                            borderRadius: '50%',
                            margin: '10px 0 0 10px', // Adjust the margin values as needed
                            display: 'inline-block',
                        }}
                    />
                    {paidInvoices?.length > 0 && (
                        <>
                            <h3 classsex="display-3">Past Invoices For "{pet.name}"</h3>
                            <Dropdown menu={{ items }}>
                                <button onClick={(e) => e.preventDefault()}>
                                    <Space>
                                        Filter invoices
                                        <DownOutlined />
                                    </Space>
                                </button>
                            </Dropdown>
                            <ListGroup className="list-group-flush">
                                {allInvoicesSelected === true && (
                                    <>
                                        {paidInvoices.map((invoice) => (
                                            <ListGroup.Item key={invoice.id}>{formatDateTime(invoice.date_completed)}, ${invoice.compensation}</ListGroup.Item>
                                        ))}
                                    </>
                                )}
                                {tenInvoicesSelected === true && (
                                    <>
                                        {lastTenInvoices.map((invoice) => (
                                            <ListGroup.Item key={invoice.id}>{formatDateTime(invoice.date_completed)}, ${invoice.compensation}</ListGroup.Item>
                                        ))}
                                    </>
                                )}
                                {thirtyInvoicesSelected === true && (
                                    <>
                                        {lastThirtyInvoices.map((invoice) => (
                                            <ListGroup.Item key={invoice.id}>{formatDateTime(invoice.date_completed)}, ${invoice.compensation}</ListGroup.Item>
                                        ))}
                                    </>
                                )}
                            </ListGroup>
                        </>
                    )}
                    {paidInvoices?.length < 1 && (
                        <p style={{ padding: '10px' }}>There are currently no past invoices for {pet.name}. Invoices will show up here once marked as paid.</p>
                    )}
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}