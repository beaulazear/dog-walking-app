import React, { useState, useContext } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import Card from 'react-bootstrap/Card';
import ListGroup from 'react-bootstrap/ListGroup';
import Accordion from 'react-bootstrap/Accordion';
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from 'react-bootstrap/Alert';
import Modal from 'react-bootstrap/Modal';
import NewAppointmentForm from '../appointments/NewAppointmentForm';
import PetAppointmentCard from '../appointments/PetAppointmentCard';
import { AppointmentsContext } from "../../context/appointments";

export default function PetCard({ pet, updateUserPets, updatePetsAfterDelete }) {
    const dayjs = require('dayjs');
    dayjs().format();

    const { petsAppointments, setPetsAppointments, setTodaysAppointments, todaysAppointments } = useContext(AppointmentsContext);

    const currentPetAppointments = petsAppointments?.filter((apt) => apt.pet.id === pet.id);

    const [name, setName] = useState(pet.name);
    const [address, setAddress] = useState(pet.address);
    const [sex, setSex] = useState(pet.sex);
    const [birthdate, setBirthdate] = useState(formatDate(pet.birthdate));
    const [allergies, setAllergies] = useState(pet.allergies);
    const [suppliesLocation, setSuppliesLocation] = useState(pet.supplies_location);
    const [behavioralNotes, setBehavioralNotes] = useState(pet.behavorial_notes);
    const [spayedOrNeutered, setSpayedOrNeutered] = useState(pet.spayed_neutered);

    const [newAptButton, setNewAptButton] = useState(false);

    const [errors, setErrors] = useState([]);

    const [profilePic, setProfilePic] = useState(pet.profile_pic);

    const [show, setShow] = useState(false);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    function formatDate(inputDate) {
        const [year, month, day] = inputDate.split('T')[0].split('-');
        return `${year}-${month}-${day}`;
    }

    function handleDelete() {
        fetch(`/pets/${pet.id}`, { method: 'DELETE' })
            .then((response) => response.json())
            .then((deletedPet) => {
                updatePetsAfterDelete(deletedPet); // Update the state first
                handleClose(); // Close the modal after updating the state
            })
            .catch((error) => {
                console.error('Error deleting pet:', error);
            });
    }

    function handleUpdatePet(e) {
        e.preventDefault();

        const formData = new FormData();

        formData.append('name', name);
        formData.append('address', address);
        formData.append('sex', sex);
        formData.append('birthdate', birthdate);
        formData.append('supplies_location', suppliesLocation);
        formData.append('allergies', allergies);
        formData.append('behavorial_notes', behavioralNotes);
        // please note spelling of behavioral is wrong in the database

        if (profilePic instanceof File) {
            formData.append('profile_pic', profilePic);
        }

        fetch(`/pets/${pet.id}`, {
            method: 'PATCH',
            body: formData,
            // headers: {}, // Add headers if needed
        })
            .then(res => {
                if (res.ok) {
                    res.json().then((newPet) => {
                        alert("Successfully Updated!");
                        updateUserPets(newPet);
                        setTodaysAppointments(todaysAppointments.map((apt) => {
                            if (apt.pet.id === pet.id) {
                                apt.pet = newPet;
                            }
                            return apt;
                        }));
                    });
                } else {
                    res.json().then((errorData) => setErrors(errorData.errors));
                }
            })
            .catch(error => {
                console.error('Error updating pet:', error);
            });
    }

    function updateSpayedOrNeutered(e) {
        setSpayedOrNeutered(e.target.value === "true");
    }

    function updateSex(e) {
        setSex(e.target.value);
    }

    function changeAptFormView() {
        setNewAptButton(!newAptButton);
    }

    function updateAppointmentsNew(newApt) {
        const updatedAppointments = [...petsAppointments, newApt];
        setPetsAppointments(updatedAppointments);

        if (newApt.recurring) {
            switch (new Date().getDay()) {
                case 0:
                    if (newApt.sunday) {
                        setTodaysAppointments([...todaysAppointments, newApt].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
                    }
                    break;
                case 1:
                    if (newApt.monday) {
                        setTodaysAppointments([...todaysAppointments, newApt].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
                    }
                    break;
                case 2:
                    if (newApt.tuesday) {
                        setTodaysAppointments([...todaysAppointments, newApt].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
                    }
                    break;
                case 3:
                    if (newApt.wednesday) {
                        setTodaysAppointments([...todaysAppointments, newApt].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
                    }
                    break;
                case 4:
                    if (newApt.thursday) {
                        setTodaysAppointments([...todaysAppointments, newApt].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
                    }
                    break;
                case 5:
                    if (newApt.friday) {
                        setTodaysAppointments([...todaysAppointments, newApt].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
                    }
                    break;
                case 6:
                    if (newApt.saturday) {
                        setTodaysAppointments([...todaysAppointments, newApt].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
                    }
                    break;
                default:
                    console.log('Error');
            }
        } else {
            const today = dayjs();
            const formattedToday = today.format('YYYY-MM-DD');
            const formattedAptDate = formatDate(newApt.appointment_date);

            if (formattedAptDate === formattedToday) {
                setTodaysAppointments([...todaysAppointments, newApt].sort((a, b) => new Date(a.start_time) - new Date(b.start_time)));
            }
        }

        changeAptFormView();
    }

    function updateAppointmentsDelete(oldApt) {
        const updatedAppointments = petsAppointments.filter((apt) => apt.id !== oldApt.id);
        setPetsAppointments(updatedAppointments);
    }

    return (
        <div>
            <h4>{pet.name}</h4>
            <Accordion className="mb-3">
                <Accordion.Item eventKey="0">
                    <Accordion.Header>Information & Appointments</Accordion.Header>
                    <Accordion.Body>
                        <Card className="mb-3 shadow-sm">
                            <Card.Body className="d-flex align-items-center">
                                <div style={{ flex: '1 1 auto', paddingRight: '20px' }}>
                                    <Card.Title style={{ fontSize: '25px', fontWeight: 'bold' }}>{pet.name}</Card.Title>
                                    <Card.Text>
                                        {pet.sex}, {pet.spayed_neutered ? "fixed" : "Not fixed"}
                                        <br></br>
                                        {pet.address}
                                    </Card.Text>
                                </div>
                                <Card.Img
                                    variant="top"
                                    src={pet.profile_pic}
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        objectFit: 'cover',
                                        borderRadius: '10px',
                                    }}
                                />
                            </Card.Body>
                            <ListGroup className="list-group-flush">
                                <ListGroup.Item><b>Supplies:</b> {pet.supplies_location}</ListGroup.Item>
                                <ListGroup.Item><b>Notes:</b> {pet.behavorial_notes}</ListGroup.Item>
                                <ListGroup.Item><b>Allergies:</b> {pet.allergies}</ListGroup.Item>
                                <ListGroup.Item><b>Birthdate:</b> {formatDate(pet.birthdate)}</ListGroup.Item>
                                {currentPetAppointments?.length === 0 && (
                                    <h4 className='display-8 m-2 p-2' style={{ textAlign: 'center' }}>No appointments scheduled</h4>
                                )}
                                {currentPetAppointments?.map((apt) => (
                                    <PetAppointmentCard updateAppointmentsDelete={updateAppointmentsDelete} apt={apt} key={apt.id} />
                                ))}
                                <Button className='m-2' variant="primary" onClick={changeAptFormView}>Schedule New Appointment</Button>
                                {newAptButton && (
                                    <NewAppointmentForm updateAppointmentsNew={updateAppointmentsNew} pet={pet} />
                                )}
                            </ListGroup>
                        </Card>
                    </Accordion.Body>
                </Accordion.Item>
                <Accordion.Item eventKey="1">
                    <Accordion.Header>Update {pet.name}</Accordion.Header>
                    <Accordion.Body>
                        <Form className="text-bg-light p-3" encType="multipart/form-data" onSubmit={handleUpdatePet}>
                            <Form.Group className="mb-3">
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
                            <Form.Group className="mb-3" controlId="formBasicaddress">
                                <Form.Label>Address</Form.Label>
                                <Form.Control onChange={(e) => setAddress(e.target.value)} value={address} type="text" placeholder="Enter address" />
                                <Form.Text className="text-muted">
                                    Please enter the address of the pet. Make sure to specify an apartment number if there is one.
                                </Form.Text>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Sex</Form.Label>
                                <Form.Select onChange={updateSex} aria-label="Default select example" value={sex}>
                                    <option>Open this select menu</option>
                                    <option value="male">Male</option>
                                    <option value="female">Female</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Spayed or Neutered?</Form.Label>
                                <Form.Select onChange={updateSpayedOrNeutered} aria-label="Default select example" value={spayedOrNeutered.toString()}>
                                    <option>Open this select menu</option>
                                    <option value="true">Yes</option>
                                    <option value="false">No</option>
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicbirthdate">
                                <Form.Label>Birthdate:</Form.Label>
                                <Form.Control value={birthdate} onChange={(e) => setBirthdate(e.target.value)} type="date">
                                </Form.Control>
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicAllergies">
                                <Form.Label>Allergies</Form.Label>
                                <Form.Control onChange={(e) => setAllergies(e.target.value)} value={allergies} type="text" placeholder="Does your dog have any known allergies? If not, please type none" />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicSuppliesLocation">
                                <Form.Label>Supplies Location</Form.Label>
                                <Form.Control as="textarea" rows={3} onChange={(e) => setSuppliesLocation(e.target.value)} value={suppliesLocation} type="text" placeholder="Leash location, treats, etc..." />
                            </Form.Group>
                            <Form.Group className="mb-3" controlId="formBasicBehavioralNotes">
                                <Form.Label>Behavioral Information</Form.Label>
                                <Form.Control as="textarea" rows={3} onChange={(e) => setBehavioralNotes(e.target.value)} value={behavioralNotes} type="text" placeholder="Leash reactivity, tries to eat trash, etc..." />
                                {errors?.length > 0 && (
                                    <div>
                                        {errors.map((error) => (
                                            <Alert key={error} variant={'danger'}>
                                                {error}
                                            </Alert>
                                        ))}
                                    </div>
                                )}
                            </Form.Group>
                            <br />
                            <Button className='p-2 m-2' variant="primary" type="submit">Update</Button>
                            <Button className='p-2 m-2' variant="danger" onClick={handleShow}>Delete</Button>
                        </Form>
                        <Modal show={show} onHide={handleClose}>
                            <Modal.Header closeButton>
                                <Modal.Title>Delete {pet.name}</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>Are you sure you want to delete pet information for {pet.name}? This will also destroy all associated invoices and appointments. This information will not be able to be recovered after deletion.</Modal.Body>
                            <Modal.Footer>
                                <Button variant="secondary" onClick={handleClose}>Close</Button>
                                <Button variant="danger" onClick={handleDelete}>Delete {pet.name}</Button>
                            </Modal.Footer>
                        </Modal>
                    </Accordion.Body>
                </Accordion.Item>
            </Accordion>
        </div>
    );
}
