import React, { useState } from "react";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

export default function Rates({ user, updateUserRates }) {
    const [thirty, setThirty] = useState(user.thirty || 22);
    const [fourty, setFourty] = useState(user.fourty || 28);
    const [sixty, setSixty] = useState(user.sixty || 33);
    const [solo, setSolo] = useState(user.solo_rate || 0)

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/change_rates", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    thirty,
                    fourty,
                    sixty,
                    solo_rate: solo,
                })
            });

            if (!response.ok) {
                throw new Error("Failed to update rates");
            }

            const data = await response.json();
            updateUserRates(data);
        } catch (error) {
            console.error("Error updating rates:", error);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Group controlId="thirtyRate">
                <Form.Label>30-minute walk</Form.Label>
                <Form.Control
                    type="text"
                    value={"$" + thirty}
                    onChange={(e) => {
                        const newValue = e.target.value.replace(/^\$/, ''); // Remove $ if it's entered
                        setThirty(newValue);
                    }}
                />
            </Form.Group>
            <Form.Group controlId="fourtyRate">
                <Form.Label>45-minute walk</Form.Label>
                <Form.Control
                    type="text"
                    value={"$" + fourty}
                    onChange={(e) => {
                        const newValue = e.target.value.replace(/^\$/, ''); // Remove $ if it's entered
                        setFourty(newValue);
                    }}
                />
            </Form.Group>
            <Form.Group controlId="sixtyRate">
                <Form.Label>60-minute walk</Form.Label>
                <Form.Control
                    type="text"
                    value={"$" + sixty}
                    onChange={(e) => {
                        const newValue = e.target.value.replace(/^\$/, ''); // Remove $ if it's entered
                        setSixty(newValue);
                    }}
                />
            </Form.Group>
            <Form.Group controlId="sixtyRate">
                <Form.Label>Solo-walk upcharge</Form.Label>
                <Form.Control
                    type="text"
                    value={"$" + solo}
                    onChange={(e) => {
                        const newValue = e.target.value.replace(/^\$/, ''); // Remove $ if it's entered
                        setSolo(newValue);
                    }}
                />
            </Form.Group>

            <Button style={{ marginTop: '10px' }} variant="primary" type="submit">Update Rates</Button>
        </Form>
    );
}
