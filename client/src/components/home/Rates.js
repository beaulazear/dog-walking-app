import React, { useState } from "react";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

export default function Rates({ user, updateUserRates }) {
    const [thirty, setThirty] = useState(user.thirty || 22);
    const [fourty, setFourty] = useState(user.fourty || 28);
    const [sixty, setSixty] = useState(user.sixty || 33);

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
                    sixty
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
                <Form.Label>30-minute walk rate</Form.Label>
                <Form.Control
                    type="number"
                    value={thirty}
                    onChange={(e) => setThirty(e.target.value)}
                />
            </Form.Group>
            <Form.Group controlId="fourtyRate">
                <Form.Label>45-minute walk rate</Form.Label>
                <Form.Control
                    type="number"
                    value={fourty}
                    onChange={(e) => setFourty(e.target.value)}
                />
            </Form.Group>
            <Form.Group controlId="sixtyRate">
                <Form.Label>60-minute walk rate</Form.Label>
                <Form.Control
                    type="number"
                    value={sixty}
                    onChange={(e) => setSixty(e.target.value)}
                />
            </Form.Group>
            <Button variant="primary" type="submit">Update Rates</Button>
        </Form>
    );
}
