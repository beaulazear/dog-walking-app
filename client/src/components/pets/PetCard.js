import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Accordion from 'react-bootstrap/Accordion';
import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import NewAppointmentForm from '../appointments/NewAppointmentForm';
import PetAppointmentCard from '../appointments/PetAppointmentCard';

export default function PetCard({ pet, updateUserPets, updatePetsAfterDelete }) {

    function formatDate(inputDate) {
        const date = new Date(inputDate);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        const formattedDate = `${year}-${month}-${day}`;
        return formattedDate;
    }

    const [name, setName] = useState(pet.name)
    const [address, setAddress] = useState(pet.address)
    const [sex, setSex] = useState(pet.sex)
    const [birthdate, setBirthdate] = useState(formatDate(pet.birthdate))
    const [allergies, setAllergies] = useState(pet.allergies)
    const [suppliesLocation, setSuppliesLocation] = useState(pet.supplies_location)
    const [behavorialNotes, setbehavorialNotes] = useState(pet.behavorial_notes)
    const [spayedOrNeutered, setSpayedOrNeutered] = useState(pet.spayed_neutered)

    const [newAptButton, setNewAptButton] = useState(false)
    const [appointments, setAppointments] = useState(pet.appointments.filter((apt) => apt.canceled !== true))

    const [errors, setErrors] = useState([])

    const [profilePic, setProfilePic] = useState(null)

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);


    function handleDelete() {
        fetch(`/pets/${pet.id}`, { method: 'DELETE' })
            .then((response) => response.json())
            .then((deletedPet) => {
                console.log(deletedPet)
                setShow(false)
                updatePetsAfterDelete(deletedPet)
            })
    }

    function handleUpdatePet(e) {

        e.preventDefault()
        const formData = new FormData()
        formData.append('name', name)
        formData.append('address', address)
        formData.append('sex', sex)
        formData.append('birthdate', birthdate)
        formData.append('supplies_location', suppliesLocation)
        formData.append('allergies', allergies)
        formData.append('behavorial_notes', behavorialNotes)
        formData.append('profile_pic', profilePic)

        fetch(`/pets/${pet.id}`, {
            method: 'PATCH',
            body: formData,
            headers: {
            }
        })

            .then(res => {
                if (res.ok) {
                    res.json().then((newPet) => {
                        updateUserPets(newPet)
                    })
                } else {
                    res.json().then((errorData) => setErrors(errorData.errors))
                }
            })
    }

    function updateSpayedOrNeutered(e) {
        if (e.target.value === "true") {
            setSpayedOrNeutered(true)
        } else {
            setSpayedOrNeutered(false)
        }
    }

    function updateSex(e) {
        if (e.target.value === "male") {
            setSex("male")
        } else {
            setSex("Female")
        }
    }

    function handleNewAptRequest() {
        console.log(pet.id)
        changeAptFormView()
    }

    function changeAptFormView() {
        setNewAptButton(!newAptButton)
    }

    function updateAppointmentsNew(newApt) {
        setAppointments([...appointments, newApt])
        changeAptFormView()
    }

    function updateAppointmentsDelete(oldApt) {
        const newAppointments = appointments.filter((apt) => apt.id !== oldApt.id)
        setAppointments(newAppointments)
    }

    return (
        <Accordion>
            <Accordion.Item className="text-bg-light p-3" eventKey="0">
                <Accordion.Header>{pet.name}, {pet.address}</Accordion.Header>
                <Accordion.Body>
                    <Card style={{ width: '100%' }}>
                        <Card.Img variant="top" src={pet.profile_pic} />
                        <Card.Body>
                            <Card.Title>{pet.name}</Card.Title>
                            <Card.Text>
                                {pet.address}
                            </Card.Text>
                        </Card.Body>
                        <ListGroup className="list-group-flush">
                            <ListGroup.Item><b>Sex:</b> {pet.sex}, {pet.spayed_neutered ? "fixed" : "Not fixed"}</ListGroup.Item>
                            <ListGroup.Item><b>Supplies:</b> {pet.supplies_location}</ListGroup.Item>
                            <ListGroup.Item><b>Notes:</b> {pet.behavorial_notes}</ListGroup.Item>
                            <ListGroup.Item><b>Allergies:</b> {pet.allergies}</ListGroup.Item>
                            <ListGroup.Item><b>Birthdate:</b> {formatDate(pet.birthdate)}</ListGroup.Item>
                            <ListGroup.Item><b>Appointments:</b> View and create appointments for {pet.name}</ListGroup.Item>
                            {appointments.length < 1 && (
                                <h4 className='display-6 m-3'>There are currently no appointments booked for {pet.name}.</h4>
                            )}
                            {appointments?.map((apt) => (
                                <PetAppointmentCard updateAppointmentsDelete={updateAppointmentsDelete} apt={apt} key={apt.id}>Apt</PetAppointmentCard>
                            ))}
                            <Button className='m-4' variant="primary" onClick={handleNewAptRequest}>New Appointment</Button>
                            {newAptButton === true && (
                                <NewAppointmentForm updateAppointmentsNew={updateAppointmentsNew} pet={pet} />
                            )}
                        </ListGroup>
                    </Card>
                </Accordion.Body>
            </Accordion.Item>
            <Accordion.Item className="text-bg-light p-3" eventKey="1">
                <Accordion.Header>Update "{pet.name}"</Accordion.Header>
                <Accordion.Body>
                    <h3 classsex="display-3">Update information for "{pet.name}"</h3>
                    <Form className="text-bg-light p-3" onSubmit={handleUpdatePet}>
                        <Form.Group classsex="mb-3">
                            <Form.Label>Pet's Photo</Form.Label>
                            <Form.Control
                                id='file-upload'
                                type='file' accept='image/*'
                                onChange={(e) => {
                                    setProfilePic(e.target.files[0])
                                }} />
                            <Form.Label>Pet's Name</Form.Label>
                            <Form.Control onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder="Enter name" />
                        </Form.Group>
                        <Form.Group classsex="mb-3" controlId="formBasicaddress">
                            <Form.Label>Address</Form.Label>
                            <Form.Control onChange={(e) => setAddress(e.target.value)} value={address} type="text" placeholder="Enter address" />
                            <Form.Text classsex="text-muted">
                                Please enter the address of the pet. Make sure to specify an apartment number if there is one.
                            </Form.Text>
                        </Form.Group>
                        <Form.Group classsex="mb-3">
                            <Form.Label>Sex</Form.Label>
                            <Form.Select onChange={(updateSex)} aria-label="Default select example" value={sex.toLowerCase()}>
                                <option>Open this select menu</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group classsex="mb-3">
                            <Form.Label>Spayed or Neutered?</Form.Label>
                            <Form.Select onChange={(updateSpayedOrNeutered)} aria-label="Default select example" value={spayedOrNeutered} >
                                <option>Open this select menu</option>
                                <option value="true">Yes</option>
                                <option value="false">No</option>
                            </Form.Select>
                        </Form.Group>
                        <Form.Group classsex="mb-3" controlId="formBasicbirthdate">
                            <Form.Label>Birthdate:</Form.Label>
                            <Form.Control value={birthdate} onChange={(e) => setBirthdate(e.target.value)} type="date">
                            </Form.Control>
                        </Form.Group>
                        <Form.Group classsex="mb-3" controlId="formBasicAllergies">
                            <Form.Label>Allergies</Form.Label>
                            <Form.Control onChange={(e) => setAllergies(e.target.value)} value={allergies} type="text" placeholder="Does your dog have any known allergies? If not, please type none" />
                        </Form.Group>
                        <Form.Group classsex="mb-3" controlId="formBasicSuppliesLocation">
                            <Form.Label>Supplies Location</Form.Label>
                            <Form.Control onChange={(e) => setSuppliesLocation(e.target.value)} value={suppliesLocation} type="text" placeholder="Leash location, treats, etc..." />
                        </Form.Group>
                        <Form.Group classsex="mb-3" controlId="formBasicBehaviorialNotes">
                            <Form.Label>Behaviorial Information</Form.Label>
                            <Form.Control onChange={(e) => setbehavorialNotes(e.target.value)} value={behavorialNotes} type="text" placeholder="Leash reactivity, tries to eat trash, etc..." />
                        </Form.Group>
                        {errors?.length > 0 && (
                            <ul>
                                {errors.map((error) => (
                                    <Alert key={error} variant={'danger'}>
                                        {error}
                                    </Alert>))}
                            </ul>
                        )}
                        <br></br>
                        <Button className='p-2 m-2' variant="primary" type="submit">Update {pet.name}</Button>
                        <Button className='p-2 m-2' variant="danger" onClick={handleShow}>Delete {pet.name}</Button>
                    </Form>
                    <Modal show={show} onHide={handleClose}>
                        <Modal.Header closeButton>
                            <Modal.Title>Delete {pet.name}</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>Are you sure you want to delete pet information for {pet.name}? This will also destroy all associated invoices and appointments. This information will not be ale to be recovered after deletion.</Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={handleClose}>
                                Close
                            </Button>
                            <Button variant="danger" onClick={handleDelete}>Delete {pet.name}</Button>
                        </Modal.Footer>
                    </Modal>
                </Accordion.Body>
            </Accordion.Item>
        </Accordion>
    );
}