import React, { useContext } from "react";
import { useNavigate, Link } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

import { UserContext } from "../../context/user";

const navLinkStyles = {
    textDecoration: 'none',
    color: 'white',
    transition: 'color 0.3s ease-in-out',
    padding: '10px'
}

export default function PageNavLinks() {

    const { setUser } = useContext(UserContext)

    const navigate = useNavigate()

    function handleLogout() {
        fetch("/logout", {
            method: "DELETE",
        }).then(() => {
            setUser(null)
            navigate('/')
        })
    }

    return (
        <>
            <Navbar bg="dark" data-bs-theme="dark">
                <Container>
                    <Navbar.Brand to="/">PocketWalks</Navbar.Brand>
                    <Nav className="me-auto">
                        <Link style={navLinkStyles} to="/petspage">Pets</Link>
                        <Link style={navLinkStyles} to="/todayswalkspage">Today</Link>
                        <Link style={navLinkStyles} to="/invoicespage">Invoices</Link>
                        <Link style={navLinkStyles} onClick={handleLogout}>Logout</Link>
                    </Nav>
                </Container>
            </Navbar>
        </>
    );

}