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

export default function PageNavLinks() {

    return (
        <>
            <Navbar bg="dark" data-bs-theme="dark">
                <Container>
                    <Navbar.Brand><Link style={{textDecoration: 'none', color: 'white'}} to="/">PocketWalks</Link></Navbar.Brand>
                    <Nav className="me-auto">
                        <Link style={navLinkStyles} to="/todayswalkspage">Today</Link>
                        <Link style={navLinkStyles} to="/petspage">Pets</Link>
                        <Link style={navLinkStyles} to="/invoicespage">Finances</Link>
                    </Nav>
                </Container>
            </Navbar>
        </>
    );

}