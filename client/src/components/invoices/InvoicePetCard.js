import { Accordion, Button, Card, ListGroup, Modal } from 'react-bootstrap';
import React, { useContext, useState } from "react";
import { PetsContext } from "../../context/pets";
import styled from 'styled-components';
import "bootstrap/dist/css/bootstrap.min.css";
import { DownOutlined } from '@ant-design/icons';
import { Dropdown, Space } from 'antd';
import AdditionalIncomeList from '../finances/AdditionalIncomeList';

const FormContainer = styled.div`
  max-width: 400px;
  margin: 0 auto;
  margin-bottom: 15px;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  text-align: center;
`;

const ErrorMessage = styled.div`
  color: red;
  margin-bottom: 10px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 10px;
`;

const Label = styled.label`
  margin-bottom: 5px;
`;

const Input = styled.input`
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
`;

const FormButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: #fff;
  border: none;
  border-radius: 3px;
  cursor: pointer;

  &:hover {
    background-color: #0056b3;
  }
`;

export default function InvoicePetCard({ pet }) {

    const { pets, setPets } = useContext(PetsContext)

    const [invoices, setInvoices] = useState(pet.invoices.filter((invoice) => invoice.paid !== true && invoice.pending !== true))

    const [paidInvoices, setPaidInvoices] = useState(pet.invoices.filter((invoice) => invoice.paid === true))
    const [pendingInvoices, setPendingInvoices] = useState(pet.invoices.filter((invoice) => invoice.pending === true))

    const [allInvoicesSelected, setAllInvoicesSelected] = useState(false)
    const [tenInvoicesSelected, setTenInvoicesSelected] = useState(true)
    const [thirtyInvoicesSelected, setThirtyInvoicesSelected] = useState(false)

    const [compensation, setCompensation] = useState('');
    const [dateAdded, setDateAdded] = useState('');
    const [description, setDescription] = useState('');
    const [errors, setErrors] = useState([]);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showNewIncomeModal, setShowNewIncomeModal] = useState(false)

    const lastTenInvoices = paidInvoices.slice(-10)
    const lastThirtyInvoices = paidInvoices.slice(-10)

    const handleSubmitAdditionalIncome = (e) => {
        e.preventDefault();

        fetch('/additional_incomes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                pet_id: pet.id,
                date_added: dateAdded,
                description: description,
                compensation: compensation
            }),
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.errors.join(', '));
                    });
                }
                return response.json();
            })
            .then((newIncome) => {
                setCompensation('');
                setDateAdded('');
                setDescription('');
                setErrors([]);
                setPets(pets.map((p) => {
                    if (p.id === pet.id) {
                        p.additional_incomes = [...p.additional_incomes, newIncome]
                        return p
                    } else {
                        return p
                    }
                }))
                toggleAddIncome()
                alert('Additional income added successfully!');
            })
            .catch(error => {
                setErrors([error.message]);
            });
    };

    function handleIncomeDelete(id) {

        fetch(`/additional_incomes/${id}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(errorData.errors.join(', '));
                    });
                }
                return response.json();
            })
            .then((oldIncome) => {
                setPets(pets.map((p) => {
                    if (p.id === pet.id) {
                        p.additional_incomes = p.additional_incomes.map(income => {
                            if (income.id !== oldIncome.id) {
                                return income;
                            } else {
                                return null;
                            }
                        }).filter(income => income !== null);
                        return p;
                    } else {
                        return p;
                    }
                }));
                alert('Additional income removed successfully!');
            })

    }

    const deleteInvoice = (id) => {

        fetch(`/invoices/${id}`, {
            method: 'DELETE',
            headers: {
                "Content-Type": "application/json"
            }
        })
            .then((response) => response.json())
            .then((deletedInvoice) => {
                const petNewInvoices = invoices.filter((invoice) => invoice.id !== deletedInvoice.id)
                setInvoices(petNewInvoices)
                const petPendingInvoices = invoices.filter((invoice) => invoice.id !== deletedInvoice.id)
                setPendingInvoices(petPendingInvoices)
            })
    };

    const toggleEditModal = () => setShowEditModal(!showEditModal);
    const toggleAddIncome = () => setShowNewIncomeModal(!showNewIncomeModal)

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

    let currentTotalNewInvoices = 0
    invoices.forEach((invoice) => currentTotalNewInvoices += invoice.compensation)

    let currentTotalPendingInvoices = 0
    pendingInvoices.forEach((invoice) => currentTotalPendingInvoices += invoice.compensation)

    function markInvoicesAsPending() {

        let arrayOfAppointmentIds = []

        invoices.forEach((invoice) => {
            arrayOfAppointmentIds.push(invoice.id)
        })

        fetch(`/invoices/pending`, {
            method: 'PATCH',
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                id_array: arrayOfAppointmentIds
            })
        })
            .then((response) => response.json())
            .then((newPendingInvoices) => {

                setPendingInvoices([...pendingInvoices, ...newPendingInvoices])

                setInvoices([])
            })
    }

    function markInvoicesAsPaid() {

        let arrayOfAppointmentIds = []

        pendingInvoices.forEach((invoice) => {
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

                setPendingInvoices([])
            })
    }

    function formatDateTime(dateTime) {
        const [datePart, timePart] = dateTime.split('T');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');

        const formattedDateTime = `${getMonthName(month)} ${day}, ${year} ${hour}:${minute}`;
        return formattedDateTime;
    }

    const dayjs = require('dayjs');

    function getMonthName(month) {
        const dateObj = dayjs().month(parseInt(month, 10) - 1);
        return dateObj.format('MMMM');
    }

    let grandTotal = 0
    pet.invoices?.forEach(inv => {
        grandTotal += inv.compensation
    })
    pet.additional_incomes?.forEach((income) => grandTotal += income.compensation)

    return (
        <div>
            <h4>{pet.name}</h4>
            <Accordion style={{ marginBottom: '10px' }}>
                <Accordion.Item className="text-bg-light p-3" eventKey="0">
                    <Accordion.Header>Unpaid Invoices</Accordion.Header>
                    <Accordion.Body>
                        <Modal show={showEditModal} onHide={toggleEditModal}>
                            <Modal.Header closeButton>
                                <Modal.Title>Edit Invoices</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <h4>Unpaid Invoices</h4>
                                <ListGroup>
                                    {invoices?.map((invoice) => (
                                        !invoice.paid && (
                                            <ListGroup.Item key={invoice.id}>
                                                <Button style={{ marginRight: '10px' }} variant="danger" onClick={() => {
                                                    if (window.confirm("Are you sure you want to delete this invoice? This can not be undone.")) {
                                                        deleteInvoice(invoice.id);
                                                    }
                                                }}>Delete</Button>
                                                {formatDateTime(invoice.date_completed)}, ${invoice.compensation}
                                            </ListGroup.Item>
                                        )
                                    ))}
                                    {pendingInvoices?.map((invoice) => (
                                        !invoice.paid && (
                                            <ListGroup.Item key={invoice.id}>
                                                <Button style={{ marginRight: '10px' }} variant="danger" onClick={() => {
                                                    if (window.confirm("Are you sure you want to delete this invoice? This can not be undone.")) {
                                                        deleteInvoice(invoice.id);
                                                    }
                                                }}>Delete</Button>
                                                {formatDateTime(invoice.date_completed)}, ${invoice.compensation}
                                            </ListGroup.Item>
                                        )
                                    ))}
                                    {invoices.length < 1 && pendingInvoices.length < 1 && (
                                        <ListGroup.Item>
                                            There are currently no unpaid invoices for {pet.name}
                                        </ListGroup.Item>
                                    )}
                                </ListGroup>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={toggleEditModal}>Close</Button>
                            </Modal.Footer>
                        </Modal>
                        <Card style={{ width: '100%' }}>
                            <Card.Img
                                variant="top"
                                src={pet.profile_pic}
                                style={{
                                    width: '150px', // Adjust the width as needed
                                    height: '150px', // Adjust the height as needed
                                    objectFit: 'cover',
                                    borderRadius: '50%',
                                    margin: '10px 0 10px 10px', // Adjust the margin values as needed
                                    display: 'inline-block',
                                }}
                            />
                            <Card.Title style={{ marginLeft: '16px' }}>{pet.name}'s New Invoices:</Card.Title>
                            {invoices?.length > 0 && (
                                <>
                                    <p style={{ marginLeft: '16px' }}>New invoices are from recently completed walks. Once you send the invoices to the client, mark as pending until payment is complete.</p>
                                    <ListGroup className="list-group-flush">
                                        {invoices.map((invoice) => (
                                            <ListGroup.Item key={invoice.id}>{formatDateTime(invoice.date_completed)}, ${invoice.compensation}</ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                    <Card.Text className='m-3'>
                                        <b>Total = ${currentTotalNewInvoices}</b>
                                    </Card.Text>
                                    <Button style={{ margin: '5px' }} onClick={markInvoicesAsPending}>Mark new invoices as pending</Button>
                                </>
                            )}
                            {invoices?.length < 1 && (
                                <p style={{ padding: '16px' }}>There are currently no new invoices for {pet.name}. Invoices will be displayed here as walks are completed on the Today page.</p>
                            )}
                            <Card.Title style={{ marginLeft: '16px' }}>{pet.name}'s Pending Invoices:</Card.Title>
                            {pendingInvoices?.length > 0 && (
                                <>
                                    <p style={{ marginLeft: '16px' }}>Pending invoices have been sent to client for payment! Once payment is collected, mark as paid.</p>
                                    <ListGroup className="list-group-flush">
                                        {pendingInvoices.map((invoice) => (
                                            <ListGroup.Item key={invoice.id}>{formatDateTime(invoice.date_completed)}, ${invoice.compensation}</ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                    <Card.Text className='m-3'>
                                        <b>Total = ${currentTotalPendingInvoices}</b>
                                    </Card.Text>
                                    <Button style={{ margin: '5px' }} onClick={markInvoicesAsPaid}>Mark pending as Paid</Button>
                                </>
                            )}
                            {pendingInvoices?.length < 1 && (
                                <p style={{ padding: '16px' }}>There are currently no pending invoices for {pet.name}. Invoices will be displayed here as new invoices are marked as pending.</p>
                            )}
                            <Button style={{ margin: '5px' }} onClick={toggleEditModal}>Edit Invoices</Button>
                        </Card>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item className="text-bg-light p-3" eventKey="1">
                    <Accordion.Header>Paid Invoices / Personal Finance</Accordion.Header>
                    <Accordion.Body>
                        <Card.Img
                            variant="top"
                            src={pet.profile_pic}
                            style={{
                                width: '150px',
                                height: '150px',
                                objectFit: 'cover',
                                borderRadius: '50%',
                                margin: '10px 0 10px 10px',
                                display: 'inline-block',
                            }}
                        />
                        <h3 classsex="display-3">Total Income: ${grandTotal}</h3>
                        <p classsex="display-3">This includes both paid & unpaid invoices. Use the form below to add additional compensation from previous dates!</p>
                        <h3 classsex="display-3">Paid Invoices</h3>
                        {paidInvoices?.length > 0 && (
                            <>
                                <Dropdown menu={{ items }}>
                                    <button onClick={(e) => e.preventDefault()}>
                                        <Space>
                                            Filter
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
                            <p>There are currently no past invoices for {pet.name}. Invoices will show up here once marked as paid.</p>
                        )}
                        <Modal show={showNewIncomeModal} onHide={toggleAddIncome}>
                            <Modal.Header closeButton>
                                <Modal.Title>Add New Additional Income</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <h4>Add additional income</h4>
                            </Modal.Body>
                            <FormContainer>
                                <FormTitle>Add Additional Income</FormTitle>
                                {errors.length > 0 && <ErrorMessage>{errors[0]}</ErrorMessage>}
                                <Form onSubmit={handleSubmitAdditionalIncome}>
                                    <FormField>
                                        <Label htmlFor="compensation">Compensation:</Label>
                                        <Input placeholder='Amount paid in $USD' type="text" id="compensation" value={compensation} onChange={(e) => setCompensation(e.target.value)} />
                                    </FormField>
                                    <FormField>
                                        <Label htmlFor="dateAdded">Date Added:</Label>
                                        <Input type="date" id="dateAdded" value={dateAdded} onChange={(e) => setDateAdded(e.target.value)} />
                                    </FormField>
                                    <FormField>
                                        <Label htmlFor="description">Description:</Label>
                                        <Input type="text" id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                                    </FormField>
                                    <FormButton type="submit">Add Additional Income</FormButton>
                                </Form>
                            </FormContainer>
                        </Modal>
                        <h3 classsex="display-3">Add new payment</h3>
                        <Button style={{ marginBottom: '10px' }} onClick={toggleAddIncome}>Additional Income Form</Button>

                        {pet.additional_incomes.length > 0 && (
                            <AdditionalIncomeList handleIncomeDelete={handleIncomeDelete} items={pet.additional_incomes} />
                        )}
                        {pet.additional_incomes.length < 1 && (
                            <p>Additional incomes will be displayed here once submitted.</p>
                        )}
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}