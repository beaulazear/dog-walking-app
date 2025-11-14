# Comprehensive Implementation Plan: Collaborative Appointment Sharing with Income Splits

**Last Updated:** 2025-11-11
**Status:** Planning Phase - Ready for Implementation

---

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Phase 1: Database Schema Changes](#phase-1-database-schema-changes)
3. [Phase 2: Backend Model Changes](#phase-2-backend-model-changes)
4. [Phase 3: Backend Routes & Controllers](#phase-3-backend-routes--controllers)
5. [Phase 4: Frontend Component Changes](#phase-4-frontend-component-changes)
6. [Phase 5: Testing & Validation](#phase-5-testing--validation)
7. [Phase 6: Cleanup & Documentation](#phase-6-cleanup--documentation)
8. [Implementation Order](#implementation-order)
9. [Gotchas & Considerations](#gotchas--considerations)
10. [Success Metrics](#success-metrics)

---

## 📋 System Overview

### Current State
- Share button only in TodaysWalks component
- Full delegation model (appointment transfers to recipient)
- No income splitting mechanism
- No per-date sharing for recurring appointments
- `delegation_status = "delegated"` implies full transfer

### Target State
- Share button on Pets page appointments tab
- Both walkers see shared walks (with different badges)
- Only covering walker can mark complete
- Income split negotiated and agreed before acceptance
- Select specific dates for recurring appointment shares
- Shared dates displayed alongside cancellations
- Route optimization excludes walks you've shared out

### User Requirements
1. **Share from Pets Page:** Add share button on each appointment in the appointments tab
2. **Recurring Appointments:** Select specific dates to share (similar to cancellation UI), with shared dates visible alongside cancellations
3. **Dual Visibility:** Both walkers see the walk on their TodaysWalks page
4. **Completion Rights:** Only the walker who accepted the share can mark it complete
5. **Income Split Negotiation:**
   - Sharer proposes split when sharing
   - Both parties confirm the split
   - Invoice automatically divides payment when walk is completed

---

## 🗄️ Phase 1: Database Schema Changes

### 1.1 Add Share-Specific Dates Table

**Create migration:** `db/migrate/XXXXXX_create_share_dates.rb`

```ruby
class CreateShareDates < ActiveRecord::Migration[7.0]
  def change
    create_table :share_dates do |t|
      t.references :appointment_share, null: false, foreign_key: true
      t.date :date, null: false
      t.timestamps
    end

    add_index :share_dates, [:appointment_share_id, :date], unique: true
  end
end
```

**Purpose:** Track specific dates that are shared for recurring appointments (similar to cancellations table)

**Key Points:**
- Each share can have multiple dates
- Unique constraint prevents duplicate date entries per share
- Similar pattern to existing `cancellations` table

### 1.2 Modify Appointment Shares Table

**Create migration:** `db/migrate/XXXXXX_add_income_split_to_appointment_shares.rb`

```ruby
class AddIncomeSplitToAppointmentShares < ActiveRecord::Migration[7.0]
  def change
    add_column :appointment_shares, :covering_walker_percentage, :integer
    # Store as integer (0-100) representing percentage covering walker receives

    add_column :appointment_shares, :proposed_by, :string
    # 'shared_by' or 'shared_with' - tracks who proposed current split (for future negotiation features)
  end
end
```

**Key Points:**
- `covering_walker_percentage` stores the % that the covering walker receives (0-100)
- Original walker gets remaining percentage (100 - covering_walker_percentage)
- `proposed_by` enables future negotiation features

### 1.3 Update Appointments Table (Optional)

**Consider adding:** A computed column or method to easily identify covering walker
- Current `delegation_status` can remain but change semantics
- When share is accepted, set to 'shared' instead of 'delegated'
- This distinguishes between old delegation system and new collaborative sharing

---

## 🔧 Phase 2: Backend Model Changes

### 2.1 Create ShareDate Model

**File:** `app/models/share_date.rb`

```ruby
class ShareDate < ApplicationRecord
  belongs_to :appointment_share

  validates :date, presence: true
  validates :date, uniqueness: { scope: :appointment_share_id }
  validate :date_must_be_future
  validate :date_must_match_appointment_schedule

  private

  def date_must_be_future
    if date.present? && date <= Date.today
      errors.add(:date, "must be in the future")
    end
  end

  def date_must_match_appointment_schedule
    return unless date.present? && appointment_share&.appointment

    appointment = appointment_share.appointment
    return unless appointment.recurring

    day_name = date.strftime("%A").downcase
    unless appointment.send(day_name)
      errors.add(:date, "doesn't match appointment schedule")
    end
  end
end
```

**Key Points:**
- Validates dates are in the future (like cancellations)
- For recurring appointments, validates date matches schedule (e.g., can't share a Monday if appointment is only Wed/Fri)
- Unique constraint per share

### 2.2 Update AppointmentShare Model

**File:** `app/models/appointment_share.rb`

Add associations and validations:

```ruby
class AppointmentShare < ApplicationRecord
  # Existing associations
  belongs_to :appointment
  belongs_to :shared_by_user, class_name: 'User'
  belongs_to :shared_with_user, class_name: 'User'

  # NEW: Add share_dates association
  has_many :share_dates, dependent: :destroy

  # NEW: Validate income split
  validates :covering_walker_percentage, presence: true,
            numericality: { only_integer: true, greater_than_or_equal_to: 0, less_than_or_equal_to: 100 }

  # NEW: Scope for accepted shares
  scope :accepted, -> { where(status: 'accepted') }

  # NEW: Method to check if a specific date is shared
  def covers_date?(date)
    return true unless appointment.recurring # One-time appointments are fully shared
    share_dates.exists?(date: date)
  end

  # NEW: Update accept! method to handle delegation_status
  def accept!
    transaction do
      update!(status: 'accepted')
      appointment.update!(delegation_status: 'shared')
    end
  end

  # NEW: Helper to calculate split amounts
  def calculate_split(total_price)
    covering_amount = (total_price * covering_walker_percentage / 100.0).round
    original_amount = total_price - covering_amount
    { covering: covering_amount, original: original_amount }
  end
end
```

**Key Points:**
- `covers_date?` method checks if share applies to a specific date
- For one-time appointments, all dates are covered
- For recurring, only specific share_dates are covered
- `calculate_split` handles rounding (covering walker gets rounded amount)

### 2.3 Update Appointment Model

**File:** `app/models/appointment.rb`

Add methods to identify covering walker and check coverage:

```ruby
class Appointment < ApplicationRecord
  # Existing associations
  has_many :appointment_shares, dependent: :destroy
  has_many :cancellations, dependent: :destroy
  has_many :share_dates, through: :appointment_shares

  # NEW: Get the covering walker for this appointment on a specific date
  def covering_walker_on(date)
    accepted_share = appointment_shares.accepted.find do |share|
      share.covers_date?(date)
    end
    accepted_share&.shared_with_user
  end

  # NEW: Check if appointment is shared out on a specific date
  def shared_out_on?(date, for_user:)
    return false unless user_id == for_user.id
    covering_walker_on(date).present?
  end

  # NEW: Check if user is covering this appointment on a specific date
  def covered_by?(user, on_date:)
    accepted_share = appointment_shares.accepted.find do |share|
      share.shared_with_user_id == user.id && share.covers_date?(on_date)
    end
    accepted_share.present?
  end

  # NEW: Scope for accepted shares
  scope :with_accepted_shares, -> { includes(appointment_shares: :share_dates) }
end
```

**Key Points:**
- `covering_walker_on(date)` returns the User who's covering on a specific date
- `shared_out_on?(date, for_user:)` checks if original owner shared this date out
- `covered_by?(user, on_date:)` checks if a user is covering on a specific date
- All methods are date-aware for recurring appointment support

---

## 🛣️ Phase 3: Backend Routes & Controllers

### 3.1 Update Routes

**File:** `config/routes.rb`

```ruby
resources :appointment_shares do
  collection do
    get :my_shared_appointments
  end
  member do
    patch :accept
    patch :decline
  end
  # NEW: Nested resource for share dates
  resources :share_dates, only: [:create, :destroy]
end

# NEW: Add endpoint to get covering walker info
resources :appointments do
  member do
    get :covering_info # Returns who's covering on what dates
  end
end
```

### 3.2 Update AppointmentSharesController

**File:** `app/controllers/appointment_shares_controller.rb`

Modify `create` action to handle dates and income split:

```ruby
def create
  @appointment_shares = []
  errors = []

  share_params[:appointment_ids].each do |appointment_id|
    appointment = current_user.appointments.find(appointment_id)

    share = AppointmentShare.new(
      appointment: appointment,
      shared_by_user: current_user,
      shared_with_user_id: share_params[:shared_with_user_id],
      covering_walker_percentage: share_params[:covering_walker_percentage],
      status: 'pending',
      recurring_share: appointment.recurring && share_params[:share_dates].present?
    )

    if share.save
      # Create share_dates if provided
      if share_params[:share_dates].present?
        share_params[:share_dates].each do |date_str|
          share.share_dates.create!(date: Date.parse(date_str))
        end
      end
      @appointment_shares << share
    else
      errors << { appointment_id: appointment_id, errors: share.errors.full_messages }
    end
  end

  if errors.empty?
    render json: @appointment_shares.map { |s| format_share(s) }, status: :created
  else
    render json: { errors: errors }, status: :unprocessable_entity
  end
end

private

def share_params
  params.require(:appointment_share).permit(
    :shared_with_user_id,
    :covering_walker_percentage,
    appointment_ids: [],
    share_dates: []
  )
end

def format_share(share)
  {
    id: share.id,
    appointment: format_appointment(share.appointment),
    shared_by: format_user(share.shared_by_user),
    shared_with: format_user(share.shared_with_user),
    status: share.status,
    covering_walker_percentage: share.covering_walker_percentage,
    original_walker_percentage: 100 - share.covering_walker_percentage,
    share_dates: share.share_dates.pluck(:date),
    created_at: share.created_at
  }
end
```

**Key Points:**
- Accepts `covering_walker_percentage` in request
- Creates `share_dates` records if dates provided
- Returns both percentages for clarity
- Handles multiple appointments (existing feature)

### 3.3 Update AppointmentsController

**File:** `app/controllers/appointments_controller.rb`

Modify index action to include both owned and covering appointments:

```ruby
def index
  date = params[:date] ? Date.parse(params[:date]) : Date.today

  # Appointments owned by current user
  owned_appointments = current_user.appointments
    .where(completed: false, canceled: false)
    .includes(:pet, :user, :cancellations, appointment_shares: [:shared_with_user, :share_dates])

  # Appointments where current user is covering (accepted shares)
  covering_shares = AppointmentShare
    .accepted
    .where(shared_with_user: current_user)
    .includes(:appointment, :share_dates, shared_by_user: :profile)

  # Format both types
  owned_data = owned_appointments.map do |apt|
    covering_walker = apt.covering_walker_on(date)
    format_appointment(apt, date: date, covering_walker: covering_walker)
  end

  covering_data = covering_shares.map do |share|
    next unless share.covers_date?(date)
    format_covered_appointment(share.appointment, share, date)
  end.compact

  render json: {
    owned: owned_data,
    covering: covering_data
  }
end

private

def format_appointment(apt, date:, covering_walker: nil)
  {
    id: apt.id,
    # ... existing fields ...
    is_shared_out: covering_walker.present?,
    covered_by: covering_walker ? format_user(covering_walker) : nil,
    can_complete: covering_walker.nil?, # Can only complete if not shared out
  }
end

def format_covered_appointment(apt, share, date)
  {
    id: apt.id,
    # ... existing fields ...
    is_covering: true,
    original_owner: format_user(share.shared_by_user),
    my_percentage: share.covering_walker_percentage,
    can_complete: true # Covering walker CAN complete
  }
end
```

**Key Points:**
- Returns TWO arrays: `owned` and `covering`
- `owned` includes all appointments owned by user, with `is_shared_out` flag
- `covering` includes appointments user is covering via accepted shares
- Date-aware filtering for recurring appointments

### 3.4 Update Completion Logic

Modify the appointment completion endpoint to validate covering walker:

```ruby
def complete
  @appointment = Appointment.find(params[:id])
  date = params[:date] ? Date.parse(params[:date]) : Date.today

  # Check if user has permission to complete
  can_complete = false

  if @appointment.user_id == current_user.id
    # Original owner can complete if NOT shared out on this date
    can_complete = !@appointment.shared_out_on?(date, for_user: current_user)
  else
    # Covering walker can complete if they're assigned to this date
    can_complete = @appointment.covered_by?(current_user, on_date: date)
  end

  unless can_complete
    render json: { error: "You cannot complete this appointment" }, status: :forbidden
    return
  end

  if @appointment.update(completed: true)
    # Create invoice with split if applicable
    create_invoice_with_split(@appointment, current_user, date)
    render json: { message: "Appointment completed" }
  else
    render json: { errors: @appointment.errors.full_messages }, status: :unprocessable_entity
  end
end

private

def create_invoice_with_split(appointment, completing_user, date)
  share = appointment.appointment_shares.accepted.find do |s|
    s.covers_date?(date)
  end

  if share
    # Split income
    split = share.calculate_split(appointment.price)

    # Create invoice for covering walker
    Invoice.create!(
      appointment: appointment,
      user: share.shared_with_user,
      completed_by_user: completing_user,
      compensation: split[:covering],
      is_shared: true,
      split_percentage: share.covering_walker_percentage
    )

    # Create invoice for original owner
    Invoice.create!(
      appointment: appointment,
      user: share.shared_by_user,
      completed_by_user: completing_user,
      compensation: split[:original],
      is_shared: true,
      split_percentage: 100 - share.covering_walker_percentage
    )
  else
    # Standard invoice for non-shared appointment
    Invoice.create!(
      appointment: appointment,
      user: appointment.user,
      completed_by_user: completing_user,
      compensation: appointment.price
    )
  end
end
```

**Key Points:**
- Validates user has permission to complete on specific date
- Creates TWO invoices for shared appointments (one for each walker)
- Uses existing `is_shared` and `split_percentage` fields on invoices table
- Handles both shared and non-shared scenarios

---

## 🎨 Phase 4: Frontend Component Changes

### 4.1 Add Share Button to Pets Page

**File:** `client/src/components/PetsPage.js`

In the appointments tab section (around line 1000), add share button to AppointmentCard:

```jsx
// Inside the AppointmentCard component
<div className="flex items-center gap-2 mt-3">
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleEditAppointment(appointment);
    }}
    className="flex-1 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-sm"
  >
    Edit
  </button>

  {/* NEW: Share button */}
  <button
    onClick={(e) => {
      e.stopPropagation();
      handleShareAppointment(appointment);
    }}
    className="flex-1 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg text-sm flex items-center justify-center gap-2"
  >
    <Share2 size={16} />
    Share
  </button>

  <button
    onClick={(e) => {
      e.stopPropagation();
      handleDeleteAppointment(appointment.id);
    }}
    className="px-3 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg text-sm"
  >
    Delete
  </button>
</div>
```

Add state and handler:

```jsx
const [showShareModal, setShowShareModal] = useState(false);
const [appointmentToShare, setAppointmentToShare] = useState(null);

const handleShareAppointment = (appointment) => {
  setAppointmentToShare(appointment);
  setShowShareModal(true);
};
```

Render modal at bottom of component:

```jsx
{showShareModal && (
  <ShareAppointmentModal
    isOpen={showShareModal}
    onClose={() => {
      setShowShareModal(false);
      setAppointmentToShare(null);
    }}
    appointment={appointmentToShare}
    onShareSuccess={() => {
      setShowShareModal(false);
      // Optionally refresh appointments
    }}
  />
)}
```

### 4.2 Create Enhanced ShareAppointmentModal

**File:** `client/src/components/ShareAppointmentModal.js`

Complete rewrite to support date selection and income split. Key features:

**Core Functionality:**
- Team member selection (fetch from `/walker_connections?status=accepted`)
- Income split slider (0-100%, default 60% to covering walker)
- Three date selection modes for recurring appointments:
  - **Single Date:** Simple date picker
  - **Date Range:** Start/end dates, auto-generate matching days
  - **Multi-Select:** Visual grid of next 30 matching dates

**UI Components:**
- Appointment summary section
- Team member cards (selectable)
- Income split slider with live preview
- Mode toggle (Calendar / CalendarRange / CheckSquare icons)
- Date selection interface (changes based on mode)
- Selected dates summary
- Submit/Cancel buttons

**Key Code Sections:**

```jsx
// State management
const [selectedMember, setSelectedMember] = useState(null);
const [coveringPercentage, setCoveringPercentage] = useState(60);
const [dateSelectionMode, setDateSelectionMode] = useState('single');
const [selectedDates, setSelectedDates] = useState([]);

// Calculate split amounts
const calculateSplit = () => {
  const total = appointment.price || 0;
  const coveringAmount = Math.round(total * coveringPercentage / 100);
  return {
    covering: coveringAmount,
    original: total - coveringAmount
  };
};

// Submit handler
const handleShare = async () => {
  const response = await fetch('/appointment_shares', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      appointment_share: {
        appointment_ids: [appointment.id],
        shared_with_user_id: selectedMember.id,
        covering_walker_percentage: coveringPercentage,
        share_dates: appointment.recurring ? selectedDates : []
      }
    })
  });
  // Handle response...
};
```

**Visual Design:**
- Purple gradient modal background (matches existing theme)
- Portal-based rendering (overlay entire screen)
- Blur backdrop effect
- Smooth animations
- Mobile-responsive layout
- Accessible (keyboard navigation, focus management)

See full implementation in code section (too long to repeat here).

### 4.3 Update TodaysWalks Component

**File:** `client/src/components/TodaysWalks.js`

Key changes needed:

**1. Fetch covering appointments:**

```jsx
const [ownedAppointments, setOwnedAppointments] = useState([]);
const [coveringAppointments, setCoveringAppointments] = useState([]);

useEffect(() => {
  const fetchAppointments = async () => {
    try {
      const response = await fetch(
        `/appointments?date=${selectedDate.toISOString().split('T')[0]}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );
      const data = await response.json();

      // Separate owned and covering appointments
      setOwnedAppointments(data.owned || []);
      setCoveringAppointments(data.covering || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    }
  };

  fetchAppointments();
}, [selectedDate]);
```

**2. Add badges to appointment cards:**

```jsx
const AppointmentCard = ({ appointment, isCovering = false }) => {
  return (
    <Card>
      {/* Existing card content */}

      {/* NEW: Badge for shared status */}
      {isCovering && (
        <Badge type="covering">
          Covering ({appointment.my_percentage}%)
        </Badge>
      )}

      {appointment.is_shared_out && (
        <Badge type="covered">
          Covered by {appointment.covered_by.profile?.full_name}
        </Badge>
      )}

      {/* Completion button */}
      <CompleteButton
        onClick={() => handleComplete(appointment)}
        disabled={appointment.is_shared_out}
      >
        {appointment.is_shared_out ? 'Delegated' : 'Mark Complete'}
      </CompleteButton>
    </Card>
  );
};
```

**3. Exclude shared-out appointments from route optimization:**

```jsx
const handleOptimizeRoute = () => {
  // Filter out appointments that are shared out
  const appointmentsToOptimize = ownedAppointments.filter(apt =>
    !apt.is_shared_out
  );

  // Include appointments we're covering
  const allActiveAppointments = [
    ...appointmentsToOptimize,
    ...coveringAppointments
  ];

  // Run optimization on allActiveAppointments
  optimizeRoute(allActiveAppointments);
};
```

**4. Render both owned and covering appointments:**

```jsx
return (
  <Container>
    {/* Existing date selector, stats, etc. */}

    <AppointmentsList>
      {/* Appointments you're covering */}
      {coveringAppointments.map(apt => (
        <AppointmentCard
          key={`covering-${apt.id}`}
          appointment={apt}
          isCovering={true}
        />
      ))}

      {/* Your owned appointments */}
      {ownedAppointments.map(apt => (
        <AppointmentCard
          key={`owned-${apt.id}`}
          appointment={apt}
          isCovering={false}
        />
      ))}
    </AppointmentsList>
  </Container>
);
```

**5. Add styled Badge component:**

```jsx
const Badge = styled.div`
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  margin-top: 0.5rem;

  ${props => props.type === 'covering' && `
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  `}

  ${props => props.type === 'covered' && `
    background: linear-gradient(135deg, #6366f1, #4f46e5);
    color: white;
  `}
`;
```

**Visual Design:**
- Green gradient badge for "Covering (60%)"
- Blue/indigo gradient for "Covered by [Name]"
- Badges appear at top of appointment card
- Disabled/grayed completion button for shared-out walks

### 4.4 Display Shared Dates with Cancellations

**File:** `client/src/components/PetsPage.js` (in appointments tab)

Modify the appointment card to show both cancellations and shared dates:

```jsx
{/* Existing cancellations display */}
{appointment.cancellations && appointment.cancellations.length > 0 && (
  <CancellationsList>
    <strong>Cancelled:</strong>
    {/* existing cancellation display logic */}
  </CancellationsList>
)}

{/* NEW: Show shared dates */}
{appointment.accepted_shares && appointment.accepted_shares.length > 0 && (
  <SharedDatesList>
    <strong>Covered by team:</strong>
    {appointment.accepted_shares.map(share => (
      <ShareInfo key={share.id}>
        {share.shared_with.profile?.full_name || share.shared_with.email}
        {share.share_dates.length > 0 && (
          <span> ({share.share_dates.length} dates)</span>
        )}
      </ShareInfo>
    ))}
  </SharedDatesList>
)}
```

Add styled component:

```jsx
const SharedDatesList = styled.div`
  margin-top: 0.75rem;
  padding: 0.75rem;
  background: rgba(99, 102, 241, 0.1);
  border-left: 3px solid rgb(99, 102, 241);
  border-radius: 4px;
  font-size: 0.85rem;
  color: rgb(99, 102, 241);

  strong {
    display: block;
    margin-bottom: 0.5rem;
    color: rgb(99, 102, 241);
  }
`;

const ShareInfo = styled.div`
  padding: 0.25rem 0;

  span {
    font-size: 0.8rem;
    opacity: 0.8;
  }
`;
```

**Visual Design:**
- Blue/indigo theme (matches "covered by" badge)
- Appears below cancellations list
- Shows covering walker name and date count
- Left border accent for visual distinction

### 4.5 Update TeamAndShares Component

**File:** `client/src/components/TeamAndShares.js`

In the "Walks" tab (pending shares), add income split display:

```jsx
{pendingShares.map(share => (
  <Card key={share.id}>
    {/* Existing appointment details */}

    {/* NEW: Income split display */}
    <IncomeSplitDisplay>
      <div className="label">Proposed Split:</div>
      <div className="split">
        <div className="you">
          <span>You get:</span>
          <strong>{share.covering_walker_percentage}%</strong>
          <span className="amount">
            ${((share.appointment.price * share.covering_walker_percentage / 100) / 100).toFixed(2)}
          </span>
        </div>
        <div className="divider">|</div>
        <div className="them">
          <span>They keep:</span>
          <strong>{100 - share.covering_walker_percentage}%</strong>
          <span className="amount">
            ${((share.appointment.price * (100 - share.covering_walker_percentage) / 100) / 100).toFixed(2)}
          </span>
        </div>
      </div>
    </IncomeSplitDisplay>

    {/* NEW: Show shared dates if recurring */}
    {share.share_dates && share.share_dates.length > 0 && (
      <SharedDatesInfo>
        <strong>{share.share_dates.length} dates:</strong>
        <span>
          {share.share_dates.slice(0, 3).map(d =>
            new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          ).join(', ')}
          {share.share_dates.length > 3 && ` +${share.share_dates.length - 3} more`}
        </span>
      </SharedDatesInfo>
    )}

    {/* Existing accept/decline buttons */}
  </Card>
))}
```

Add styled components:

```jsx
const IncomeSplitDisplay = styled.div`
  margin: 1rem 0;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;

  .label {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 0.75rem;
  }

  .split {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;

    > div {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;

      span {
        font-size: 0.8rem;
        color: rgba(255, 255, 255, 0.6);
      }

      strong {
        font-size: 1.5rem;
        color: white;
      }

      .amount {
        font-size: 0.9rem;
        color: rgba(255, 255, 255, 0.8);
      }
    }

    .divider {
      color: rgba(255, 255, 255, 0.2);
      font-size: 1.5rem;
    }
  }

  .you strong {
    color: #10b981;
  }
`;

const SharedDatesInfo = styled.div`
  margin: 0.75rem 0;
  padding: 0.5rem;
  background: rgba(99, 102, 241, 0.1);
  border-radius: 6px;
  font-size: 0.85rem;

  strong {
    color: rgb(99, 102, 241);
    margin-right: 0.5rem;
  }

  span {
    color: rgba(255, 255, 255, 0.8);
  }
`;
```

**Visual Design:**
- Prominent split display with two columns (you get / they keep)
- Green highlight on "you get" percentage
- Dollar amounts shown below percentages
- Compact date list (first 3 dates + count)
- Clear visual hierarchy

---

## 🧪 Phase 5: Testing & Validation

### 5.1 Backend Tests

Create spec file: `spec/models/appointment_share_spec.rb`

**Test cases:**
- Income split calculation accuracy (including rounding)
- Date validation for recurring appointments
- Covering walker permissions (can complete only on covered dates)
- Invoice splitting on completion (two invoices created with correct amounts)
- `covers_date?` method for both recurring and one-time appointments
- Validations (percentage 0-100, dates in future, dates match schedule)

Create spec file: `spec/models/share_date_spec.rb`

**Test cases:**
- Validates date is in future
- Validates date matches appointment schedule
- Unique constraint per share
- Proper association with appointment_share

Create spec file: `spec/controllers/appointment_shares_controller_spec.rb`

**Test cases:**
- Creating share with income split
- Creating share with specific dates
- Accepting share updates delegation_status
- Cannot share with non-connected users
- Cannot share appointments you don't own

Create spec file: `spec/controllers/appointments_controller_spec.rb`

**Test cases:**
- Index returns both owned and covering appointments
- Owned appointments include `is_shared_out` flag
- Covering appointments include `my_percentage`
- Completion validates covering walker permissions
- Completion creates split invoices

### 5.2 Frontend Tests

Test scenarios:
- Share button appears on Pets page appointments tab
- Date selection modes work correctly (single, range, multi)
- Income split slider calculates correctly
- Badges display properly on TodaysWalks
- Only covering walker can complete
- Shared dates appear alongside cancellations
- Route optimization excludes shared-out walks

### 5.3 Integration Tests

End-to-end flows:
1. **One-time appointment sharing:**
   - Share → Accept → Both see on TodaysWalks → Covering walker completes → Verify split invoices
2. **Recurring with date selection:**
   - Share specific dates → Accept → Both walkers see on correct dates → Complete → Verify split
3. **Route optimization:**
   - Share out some walks → Optimize route → Verify shared-out walks excluded
4. **Display integration:**
   - Share → Accept → Verify shared dates appear with cancellations on Pets page

### 5.4 Manual Testing Checklist

- [ ] Share button visible on Pets page
- [ ] Modal opens with team members list
- [ ] Income split slider updates amounts in real-time
- [ ] Date selection modes all work (single/range/multi)
- [ ] Share creation succeeds
- [ ] Pending share appears in TeamAndShares "Walks" tab
- [ ] Income split displayed correctly in pending shares
- [ ] Accept share succeeds
- [ ] Both walkers see appointment on TodaysWalks for correct dates
- [ ] Badges display correctly (green "Covering", blue "Covered by")
- [ ] Only covering walker can mark complete
- [ ] Completion creates two invoices with correct split
- [ ] Shared dates appear on Pets page with cancellations
- [ ] Route optimization excludes shared-out walks
- [ ] Mobile responsive on all screens

---

## 📝 Phase 6: Cleanup & Documentation

### 6.1 Remove Orphaned Components

**Decision:** Delete `MyTeam.js` and `SharedAppointments.js` since `TeamAndShares.js` is the canonical team/sharing interface.

```bash
rm client/src/components/MyTeam.js
rm client/src/components/SharedAppointments.js
```

**Rationale:**
- Both components are not routed in App.js
- TeamAndShares.js consolidates all team and sharing functionality
- Reduces maintenance burden
- SharedAppointments.js has better detail display, but we've integrated those features into TeamAndShares

**Alternative:** If you want to keep SharedAppointments for detailed view:
- Route it at `/shared-appointments`
- Update it with income split display
- Add link from TeamAndShares to detailed view

### 6.2 Update API Documentation

Document the new sharing endpoints:

**POST /appointment_shares**
```json
{
  "appointment_share": {
    "appointment_ids": [123],
    "shared_with_user_id": 456,
    "covering_walker_percentage": 60,
    "share_dates": ["2025-11-15", "2025-11-22", "2025-11-29"]
  }
}
```

**Response includes:**
- Both percentages (covering and original)
- Share dates array
- Appointment details

**GET /appointments?date=YYYY-MM-DD**

Returns:
```json
{
  "owned": [...],    // Appointments you own (with is_shared_out flag)
  "covering": [...]  // Appointments you're covering (with my_percentage)
}
```

### 6.3 User Documentation

Create user guide for the sharing feature:

**How to Share an Appointment:**
1. Go to Pets page
2. Click on a pet
3. Go to Appointments tab
4. Click "Share" button on any appointment
5. Select team member
6. Set income split (slider)
7. For recurring: Select dates to share
8. Click "Share Appointment"

**How Income Split Works:**
- You propose a split when sharing
- Covering walker sees the proposed split when accepting
- Split is locked once accepted
- When walk is completed, two invoices are created automatically
- Each walker receives their percentage

**What Happens After Accepting:**
- Both walkers see the walk on "Today's Walks"
- Covering walker sees green badge: "Covering (60%)"
- Original owner sees blue badge: "Covered by [Name]"
- Only covering walker can mark the walk complete
- Original owner's route optimization excludes shared walks

### 6.4 Code Comments

Add comments to key methods:

```ruby
# app/models/appointment_share.rb
# Checks if this share covers a specific date
# For one-time appointments, all dates are covered
# For recurring appointments, only specific share_dates are covered
def covers_date?(date)
  # ...
end
```

```jsx
// client/src/components/ShareAppointmentModal.js
// Generates next 30 dates that match the appointment's schedule
// For example, if appointment is Mon/Wed/Fri, returns next 30 Mon/Wed/Fri dates
const generateAvailableDates = () => {
  // ...
};
```

---

## 🚀 Implementation Order

### Sprint 1: Database & Backend Foundation (2-3 days)
1. ✅ Create `share_dates` migration
2. ✅ Add income split columns to `appointment_shares`
3. ✅ Create `ShareDate` model with validations
4. ✅ Update `AppointmentShare` model with associations and methods
5. ✅ Update `Appointment` model with covering walker methods
6. ✅ Run migrations and verify schema
7. ✅ Write model tests

**Deliverable:** Backend models support date-specific sharing with income splits

### Sprint 2: Backend API (3-4 days)
8. ✅ Update `AppointmentSharesController#create` for dates & split
9. ✅ Modify `AppointmentsController#index` to include covering appointments
10. ✅ Update completion endpoint with permission checks
11. ✅ Implement invoice splitting logic
12. ✅ Add routes for share_dates
13. ✅ Write controller tests
14. ✅ Test all API endpoints with Postman/curl

**Deliverable:** API endpoints support full sharing workflow with income splits

### Sprint 3: Share Modal UI (3-4 days)
15. ✅ Create new `ShareAppointmentModal` component
16. ✅ Implement team member selection
17. ✅ Add income split slider with live calculation
18. ✅ Implement three date selection modes (single/range/multi)
19. ✅ Add validation and error handling
20. ✅ Style modal with purple gradient theme
21. ✅ Test modal in isolation

**Deliverable:** Fully functional share modal with all features

### Sprint 4: Integration - Pets Page & TodaysWalks (3-4 days)
22. ✅ Add share button to PetsPage appointments tab
23. ✅ Integrate ShareAppointmentModal with PetsPage
24. ✅ Update TodaysWalks to fetch covering appointments
25. ✅ Add badge components (green "Covering", blue "Covered by")
26. ✅ Disable completion for shared-out walks
27. ✅ Update route optimization to exclude shared-out walks
28. ✅ Test full flow from Pets → Share → Accept → Complete

**Deliverable:** End-to-end sharing from Pets page with visual indicators

### Sprint 5: TeamAndShares & Display (2-3 days)
29. ✅ Update TeamAndShares pending shares with income split display
30. ✅ Add shared dates count and preview
31. ✅ Show shared dates alongside cancellations in PetsPage
32. ✅ Style all new UI elements consistently
33. ✅ Test acceptance flow thoroughly
34. ✅ Mobile responsiveness check

**Deliverable:** Polished UI for viewing and accepting shares

### Sprint 6: Polish, Testing & Cleanup (2-3 days)
35. ✅ Delete orphaned components (MyTeam.js, SharedAppointments.js)
36. ✅ Add loading states throughout
37. ✅ Improve error messages
38. ✅ Add accessibility features (aria-labels, keyboard nav)
39. ✅ Full E2E testing (multiple scenarios)
40. ✅ Performance testing
41. ✅ Documentation and code comments
42. ✅ Deploy to staging and final QA

**Deliverable:** Production-ready sharing system

**Total Estimated Time:** 15-21 days (3-4 weeks)

---

## ⚠️ Gotchas & Considerations

### 1. Time Zones
**Issue:** Date comparisons may fail if users are in different time zones
**Solution:**
- Store all dates in UTC
- Convert to user's local timezone for display
- Use `Date.parse()` carefully, consider timezone offset
- For "today's walks", use user's local date, not server date

### 2. Concurrent Sharing
**Issue:** Two walkers try to share the same appointment/date simultaneously
**Solution:**
- Add `created_at` timestamps to detect race conditions
- Database unique constraint on `appointment_id + shared_with_user_id` prevents duplicates
- Frontend should refresh after API error and show existing share

### 3. Rounding Issues
**Issue:** 60% of $25.00 = $15.00, 40% = $10.00, but what about $25.01?
**Solution:**
- Covering walker always gets rounded amount: `(price * percentage / 100).round`
- Original walker gets remainder: `price - covering_amount`
- This ensures total always equals original price
- Document this behavior so users understand

### 4. Cancellations on Shared Dates
**Issue:** What happens if a shared date is later cancelled?
**Solution Options:**
- **Option A:** Share remains, but both walkers see it's cancelled (no work, no pay)
- **Option B:** Automatically remove share_date when cancelled
- **Recommendation:** Option A (keep share, both see cancellation)

### 5. Connection Removal
**Issue:** Walkers disconnect after sharing - should shares remain valid?
**Solution:**
- Keep shares even if connection removed (they already agreed)
- Completed invoices must be honored
- Add business logic: can't remove connection if pending shares exist
- Or: allow removal but show warning about existing shares

### 6. Recurring Schedule Changes
**Issue:** Appointment schedule changes (e.g., remove Mondays), but shares include Mondays
**Solution:**
- Add validation: when updating appointment schedule, check share_dates
- Notify both walkers if share_dates no longer match schedule
- Offer to remove invalid share_dates or cancel entire share
- Prevent schedule changes if shares exist (require unsharing first)

### 7. Price Changes
**Issue:** Appointment price changes after share accepted - should split recalculate?
**Solution:**
- Lock percentage once accepted (it's a contract)
- Recalculate dollar amounts based on new price
- Show notification to both walkers: "Price changed, your split is now $X"
- Alternative: store absolute amounts on share, don't recalculate

### 8. Multiple Shares on Same Appointment
**Issue:** Can you share different dates of a recurring appointment to different people?
**Solution:**
- Current schema supports this (unique constraint is per user)
- Share Monday/Wednesday to Walker A, Friday to Walker B
- Validation needed: check no date conflicts between shares
- UI complexity: show who's covering which dates

### 9. Delegation Status Semantics
**Issue:** `delegation_status = 'shared'` doesn't capture complexity of partial shares
**Solution:**
- Keep it as boolean flag: "has shares"
- Use appointment methods (`covering_walker_on(date)`) for date-specific logic
- Don't rely on delegation_status for business logic

### 10. Invoice Display
**Issue:** Invoices tab now has two invoices per shared appointment
**Solution:**
- Group related invoices visually
- Show "Shared appointment" badge
- Display both walkers' names and amounts
- Filter by "my invoices" vs "all related invoices"

### 11. Completed Appointments
**Issue:** If appointment marked `completed: true`, does it apply to all dates or just one?
**Recommendation:**
- For recurring appointments with per-date sharing, `completed` flag is insufficient
- Consider adding `completed_dates` table (similar to cancellations)
- Track completion per date, not per appointment
- This enables recurring appointments where different dates are completed by different people

### 12. Share Revocation
**Issue:** Original owner wants to cancel share before it's completed
**Solution:**
- Add "Cancel Share" button (DELETE endpoint exists)
- Only allow cancellation before walk date
- Notify covering walker via email/notification
- After cancellation, appointment returns to original owner fully

---

## 📊 Success Metrics

### Feature Completeness
- [x] Walkers can share appointments from Pets page
- [x] Income splits are proposed and accepted
- [x] Both walkers see shared walks on correct dates
- [x] Only covering walker can mark complete
- [x] Invoices split correctly on completion
- [x] Shared dates appear alongside cancellations
- [x] Route optimization excludes shared-out walks

### User Experience
- [ ] Share flow takes < 30 seconds
- [ ] No confusion about who can complete
- [ ] Income split clearly communicated
- [ ] Mobile experience is smooth
- [ ] Error messages are helpful

### Technical Quality
- [ ] All tests passing
- [ ] No N+1 queries
- [ ] Frontend performance < 2s load time
- [ ] Accessible (WCAG 2.1 AA)
- [ ] No console errors

### Business Metrics (Post-Launch)
- [ ] % of appointments shared per week
- [ ] Average income split percentage
- [ ] Share acceptance rate
- [ ] Time saved via sharing
- [ ] User satisfaction survey results

---

## 📚 Additional Resources

### Files to Reference
- **Cancellation UI:** `client/src/components/CancellationModal.js` - Reuse date selection patterns
- **Existing Share Modal:** `client/src/components/ShareAppointmentModal.js` - Starting point for rewrite
- **Team Management:** `client/src/components/TeamAndShares.js` - Main interface for shares
- **Today's Walks:** `client/src/components/TodaysWalks.js` - Where shared walks appear
- **Invoices Model:** `app/models/invoice.rb` - Already has split support fields

### Database Schema Files
- `db/schema.rb` - Current database structure
- `app/models/appointment.rb` - Appointment model
- `app/models/appointment_share.rb` - Share model
- `app/models/cancellation.rb` - Similar pattern for date tracking

### API Endpoints (Current)
- `GET /walker_connections?status=accepted` - Fetch team members
- `POST /appointment_shares` - Create share
- `PATCH /appointment_shares/:id/accept` - Accept share
- `GET /appointments` - Fetch appointments (will be modified)
- `PATCH /appointments/:id/complete` - Complete appointment (will be modified)

---

## 🎯 Next Steps

1. **Review this plan** with team/stakeholders
2. **Clarify any gotchas** - make decisions on edge cases
3. **Set up project board** - break into tickets
4. **Start with Sprint 1** - database foundation
5. **Iterate and test** throughout implementation
6. **Deploy to staging** after Sprint 5
7. **User testing** before production release

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Author:** Claude Code Analysis
**Status:** Ready for Implementation
