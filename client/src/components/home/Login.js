import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/user";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Container from 'react-bootstrap/Container';
import Card from 'react-bootstrap/Card';
import Alert from 'react-bootstrap/Alert';

export default function Login() {

    const { setUser } = useContext(UserContext)
    const navigate = useNavigate()

    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState([])

    function handleLogin(e) {
        e.preventDefault()
        fetch('/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((user) => {
                        setUser(user)
                        navigate('/loggedinhome')
                    })
                } else {
                    response.json().then((errorData) => setError(errorData.error))
                }
            })
    }

    return (
        <Container className="m-3" >
            <h1 className="display-5">User Login</h1>
            <Form onSubmit={handleLogin} className="mb-3">
                <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control type="input" placeholder="Enter username" value={username} onChange={(e) => { setUsername(e.target.value) }} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control type="password" placeholder="Password" value={password} onChange={(e) => { setPassword(e.target.value) }} />
                </Form.Group>
                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
            {error?.length > 0 && (
                <Alert key={error} variant={'danger'}>
                    {error}
                </Alert>
            )}
            {/* <ul>
                {errors.map((error) => (
                    ))}
            </ul> */}
            <Card className="bg-light">
                <Card.Body>
                    <Card.Title>Not signed up?</Card.Title>
                    <Card.Text>
                        Visit the signup page to create your account.
                    </Card.Text>
                    <Button variant="primary" href="signuppage">Signup</Button>
                </Card.Body>
            </Card>
        </Container>
    )
}