import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function CreatePetSitModal({ onClose, onCreated, pet }) {
  const { user, addPetSit } = useContext(UserContext);
  const [formData, setFormData] = useState({
    pet_id: pet?.id || '',
    start_date: '',
    end_date: '',
    daily_rate: user?.pet_sitting_rate || 0,
    additional_charge: 0,
    description: ''
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'daily_rate' || name === 'additional_charge'
        ? parseInt(value) || 0
        : value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (!formData.pet_id) {
      toast.error('Please select a pet');
      return;
    }

    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select start and end dates');
      return;
    }

    if (dayjs(formData.end_date).isBefore(formData.start_date)) {
      toast.error('End date must be after start date');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch('/pet_sits', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const petSit = await response.json();
        addPetSit(petSit);
        toast.success('Pet sit created!');
        onCreated && onCreated(petSit);
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.errors?.[0] || 'Failed to create pet sit');
      }
    } catch (error) {
      toast.error('Network error');
    }
  }

  const days = formData.start_date && formData.end_date
    ? dayjs(formData.end_date).diff(formData.start_date, 'day') + 1
    : 0;

  const totalCost = (formData.daily_rate * days) + formData.additional_charge;

  return (
    <Overlay onClick={onClose}>
      <Modal onClick={e => e.stopPropagation()}>
        <Header>Create Pet Sit</Header>

        <Form onSubmit={handleSubmit}>
          {pet ? (
            <FormGroup>
              <Label>Pet</Label>
              <PetNameDisplay>{pet.name}</PetNameDisplay>
            </FormGroup>
          ) : (
            <FormGroup>
              <Label>Pet</Label>
              <Select
                name="pet_id"
                value={formData.pet_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a pet...</option>
                {user?.pets?.filter(p => p.active).map(pet => (
                  <option key={pet.id} value={pet.id}>{pet.name}</option>
                ))}
              </Select>
            </FormGroup>
          )}

          <DateRow>
            <FormGroup>
              <Label>Start Date</Label>
              <Input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
              />
            </FormGroup>

            <FormGroup>
              <Label>End Date</Label>
              <Input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
              />
            </FormGroup>
          </DateRow>

          {days > 0 && (
            <InfoText>{days} day{days !== 1 ? 's' : ''}</InfoText>
          )}

          <FormGroup>
            <Label>Daily Rate ($)</Label>
            <Input
              type="number"
              name="daily_rate"
              value={formData.daily_rate}
              onChange={handleChange}
              min="0"
              required
            />
          </FormGroup>

          <FormGroup>
            <Label>Additional Charge ($) - Optional</Label>
            <Input
              type="number"
              name="additional_charge"
              value={formData.additional_charge}
              onChange={handleChange}
              min="0"
            />
            <HelpText>
              Add upcharge for extra requirements (multiple visits/day, medication, etc.)
            </HelpText>
          </FormGroup>

          <FormGroup>
            <Label>Description / Instructions - Optional</Label>
            <TextArea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              placeholder="Feeding schedule, medication, special instructions, where to find supplies, etc."
            />
          </FormGroup>

          {days > 0 && (
            <TotalCost>
              <span>Total Cost:</span>
              <span>${totalCost.toLocaleString()}</span>
            </TotalCost>
          )}

          <ButtonRow>
            <CancelButton type="button" onClick={onClose}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit">
              Create Pet Sit
            </SubmitButton>
          </ButtonRow>
        </Form>
      </Modal>
    </Overlay>
  );
}

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const Modal = styled.div`
  background: linear-gradient(135deg, #2d1b3d 0%, #1a1a2e 100%);
  border-radius: 20px;
  padding: 32px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const Header = styled.h2`
  font-family: 'Poppins', sans-serif;
  font-size: 1.5rem;
  color: #ffffff;
  margin: 0 0 24px 0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const Input = styled.input`
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: #a569a7;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const Select = styled.select`
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;

  option {
    background: #2d1b3d;
    color: #ffffff;
  }

  &:focus {
    outline: none;
    border-color: #a569a7;
  }
`;

const PetNameDisplay = styled.div`
  padding: 12px;
  background: rgba(165, 105, 167, 0.2);
  border: 2px solid rgba(165, 105, 167, 0.4);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  font-family: inherit;
`;

const TextArea = styled.textarea`
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: #a569a7;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const DateRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const InfoText = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  font-style: italic;
  margin-top: -12px;
`;

const HelpText = styled.div`
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
`;

const TotalCost = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: rgba(165, 105, 167, 0.2);
  border-radius: 12px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 8px;
`;

const CancelButton = styled.button`
  flex: 1;
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const SubmitButton = styled.button`
  flex: 1;
  padding: 12px;
  background: linear-gradient(135deg, #a569a7, #8b5cf6);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(165, 105, 167, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;
