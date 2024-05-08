import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../context/user";
import "bootstrap/dist/css/bootstrap.min.css";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Alert from 'react-bootstrap/Alert';

export default function Signup() {
    const { setUser } = useContext(UserContext);
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [thirty, setThirty] = useState(0);
    const [fourty, setFourty] = useState(0);
    const [sixty, setSixty] = useState(0);
    const [soloRate, setSoloRate] = useState(0);
    const [errors, setErrors] = useState([]);

    function handleSignup(e) {
        e.preventDefault();

        fetch("/users", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: username,
                name: name,
                email_address: email,
                password: password,
                password_confirmation: passwordConfirmation,
                thirty: parseInt(thirty),
                fourty: parseInt(fourty),
                sixty: parseInt(sixty),
                solo_rate: parseInt(soloRate),
            })
        })
            .then((response) => {
                if (response.ok) {
                    response.json().then((newUser) => {
                        setUser(newUser);
                        navigate('/');
                    });
                } else {
                    response.json().then((errorData) => setErrors(errorData.errors));
                }
            });
    }

    return (
        <>
            <h1 className="display-5 m-3">Create Your Account</h1>
            <Form className="m-3" onSubmit={handleSignup}>
                <h4 style={{marginBottom: '15px'}}>User Information:</h4>
                <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control onChange={(e) => setUsername(e.target.value)} value={username} type="text" placeholder="Enter Username" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label>Email address</Form.Label>
                    <Form.Control onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder="Enter Email" />
                    <Form.Text className="text-muted">
                        We'll never share your email with anyone else.
                    </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Name</Form.Label>
                    <Form.Control onChange={(e) => setName(e.target.value)} value={name} type="text" placeholder="Enter Name" />
                    <Form.Text className="text-muted">
                        Please enter your preferred name.
                    </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicPassword">
                    <Form.Label>Password</Form.Label>
                    <Form.Control onChange={(e) => setPassword(e.target.value)} value={password} type="password" placeholder="Password" />
                </Form.Group>
                <Form.Group className="mb-3" controlId="formBasicPasswordConfirmation">
                    <Form.Label>Password Confirmation</Form.Label>
                    <Form.Control onChange={(e) => setPasswordConfirmation(e.target.value)} value={passwordConfirmation} type="password" placeholder="Password Confirmation" />
                </Form.Group>
                <h4 style={{marginBottom: '15px'}}>Walk Rates: (These can be changed later on)</h4>
                <Form.Group className="mb-3">
                    <Form.Label>30 minute walk rate $</Form.Label>
                    <Form.Control onChange={(e) => setThirty(e.target.value)} value={thirty} type="number" placeholder="Enter Thirty" />
                    <Form.Text className="text-muted">
                        How much you would like to charge for 30 minute walks.
                    </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>45 minute walk rate $</Form.Label>
                    <Form.Control onChange={(e) => setFourty(e.target.value)} value={fourty} type="number" placeholder="Enter fourty" />
                    <Form.Text className="text-muted">
                        How much you would like to charge for 45 minute walks.
                    </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>60 minute walk rate $</Form.Label>
                    <Form.Control onChange={(e) => setSixty(e.target.value)} value={sixty} type="number" placeholder="Enter Sixty" />
                    <Form.Text className="text-muted">
                        How much you would like to charge for 60 minute walks.
                    </Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Solo-walk upcharge $</Form.Label>
                    <Form.Control onChange={(e) => setSoloRate(e.target.value)} value={soloRate} type="number" placeholder="Enter Solo Rate" />
                    <Form.Text className="text-muted">
                        How much you would like to upcharge for solo-walks.
                    </Form.Text>
                </Form.Group>
                {errors?.length > 0 && (
                    <ul>
                        {errors.map((error) => (
                            <Alert key={error} variant={'danger'}>
                                {error}
                            </Alert>
                        ))}
                    </ul>
                )}
                <Button variant="primary" type="submit">
                    Submit
                </Button>
            </Form>
        </>
    );
}
