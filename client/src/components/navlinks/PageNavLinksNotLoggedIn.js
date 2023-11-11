import React from "react";
import { Link } from 'react-router-dom';
import "bootstrap/dist/css/bootstrap.min.css";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';

const navLinkStyles = {
    textDecoration: 'none',
    color: 'white',
    transition: 'color 0.3s ease-in-out',
    padding: '10px'
}

export default function PageNavLinksNotLoggedIn() {

    return (
        <>
            <Navbar bg="primary" data-bs-theme="dark">
                <Container>
                    <Navbar.Brand>PocketWalks</Navbar.Brand>
                    <Nav className="me-auto">
                        <Link style={navLinkStyles} to='/'>Home</Link>
                        <Link style={navLinkStyles} to="/login">Login</Link>
                        <Link style={navLinkStyles} to="/signuppage">Signup</Link>
                    </Nav>
                </Container>
            </Navbar>
        </>
    );
}