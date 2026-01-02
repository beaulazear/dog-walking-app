# Pet Sits Feature - Implementation Plan

**Created**: January 2, 2026
**Status**: Planning Phase
**Estimated Effort**: Medium (3-5 days)

---

## Table of Contents

1. [Overview](#overview)
2. [Feature Requirements](#feature-requirements)
3. [Database Design](#database-design)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Integration Points](#integration-points)
7. [Migration Strategy](#migration-strategy)
8. [Testing Plan](#testing-plan)
9. [Implementation Checklist](#implementation-checklist)

---

## Overview

### What is a Pet Sit?

A pet sit is a multi-day care service where the walker takes care of a pet over a date range (e.g., Nov 10-15). Unlike appointments which are time-based and potentially recurring by day-of-week, pet sits are:

- **Date-range based**: Start date → End date
- **Daily instances**: Shows up once per day in the range
- **Single-day completion**: Each day can be marked complete independently
- **Custom pricing**: Base rate + optional upcharge
- **Detailed instructions**: Description field for specific care instructions

### Key Differences from Appointments

| Feature | Appointments | Pet Sits |
|---------|-------------|----------|
| **Scheduling** | Time-based (9:00-9:30) | Date-based (Nov 10-15) |
| **Recurrence** | Day-of-week flags (Mon/Wed/Fri) | Consecutive date range |
| **Duration** | 30/45/60 minutes | All-day (implied) |
| **Pricing** | Duration + premiums | Base rate + upcharge |
| **Instructions** | Pet behavioral notes | Per-sit description |

---

## Feature Requirements

### User Stories

**As a walker, I want to:**

1. Create a pet sit for a specific date range
2. Add detailed instructions for each pet sit (what to do, where things are, special requirements)
3. Add an upcharge for sits requiring extra work (multiple visits/day, medication, etc.)
4. See pet sits on my "Today's Walks" page alongside regular appointments
5. Mark each day of a pet sit as complete
6. Generate an invoice for each completed day (or entire sit)
7. Set my base pet sitting rate in my profile
8. View upcoming and past pet sits
9. Edit or cancel pet sits
10. Share pet sits with team members (future enhancement)

**As the system, I need to:**

1. Store pet sit data separately from appointments
2. Expand date ranges into daily instances for display
3. Track completion status per day
4. Calculate pricing: base_rate + upcharge
5. Generate invoices for completed sit days
6. Display pet sits in daily views alongside appointments
7. Handle overlapping pet sits (validation)

---

## Database Design

### New Table: `pet_sits`

```ruby
create_table "pet_sits", force: :cascade do |t|
  t.bigint "user_id", null: false           # Walker who owns the sit
  t.bigint "pet_id", null: false            # Pet being cared for
  t.date "start_date", null: false          # First day of sit
  t.date "end_date", null: false            # Last day of sit
  t.integer "daily_rate", null: false       # Base rate per day
  t.integer "additional_charge", default: 0 # Upcharge/extras
  t.text "description"                      # Instructions/notes
  t.boolean "canceled", default: false      # Sit canceled?
  t.bigint "completed_by_user_id"           # If delegated to team member
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false

  # Indexes
  t.index ["user_id"], name: "index_pet_sits_on_user_id"
  t.index ["pet_id"], name: "index_pet_sits_on_pet_id"
  t.index ["start_date", "end_date"], name: "index_pet_sits_on_date_range"
  t.index ["completed_by_user_id"], name: "index_pet_sits_on_completed_by_user_id"
end

# Foreign keys
add_foreign_key "pet_sits", "users"
add_foreign_key "pet_sits", "pets"
add_foreign_key "pet_sits", "users", column: "completed_by_user_id"
```

**Field Explanations**:

- `start_date` / `end_date`: Date range for the sit (inclusive)
- `daily_rate`: Base rate per day (from user's `pet_sitting_rate`)
- `additional_charge`: Upcharge for extra requirements (meds, multiple visits, etc.)
- `description`: Detailed instructions (e.g., "Feed twice daily, medication at 8am, water plants")
- `completed_by_user_id`: For team delegation (future enhancement)
- `canceled`: Soft delete flag

### New Table: `pet_sit_completions`

Track which individual days have been completed (since a sit spans multiple days).

```ruby
create_table "pet_sit_completions", force: :cascade do |t|
  t.bigint "pet_sit_id", null: false        # Parent pet sit
  t.date "completion_date", null: false     # Which day was completed
  t.bigint "completed_by_user_id"           # Who completed it (for delegation)
  t.datetime "completed_at", null: false    # Timestamp of completion
  t.datetime "created_at", null: false
  t.datetime "updated_at", null: false

  # Indexes
  t.index ["pet_sit_id"], name: "index_pet_sit_completions_on_pet_sit_id"
  t.index ["pet_sit_id", "completion_date"], name: "index_completions_unique", unique: true
  t.index ["completion_date"], name: "index_pet_sit_completions_on_date"
end

# Foreign keys
add_foreign_key "pet_sit_completions", "pet_sits"
add_foreign_key "pet_sit_completions", "users", column: "completed_by_user_id"
```

**Purpose**:
- A pet sit from Nov 10-15 has 6 potential completion records (one per day)
- Each day can be marked complete independently
- Prevents double-completion (unique index on pet_sit_id + completion_date)

### Update: `users` Table

Add pet sitting rate to user pricing.

```ruby
add_column :users, :pet_sitting_rate, :integer
```

**Migration**:
```ruby
class AddPetSittingRateToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :pet_sitting_rate, :integer
  end
end
```

### Update: `invoices` Table

Link invoices to pet sits (in addition to appointments).

```ruby
add_column :invoices, :pet_sit_id, :bigint
add_index :invoices, :pet_sit_id
add_foreign_key :invoices, :pet_sits
```

**Changes**:
- `appointment_id` becomes optional (nil for pet sit invoices)
- `pet_sit_id` becomes optional (nil for appointment invoices)
- Validation: Must have either `appointment_id` OR `pet_sit_id` (not both, not neither)

---

## Backend Implementation

### 1. Migration Files

**File**: `db/migrate/XXXXXX_create_pet_sits.rb`

```ruby
class CreatePetSits < ActiveRecord::Migration[7.2]
  def change
    create_table :pet_sits do |t|
      t.references :user, null: false, foreign_key: true
      t.references :pet, null: false, foreign_key: true
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.integer :daily_rate, null: false
      t.integer :additional_charge, default: 0
      t.text :description
      t.boolean :canceled, default: false
      t.bigint :completed_by_user_id

      t.timestamps
    end

    add_index :pet_sits, [:start_date, :end_date]
    add_index :pet_sits, :completed_by_user_id
    add_foreign_key :pet_sits, :users, column: :completed_by_user_id
  end
end
```

**File**: `db/migrate/XXXXXX_create_pet_sit_completions.rb`

```ruby
class CreatePetSitCompletions < ActiveRecord::Migration[7.2]
  def change
    create_table :pet_sit_completions do |t|
      t.references :pet_sit, null: false, foreign_key: true
      t.date :completion_date, null: false
      t.bigint :completed_by_user_id
      t.datetime :completed_at, null: false

      t.timestamps
    end

    add_index :pet_sit_completions, [:pet_sit_id, :completion_date], unique: true, name: 'index_completions_unique'
    add_index :pet_sit_completions, :completion_date
    add_foreign_key :pet_sit_completions, :users, column: :completed_by_user_id
  end
end
```

**File**: `db/migrate/XXXXXX_add_pet_sitting_rate_to_users.rb`

```ruby
class AddPetSittingRateToUsers < ActiveRecord::Migration[7.2]
  def change
    add_column :users, :pet_sitting_rate, :integer
  end
end
```

**File**: `db/migrate/XXXXXX_add_pet_sit_to_invoices.rb`

```ruby
class AddPetSitToInvoices < ActiveRecord::Migration[7.2]
  def change
    add_reference :invoices, :pet_sit, foreign_key: true

    # Make appointment_id optional (was null: false before)
    change_column_null :invoices, :appointment_id, true
  end
end
```

---

### 2. Models

**File**: `app/models/pet_sit.rb`

```ruby
class PetSit < ApplicationRecord
  belongs_to :user
  belongs_to :pet
  belongs_to :completed_by_user, class_name: 'User', optional: true

  has_many :pet_sit_completions, dependent: :destroy
  has_many :invoices, dependent: :destroy

  validates :user_id, :pet_id, :start_date, :end_date, :daily_rate, presence: true
  validates :daily_rate, numericality: { greater_than: 0 }
  validates :additional_charge, numericality: { greater_than_or_equal_to: 0 }
  validate :end_date_after_start_date

  scope :active, -> { where(canceled: false) }
  scope :for_date, ->(date) { where('start_date <= ? AND end_date >= ?', date, date) }
  scope :upcoming, -> { where('start_date > ?', Date.today) }
  scope :current, -> { where('start_date <= ? AND end_date >= ?', Date.today, Date.today) }
  scope :past, -> { where('end_date < ?', Date.today) }

  # Check if a specific date is completed
  def completed_on?(date)
    pet_sit_completions.exists?(completion_date: date)
  end

  # Get all dates in the sit range
  def dates
    (start_date..end_date).to_a
  end

  # Get uncompleted dates
  def uncompleted_dates
    completed_dates = pet_sit_completions.pluck(:completion_date)
    dates.reject { |date| completed_dates.include?(date) }
  end

  # Check if entire sit is completed
  def fully_completed?
    dates.length == pet_sit_completions.count
  end

  # Total cost for entire sit
  def total_cost
    days = (end_date - start_date).to_i + 1
    (daily_rate * days) + additional_charge
  end

  # Cost per day (including prorated additional charge)
  def daily_cost
    days = (end_date - start_date).to_i + 1
    daily_rate + (additional_charge.to_f / days).round
  end

  private

  def end_date_after_start_date
    if end_date.present? && start_date.present? && end_date < start_date
      errors.add(:end_date, "must be after start date")
    end
  end
end
```

**File**: `app/models/pet_sit_completion.rb`

```ruby
class PetSitCompletion < ApplicationRecord
  belongs_to :pet_sit
  belongs_to :completed_by_user, class_name: 'User', optional: true

  validates :pet_sit_id, :completion_date, :completed_at, presence: true
  validates :completion_date, uniqueness: { scope: :pet_sit_id, message: "already completed for this sit" }
  validate :completion_date_within_sit_range

  # Automatically create invoice after completion
  after_create :create_invoice

  private

  def completion_date_within_sit_range
    if completion_date.present? && pet_sit.present?
      unless pet_sit.dates.include?(completion_date)
        errors.add(:completion_date, "must be within pet sit date range")
      end
    end
  end

  def create_invoice
    Invoice.create!(
      pet_sit_id: pet_sit.id,
      pet_id: pet_sit.pet_id,
      date_completed: completion_date,
      compensation: pet_sit.daily_cost,
      title: "Pet Sit - #{pet_sit.pet.name} (#{completion_date.strftime('%b %d, %Y')})",
      paid: false,
      pending: false,
      completed_by_user_id: completed_by_user_id
    )
  end
end
```

**File**: `app/models/user.rb` (Update)

```ruby
class User < ApplicationRecord
  # ... existing associations ...
  has_many :pet_sits, dependent: :destroy

  # ... existing code ...
end
```

**File**: `app/models/pet.rb` (Update)

```ruby
class Pet < ApplicationRecord
  # ... existing associations ...
  has_many :pet_sits, dependent: :destroy

  # ... existing code ...
end
```

**File**: `app/models/invoice.rb` (Update)

```ruby
class Invoice < ApplicationRecord
  belongs_to :appointment, optional: true  # Changed from required
  belongs_to :pet_sit, optional: true      # New association
  belongs_to :pet
  # ... other associations ...

  validates :pet_id, :date_completed, :compensation, presence: true
  validate :must_have_appointment_or_pet_sit

  # ... existing code ...

  private

  def must_have_appointment_or_pet_sit
    if appointment_id.blank? && pet_sit_id.blank?
      errors.add(:base, "Must have either appointment or pet sit")
    end

    if appointment_id.present? && pet_sit_id.present?
      errors.add(:base, "Cannot have both appointment and pet sit")
    end
  end
end
```

---

### 3. Controllers

**File**: `app/controllers/pet_sits_controller.rb`

```ruby
class PetSitsController < ApplicationController
  before_action :authorize
  before_action :set_pet_sit, only: [:show, :update, :destroy]

  # GET /pet_sits
  def index
    pet_sits = current_user.pet_sits.includes(:pet, :pet_sit_completions)
    render json: pet_sits
  end

  # GET /pet_sits/:id
  def show
    render json: @pet_sit
  end

  # GET /pet_sits/for_date?date=2026-01-15
  def for_date
    date = Date.parse(params[:date])
    pet_sits = current_user.pet_sits.active.for_date(date).includes(:pet, :pet_sit_completions)
    render json: pet_sits
  end

  # POST /pet_sits
  def create
    pet_sit = current_user.pet_sits.build(pet_sit_params)

    # Auto-set daily_rate from user's pet_sitting_rate if not provided
    pet_sit.daily_rate ||= current_user.pet_sitting_rate || 0

    if pet_sit.save
      render json: pet_sit, status: :created
    else
      render json: { errors: pet_sit.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # PATCH /pet_sits/:id
  def update
    if @pet_sit.update(pet_sit_params)
      render json: @pet_sit
    else
      render json: { errors: @pet_sit.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # DELETE /pet_sits/:id
  def destroy
    @pet_sit.destroy
    head :no_content
  end

  # POST /pet_sits/:id/complete_day
  # Body: { completion_date: '2026-01-15' }
  def complete_day
    pet_sit = current_user.pet_sits.find(params[:id])
    completion_date = Date.parse(params[:completion_date])

    completion = pet_sit.pet_sit_completions.build(
      completion_date: completion_date,
      completed_at: Time.current,
      completed_by_user_id: current_user.id
    )

    if completion.save
      # Invoice created automatically via callback
      invoice = Invoice.find_by(pet_sit_id: pet_sit.id, date_completed: completion_date)
      render json: { pet_sit: pet_sit, completion: completion, invoice: invoice }, status: :created
    else
      render json: { errors: completion.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /pet_sits/upcoming
  def upcoming
    pet_sits = current_user.pet_sits.active.upcoming.includes(:pet)
    render json: pet_sits
  end

  # GET /pet_sits/current
  def current
    pet_sits = current_user.pet_sits.active.current.includes(:pet)
    render json: pet_sits
  end

  private

  def set_pet_sit
    @pet_sit = current_user.pet_sits.find(params[:id])
  rescue ActiveRecord::RecordNotFound
    render json: { error: 'Pet sit not found' }, status: :not_found
  end

  def pet_sit_params
    params.permit(
      :pet_id,
      :start_date,
      :end_date,
      :daily_rate,
      :additional_charge,
      :description,
      :canceled
    )
  end
end
```

**File**: `app/controllers/users_controller.rb` (Update)

Add `pet_sitting_rate` to allowed params:

```ruby
def change_rates
  if current_user.update(rate_params)
    render json: current_user
  else
    render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
  end
end

private

def rate_params
  params.permit(:thirty, :fortyfive, :sixty, :solo_rate, :training_rate, :sibling_rate, :pet_sitting_rate)
end
```

---

### 4. Serializers

**File**: `app/serializers/pet_sit_serializer.rb`

```ruby
class PetSitSerializer < ActiveModel::Serializer
  attributes :id, :user_id, :pet_id, :start_date, :end_date,
             :daily_rate, :additional_charge, :description,
             :canceled, :completed_by_user_id,
             :total_cost, :daily_cost, :fully_completed,
             :created_at, :updated_at

  belongs_to :pet
  belongs_to :user
  belongs_to :completed_by_user, class_name: 'User'
  has_many :pet_sit_completions
  has_many :invoices

  def total_cost
    object.total_cost
  end

  def daily_cost
    object.daily_cost
  end

  def fully_completed
    object.fully_completed?
  end
end
```

**File**: `app/serializers/pet_sit_completion_serializer.rb`

```ruby
class PetSitCompletionSerializer < ActiveModel::Serializer
  attributes :id, :pet_sit_id, :completion_date, :completed_at,
             :completed_by_user_id, :created_at

  belongs_to :pet_sit
  belongs_to :completed_by_user, class_name: 'User'
end
```

**File**: `app/serializers/user_serializer.rb` (Update)

```ruby
class UserSerializer < ActiveModel::Serializer
  attributes :id, :username, :name, :email_address,
             :thirty, :fortyfive, :sixty,
             :solo_rate, :training_rate, :sibling_rate,
             :pet_sitting_rate  # Add this

  has_many :pets
  has_many :appointments
  has_many :pet_sits  # Add this
  has_many :invoices
  # ... other associations ...
end
```

**File**: `app/serializers/invoice_serializer.rb` (Update)

```ruby
class InvoiceSerializer < ActiveModel::Serializer
  attributes :id, :appointment_id, :pet_sit_id, :pet_id,  # Add pet_sit_id
             :date_completed, :compensation, :paid, :pending,
             :title, # ... other attributes

  belongs_to :appointment, optional: true
  belongs_to :pet_sit, optional: true  # Add this
  belongs_to :pet
  # ... other associations
end
```

---

### 5. Routes

**File**: `config/routes.rb` (Update)

```ruby
Rails.application.routes.draw do
  # ... existing routes ...

  # Pet Sits
  resources :pet_sits, only: [:index, :show, :create, :update, :destroy] do
    collection do
      get :for_date      # GET /pet_sits/for_date?date=2026-01-15
      get :upcoming      # GET /pet_sits/upcoming
      get :current       # GET /pet_sits/current
    end
    member do
      post :complete_day # POST /pet_sits/:id/complete_day
    end
  end

  # ... rest of routes ...
end
```

---

## Frontend Implementation

### 1. Update UserContext

**File**: `client/src/context/user.js` (Update)

```javascript
// Add pet_sits to user state
const [user, setUser] = useState({
  // ... existing fields ...
  pet_sitting_rate: null,
  pet_sits: []
});

// Add helper methods for pet sits
const addPetSit = useCallback((newPetSit) => {
  setUser(prevUser => {
    if (!prevUser) return prevUser;

    return {
      ...prevUser,
      pet_sits: [...(prevUser.pet_sits || []), newPetSit]
    };
  });
}, []);

const updatePetSit = useCallback((updatedPetSit) => {
  setUser(prevUser => {
    if (!prevUser) return prevUser;

    const updatedPetSits = prevUser.pet_sits.map(sit =>
      sit.id === updatedPetSit.id ? updatedPetSit : sit
    );

    return {
      ...prevUser,
      pet_sits: updatedPetSits
    };
  });
}, []);

const removePetSit = useCallback((petSitId) => {
  setUser(prevUser => {
    if (!prevUser) return prevUser;

    return {
      ...prevUser,
      pet_sits: prevUser.pet_sits.filter(sit => sit.id !== petSitId)
    };
  });
}, []);

// Update context value
const contextValue = useMemo(() => ({
  user,
  setUser,
  loading,
  // ... existing methods ...
  addPetSit,
  updatePetSit,
  removePetSit
}), [user, loading, /* ... other deps */, addPetSit, updatePetSit, removePetSit]);
```

---

### 2. New Component: CreatePetSitModal

**File**: `client/src/components/CreatePetSitModal.js`

```javascript
import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';

export default function CreatePetSitModal({ onClose, onCreated }) {
  const { user, addPetSit } = useContext(UserContext);
  const [formData, setFormData] = useState({
    pet_id: '',
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
      const response = await fetch('/pet_sits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

// Styled components...
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
`;

const Modal = styled.div`
  background: linear-gradient(135deg, #2d1b3d 0%, #1a1a2e 100%);
  border-radius: 20px;
  padding: 32px;
  max-width: 500px;
  width: 90%;
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

  &:focus {
    outline: none;
    border-color: #a569a7;
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

const TextArea = styled.textarea`
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: #ffffff;
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;

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
`;
```

---

### 3. Update TodaysWalks Component

**File**: `client/src/components/TodaysWalks.js` (Update)

Integrate pet sits alongside appointments in the daily view.

```javascript
import { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/user';
import dayjs from 'dayjs';
// ... other imports

export default function TodaysWalks() {
  const { user } = useContext(UserContext);
  const [selectedDate, setSelectedDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [appointments, setAppointments] = useState([]);
  const [petSits, setPetSits] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDailyData();
  }, [selectedDate]);

  async function fetchDailyData() {
    setLoading(true);

    try {
      // Fetch appointments
      const apptResponse = await fetch(`/appointments/for_date?date=${selectedDate}`);
      if (apptResponse.ok) {
        const apptData = await apptResponse.json();
        setAppointments(apptData);
      }

      // Fetch pet sits
      const sitResponse = await fetch(`/pet_sits/for_date?date=${selectedDate}`);
      if (sitResponse.ok) {
        const sitData = await sitResponse.json();
        setPetSits(sitData);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleCompletePetSit(petSit) {
    try {
      const response = await fetch(`/pet_sits/${petSit.id}/complete_day`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completion_date: selectedDate })
      });

      if (response.ok) {
        const { pet_sit, invoice } = await response.json();
        toast.success('Pet sit day completed!');

        // Update local state
        setPetSits(prev => prev.map(s => s.id === pet_sit.id ? pet_sit : s));

        // Add invoice to context
        addInvoice(invoice);
      } else {
        const data = await response.json();
        toast.error(data.errors?.[0] || 'Failed to complete pet sit');
      }
    } catch (error) {
      toast.error('Network error');
    }
  }

  return (
    <Container>
      <DateSelector
        selectedDate={selectedDate}
        onChange={setSelectedDate}
      />

      {/* Appointments Section */}
      <Section>
        <SectionHeader>Walks ({appointments.length})</SectionHeader>
        {appointments.map(apt => (
          <AppointmentCard key={apt.id} appointment={apt} />
        ))}
      </Section>

      {/* Pet Sits Section */}
      <Section>
        <SectionHeader>Pet Sits ({petSits.length})</SectionHeader>
        {petSits.map(sit => {
          const isCompletedToday = sit.pet_sit_completions?.some(
            c => c.completion_date === selectedDate
          );

          return (
            <PetSitCard key={sit.id}>
              <PetSitHeader>
                <PetName>{sit.pet.name}</PetName>
                {isCompletedToday && <CompletedBadge>✓ Completed</CompletedBadge>}
              </PetSitHeader>

              <DateRange>
                {dayjs(sit.start_date).format('MMM D')} - {dayjs(sit.end_date).format('MMM D, YYYY')}
              </DateRange>

              {sit.description && (
                <Description>{sit.description}</Description>
              )}

              <PriceRow>
                <span>Daily Rate:</span>
                <span>${sit.daily_rate}</span>
              </PriceRow>

              {sit.additional_charge > 0 && (
                <PriceRow>
                  <span>Additional Charge:</span>
                  <span>${sit.additional_charge}</span>
                </PriceRow>
              )}

              {!isCompletedToday && (
                <CompleteButton onClick={() => handleCompletePetSit(sit)}>
                  Complete Today
                </CompleteButton>
              )}
            </PetSitCard>
          );
        })}

        {petSits.length === 0 && (
          <EmptyState>No pet sits scheduled for this day</EmptyState>
        )}
      </Section>
    </Container>
  );
}

// Additional styled components for pet sits...
const PetSitCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
`;

const PetSitHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const PetName = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffffff;
`;

const CompletedBadge = styled.div`
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
`;

const DateRange = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 12px;
`;

const Description = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 12px;
  border-radius: 8px;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 12px;
  line-height: 1.5;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 4px;
`;

const CompleteButton = styled.button`
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #10b981, #06b6d4);
  border: none;
  border-radius: 8px;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  margin-top: 12px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }
`;
```

---

### 4. Update Profile Component (Add Pet Sitting Rate)

**File**: `client/src/components/Profile.js` (Update)

Add pet sitting rate input to the rates section.

```javascript
// In the rates form section:
<FormGroup>
  <Label>Pet Sitting Rate (per day)</Label>
  <Input
    type="number"
    name="pet_sitting_rate"
    value={rates.pet_sitting_rate || ''}
    onChange={handleRateChange}
    min="0"
  />
</FormGroup>
```

---

### 5. Create Pet Sits Management Page (Optional)

**File**: `client/src/components/PetSitsPage.js` (New)

Dedicated page for viewing/managing all pet sits.

```javascript
import React, { useState, useContext } from 'react';
import styled from 'styled-components';
import { UserContext } from '../context/user';
import CreatePetSitModal from './CreatePetSitModal';
import dayjs from 'dayjs';
import { Calendar } from 'lucide-react';

export default function PetSitsPage() {
  const { user } = useContext(UserContext);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState('current'); // current, upcoming, past, all

  const petSits = user?.pet_sits || [];

  const filteredSits = petSits.filter(sit => {
    if (sit.canceled) return false;

    const today = dayjs();
    const start = dayjs(sit.start_date);
    const end = dayjs(sit.end_date);

    switch (filter) {
      case 'current':
        return today.isBetween(start, end, 'day', '[]');
      case 'upcoming':
        return start.isAfter(today, 'day');
      case 'past':
        return end.isBefore(today, 'day');
      case 'all':
      default:
        return true;
    }
  });

  return (
    <Container>
      <Header>
        <Title>
          <Calendar size={24} />
          Pet Sits
        </Title>
        <CreateButton onClick={() => setShowCreateModal(true)}>
          + New Pet Sit
        </CreateButton>
      </Header>

      <FilterRow>
        <FilterButton
          $active={filter === 'current'}
          onClick={() => setFilter('current')}
        >
          Current
        </FilterButton>
        <FilterButton
          $active={filter === 'upcoming'}
          onClick={() => setFilter('upcoming')}
        >
          Upcoming
        </FilterButton>
        <FilterButton
          $active={filter === 'past'}
          onClick={() => setFilter('past')}
        >
          Past
        </FilterButton>
        <FilterButton
          $active={filter === 'all'}
          onClick={() => setFilter('all')}
        >
          All
        </FilterButton>
      </FilterRow>

      <SitsList>
        {filteredSits.map(sit => (
          <SitCard key={sit.id}>
            <SitHeader>
              <PetName>{sit.pet.name}</PetName>
              <TotalCost>${sit.total_cost.toLocaleString()}</TotalCost>
            </SitHeader>

            <DateRange>
              {dayjs(sit.start_date).format('MMM D')} - {dayjs(sit.end_date).format('MMM D, YYYY')}
              <span style={{ marginLeft: '8px', opacity: 0.6 }}>
                ({sit.pet_sit_completions?.length || 0} / {dayjs(sit.end_date).diff(sit.start_date, 'day') + 1} days completed)
              </span>
            </DateRange>

            {sit.description && (
              <Description>{sit.description}</Description>
            )}

            <Details>
              <Detail>
                <span>Daily Rate:</span>
                <span>${sit.daily_rate}</span>
              </Detail>
              {sit.additional_charge > 0 && (
                <Detail>
                  <span>Additional Charge:</span>
                  <span>${sit.additional_charge}</span>
                </Detail>
              )}
            </Details>

            {sit.fully_completed && (
              <CompletedBadge>✓ Fully Completed</CompletedBadge>
            )}
          </SitCard>
        ))}

        {filteredSits.length === 0 && (
          <EmptyState>
            No {filter !== 'all' && filter} pet sits found
          </EmptyState>
        )}
      </SitsList>

      {showCreateModal && (
        <CreatePetSitModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {}}
        />
      )}
    </Container>
  );
}

// Styled components... (similar to existing patterns)
```

---

## Integration Points

### 1. Today's View

- Display pet sits alongside appointments
- Show completion status for today
- Allow marking today as complete
- Generate invoice on completion

### 2. Invoice System

- Invoices can be linked to either appointments OR pet sits
- Invoice title includes pet sit info
- Earnings reports include both walks and sits
- Payment tracking works the same

### 3. Profile/Rates

- Add pet sitting rate input
- Display alongside walk rates
- Auto-populate when creating new pet sit

### 4. Navigation

Add "Pet Sits" to bottom nav (optional) or include in existing sections:
- Could add to TodaysWalks (combined view)
- Or create dedicated Pet Sits page

### 5. Dashboard

- Show current/upcoming pet sits count
- Include pet sit earnings in stats
- Display next pet sit date

---

## Migration Strategy

### Step 1: Database Migration

```bash
# Generate migrations
rails g migration CreatePetSits
rails g migration CreatePetSitCompletions
rails g migration AddPetSittingRateToUsers
rails g migration AddPetSitToInvoices

# Run migrations
rails db:migrate
```

### Step 2: Backend Implementation

1. Create models with validations
2. Create controllers with actions
3. Add routes
4. Create serializers
5. Update existing models (User, Pet, Invoice)

### Step 3: Backend Testing

```bash
# Test in Rails console
rails c

# Create test pet sit
user = User.first
pet = user.pets.first
sit = user.pet_sits.create!(
  pet: pet,
  start_date: Date.today,
  end_date: Date.today + 5,
  daily_rate: 75,
  additional_charge: 25,
  description: "Feed twice daily, medication at 8am"
)

# Complete a day
completion = sit.pet_sit_completions.create!(
  completion_date: Date.today,
  completed_at: Time.current
)

# Check invoice created
Invoice.last
```

### Step 4: Frontend Implementation

1. Update UserContext
2. Create CreatePetSitModal component
3. Update TodaysWalks component
4. Update Profile component
5. Test in browser

### Step 5: End-to-End Testing

1. Create pet sit via UI
2. View on today's page
3. Mark day as complete
4. Verify invoice created
5. Check earnings report includes sit

---

## Testing Plan

### Backend Tests (RSpec)

**File**: `spec/models/pet_sit_spec.rb`

```ruby
require 'rails_helper'

RSpec.describe PetSit, type: :model do
  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:pet) }
    it { should have_many(:pet_sit_completions) }
    it { should have_many(:invoices) }
  end

  describe 'validations' do
    it { should validate_presence_of(:user_id) }
    it { should validate_presence_of(:pet_id) }
    it { should validate_presence_of(:start_date) }
    it { should validate_presence_of(:end_date) }
    it { should validate_presence_of(:daily_rate) }

    it 'validates end_date is after start_date' do
      sit = build(:pet_sit, start_date: Date.today, end_date: Date.yesterday)
      expect(sit).not_to be_valid
      expect(sit.errors[:end_date]).to include('must be after start date')
    end
  end

  describe '#dates' do
    it 'returns array of all dates in range' do
      sit = create(:pet_sit, start_date: Date.new(2026, 1, 10), end_date: Date.new(2026, 1, 12))
      expect(sit.dates).to eq([
        Date.new(2026, 1, 10),
        Date.new(2026, 1, 11),
        Date.new(2026, 1, 12)
      ])
    end
  end

  describe '#completed_on?' do
    it 'returns true if date has completion' do
      sit = create(:pet_sit)
      completion = create(:pet_sit_completion, pet_sit: sit, completion_date: Date.today)
      expect(sit.completed_on?(Date.today)).to be true
    end

    it 'returns false if date has no completion' do
      sit = create(:pet_sit)
      expect(sit.completed_on?(Date.today)).to be false
    end
  end

  describe '#total_cost' do
    it 'calculates total cost correctly' do
      sit = create(:pet_sit,
        start_date: Date.today,
        end_date: Date.today + 4, # 5 days
        daily_rate: 50,
        additional_charge: 25
      )
      expect(sit.total_cost).to eq(275) # (50 * 5) + 25
    end
  end
end
```

**File**: `spec/requests/pet_sits_spec.rb`

```ruby
require 'rails_helper'

RSpec.describe 'PetSits API', type: :request do
  let(:user) { create(:user) }
  let(:pet) { create(:pet, user: user) }
  let(:headers) { { 'Authorization' => "Bearer #{generate_token(user)}" } }

  describe 'POST /pet_sits' do
    it 'creates a new pet sit' do
      params = {
        pet_id: pet.id,
        start_date: Date.today,
        end_date: Date.today + 5,
        daily_rate: 75,
        additional_charge: 25,
        description: 'Test description'
      }

      post '/pet_sits', params: params, headers: headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)
      expect(json['daily_rate']).to eq(75)
      expect(json['pet_id']).to eq(pet.id)
    end
  end

  describe 'POST /pet_sits/:id/complete_day' do
    let(:pet_sit) { create(:pet_sit, user: user, pet: pet) }

    it 'creates completion and invoice' do
      post "/pet_sits/#{pet_sit.id}/complete_day",
           params: { completion_date: Date.today },
           headers: headers

      expect(response).to have_http_status(:created)
      json = JSON.parse(response.body)

      expect(json['completion']).to be_present
      expect(json['invoice']).to be_present
      expect(json['invoice']['pet_sit_id']).to eq(pet_sit.id)
    end
  end
end
```

### Frontend Tests (Jest)

**File**: `client/src/components/__tests__/CreatePetSitModal.test.js`

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreatePetSitModal from '../CreatePetSitModal';
import { UserContext } from '../../context/user';

const mockUser = {
  id: 1,
  pet_sitting_rate: 75,
  pets: [
    { id: 1, name: 'Buddy', active: true },
    { id: 2, name: 'Max', active: true }
  ]
};

describe('CreatePetSitModal', () => {
  it('renders form fields', () => {
    render(
      <UserContext.Provider value={{ user: mockUser }}>
        <CreatePetSitModal onClose={() => {}} />
      </UserContext.Provider>
    );

    expect(screen.getByLabelText(/pet/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/daily rate/i)).toBeInTheDocument();
  });

  it('calculates total cost correctly', () => {
    render(
      <UserContext.Provider value={{ user: mockUser }}>
        <CreatePetSitModal onClose={() => {}} />
      </UserContext.Provider>
    );

    const dailyRateInput = screen.getByLabelText(/daily rate/i);
    const additionalChargeInput = screen.getByLabelText(/additional charge/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const endDateInput = screen.getByLabelText(/end date/i);

    fireEvent.change(startDateInput, { target: { value: '2026-01-10' } });
    fireEvent.change(endDateInput, { target: { value: '2026-01-15' } }); // 6 days
    fireEvent.change(dailyRateInput, { target: { value: '50' } });
    fireEvent.change(additionalChargeInput, { target: { value: '25' } });

    expect(screen.getByText(/total cost:/i)).toBeInTheDocument();
    expect(screen.getByText(/\$325/i)).toBeInTheDocument(); // (50 * 6) + 25
  });
});
```

---

## Implementation Checklist

### Phase 1: Database & Backend Core (Day 1)

- [ ] Create migrations
  - [ ] `pet_sits` table
  - [ ] `pet_sit_completions` table
  - [ ] Add `pet_sitting_rate` to users
  - [ ] Add `pet_sit_id` to invoices
- [ ] Run migrations
- [ ] Create models
  - [ ] `PetSit` model with validations
  - [ ] `PetSitCompletion` model with validations
  - [ ] Update `User` model
  - [ ] Update `Pet` model
  - [ ] Update `Invoice` model (make appointment_id optional, add validation)
- [ ] Test models in Rails console

### Phase 2: Backend API (Day 2)

- [ ] Create `PetSitsController`
  - [ ] index, show, create, update, destroy
  - [ ] for_date, upcoming, current
  - [ ] complete_day
- [ ] Create serializers
  - [ ] `PetSitSerializer`
  - [ ] `PetSitCompletionSerializer`
  - [ ] Update `UserSerializer`
  - [ ] Update `InvoiceSerializer`
- [ ] Add routes
- [ ] Test API endpoints with Postman/curl
- [ ] Write RSpec tests

### Phase 3: Frontend Core (Day 3)

- [ ] Update UserContext
  - [ ] Add `pet_sits` to state
  - [ ] Add `addPetSit`, `updatePetSit`, `removePetSit` methods
- [ ] Create `CreatePetSitModal` component
- [ ] Test modal in isolation

### Phase 4: Frontend Integration (Day 4)

- [ ] Update `TodaysWalks` component
  - [ ] Fetch pet sits for date
  - [ ] Display pet sits alongside appointments
  - [ ] Handle completion
- [ ] Update `Profile` component
  - [ ] Add pet sitting rate input
  - [ ] Update rate change handler
- [ ] Create `PetSitsPage` component (optional dedicated page)

### Phase 5: Testing & Polish (Day 5)

- [ ] End-to-end testing
  - [ ] Create pet sit
  - [ ] View on today's page
  - [ ] Mark days as complete
  - [ ] Verify invoices created
  - [ ] Check earnings reports
- [ ] Frontend tests (Jest)
- [ ] Backend tests (RSpec)
- [ ] UI polish and styling
- [ ] Error handling edge cases
- [ ] Documentation updates

### Phase 6: Optional Enhancements (Future)

- [ ] Team sharing for pet sits
- [ ] Recurring pet sits (e.g., every weekend)
- [ ] Pet sit templates
- [ ] Calendar view of pet sits
- [ ] Notifications/reminders
- [ ] Client portal for pet sit booking

---

## Edge Cases & Considerations

### 1. Overlapping Pet Sits

**Problem**: User creates overlapping pet sits for same pet.

**Solution**: Add validation to prevent overlaps (optional).

```ruby
# In PetSit model
validate :no_overlapping_sits

def no_overlapping_sits
  overlaps = user.pet_sits
    .where(pet_id: pet_id)
    .where.not(id: id)
    .where('start_date <= ? AND end_date >= ?', end_date, start_date)

  if overlaps.exists?
    errors.add(:base, "Pet sit dates overlap with existing sit")
  end
end
```

### 2. Completing Future Dates

**Problem**: User tries to complete a pet sit day in the future.

**Solution**: Add validation in PetSitCompletion.

```ruby
validate :completion_date_not_future

def completion_date_not_future
  if completion_date.present? && completion_date > Date.today
    errors.add(:completion_date, "cannot be in the future")
  end
end
```

### 3. Deleting Pet Sit with Completions

**Problem**: What happens to completions and invoices?

**Solution**: Cascade delete with warning.

```ruby
# In PetSit model
has_many :pet_sit_completions, dependent: :destroy
has_many :invoices, dependent: :nullify  # Or :destroy if you want to delete invoices
```

Show warning in UI before deletion if completions exist.

### 4. Editing Date Range After Completions

**Problem**: User edits date range, but some days already completed outside new range.

**Solution**: Prevent editing dates if completions exist.

```ruby
validate :cannot_change_dates_with_completions

def cannot_change_dates_with_completions
  if persisted? && pet_sit_completions.any?
    if start_date_changed? || end_date_changed?
      errors.add(:base, "Cannot change dates after days have been completed")
    end
  end
end
```

### 5. Daily Rate Changes

**Problem**: User updates daily_rate after some days completed.

**Solution**:
- Option A: Freeze rate after first completion
- Option B: Allow change but recalculate only future invoices
- Recommended: Option A (freeze after completion)

```ruby
validate :cannot_change_rate_with_completions

def cannot_change_rate_with_completions
  if persisted? && pet_sit_completions.any? && daily_rate_changed?
    errors.add(:daily_rate, "Cannot change rate after days have been completed")
  end
end
```

---

## Success Metrics

### Functionality

- [ ] Can create pet sit with all required fields
- [ ] Pet sits display on today's page correctly
- [ ] Can mark individual days as complete
- [ ] Invoices generated correctly on completion
- [ ] Total cost calculated accurately
- [ ] Date range expansion works correctly
- [ ] Can edit/delete pet sits (with proper validations)
- [ ] Earnings reports include pet sit income

### User Experience

- [ ] Intuitive form for creating pet sits
- [ ] Clear display of multi-day sits
- [ ] Easy to see what's completed vs pending
- [ ] Instructions/description easily accessible
- [ ] Mobile responsive
- [ ] Fast performance (no lag)

### Data Integrity

- [ ] No orphaned records
- [ ] Proper foreign key constraints
- [ ] Validation prevents invalid data
- [ ] Completion uniqueness enforced
- [ ] Invoice linking works both ways (appointment OR pet_sit)

---

## Conclusion

This implementation plan provides a comprehensive roadmap for adding Pet Sits functionality to the dog walking application. The feature integrates seamlessly with existing systems (appointments, invoices, earnings) while maintaining clear separation of concerns.

**Key Benefits**:
- Extends app capabilities to cover full service offering
- Maintains consistency with existing patterns
- Provides flexibility (upcharges, descriptions)
- Preserves data integrity with proper validations
- Enables future enhancements (team sharing, recurring sits)

**Estimated Timeline**: 3-5 days for full implementation and testing.

**Next Steps**: Review plan, make adjustments, then proceed with Phase 1 (Database & Backend Core).

---

**Plan Created**: January 2, 2026
**Created By**: Claude (Anthropic AI Assistant)
**Ready for Implementation**: Yes ✓
