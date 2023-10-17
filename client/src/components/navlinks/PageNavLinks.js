import React, { useContext } from "react";
import { useNavigate } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { UserContext } from "../../context/user";

export default function PageNavLinks() {

    const { user, setUser } = useContext(UserContext)

    const navigate = useNavigate()

    function handleLogout() {
        fetch("/logout", {
          method: "DELETE",
        }).then(() => {
          setUser(null)
          navigate('/')
        })
      }

    if (user) {
        return (
            <>
                <Navbar bg="dark" data-bs-theme="dark">
                    <Container>
                        <Navbar.Brand href="/">PocketWalks</Navbar.Brand>
                        <Nav className="me-auto">
                            <Nav.Link href="/petspage">Pets</Nav.Link>
                            <Nav.Link href="/appointmentspage">Appointments</Nav.Link>
                            <Nav.Link href="/invoicespage">Invoices</Nav.Link>
                            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                        </Nav>
                    </Container>
                </Navbar>
            </>
        );
    } else {
        return (
            <>
                <Navbar bg="primary" data-bs-theme="dark">
                    <Container>
                        <Navbar.Brand href="/">PocketWalks</Navbar.Brand>
                        <Nav className="me-auto">
                            <Nav.Link href="/">Home</Nav.Link>
                            <Nav.Link href="/login">Login</Nav.Link>
                        </Nav>
                    </Container>
                </Navbar>
            </>
        );
    }

}