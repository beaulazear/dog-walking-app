import React, { useState } from "react";
import styled from "styled-components";

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f5f5f5;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  margin: auto;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const FormLabel = styled.label`
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
`;

const FormControl = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
  font-size: 16px;
  &:focus {
    outline: none;
    border-color: #007bff;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 20px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
  &:hover {
    background-color: #0056b3;
  }
`;

export default function Rates({ user, updateUserRates }) {
    const [thirty, setThirty] = useState(user.thirty || 22);
    const [fourty, setFourty] = useState(user.fourty || 28);
    const [sixty, setSixty] = useState(user.sixty || 33);
    const [solo, setSolo] = useState(user.solo_rate || 0);

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("/change_rates", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    thirty,
                    fourty,
                    sixty,
                    solo_rate: solo,
                }),
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
            <FormGroup>
                <FormLabel htmlFor="thirtyRate">30-minute walk</FormLabel>
                <FormControl
                    type="text"
                    id="thirtyRate"
                    value={"$" + thirty}
                    onChange={(e) => {
                        const newValue = e.target.value.replace(/^\$/, ""); // Remove $ if it's entered
                        setThirty(newValue);
                    }}
                />
            </FormGroup>
            <FormGroup>
                <FormLabel htmlFor="fourtyRate">45-minute walk</FormLabel>
                <FormControl
                    type="text"
                    id="fourtyRate"
                    value={"$" + fourty}
                    onChange={(e) => {
                        const newValue = e.target.value.replace(/^\$/, ""); // Remove $ if it's entered
                        setFourty(newValue);
                    }}
                />
            </FormGroup>
            <FormGroup>
                <FormLabel htmlFor="sixtyRate">60-minute walk</FormLabel>
                <FormControl
                    type="text"
                    id="sixtyRate"
                    value={"$" + sixty}
                    onChange={(e) => {
                        const newValue = e.target.value.replace(/^\$/, ""); // Remove $ if it's entered
                        setSixty(newValue);
                    }}
                />
            </FormGroup>
            <FormGroup>
                <FormLabel htmlFor="soloRate">Solo-walk upcharge</FormLabel>
                <FormControl
                    type="text"
                    id="soloRate"
                    value={"$" + solo}
                    onChange={(e) => {
                        const newValue = e.target.value.replace(/^\$/, ""); // Remove $ if it's entered
                        setSolo(newValue);
                    }}
                />
            </FormGroup>
            <SubmitButton type="submit">Update Rates</SubmitButton>
        </Form>
    );
}
