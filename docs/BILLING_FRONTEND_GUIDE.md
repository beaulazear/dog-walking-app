# Billing System - Frontend Implementation Guide

**Created:** February 23, 2026
**Backend Status:** ✅ Production Ready
**Platforms:** React Web (Pocket Walks) + React Native Mobile (optional)

---

## 🎯 Overview

The billing system allows you to:
- **Group invoices** into bills for easier client management
- **Set billing schedule** (day of week, recurrence: 1-4 weeks)
- **Preview** upcoming bills before creating them
- **Mark bills as paid** (automatically pays all invoices on the bill)
- **Track billing history** for each client

**Key Benefit:** New invoices stay separate from billed ones - no more confusion!

---

## 📊 Backend API Reference

### User Billing Settings

#### Update Billing Settings
```http
PATCH /user/billing_settings
Content-Type: application/json
Authorization: Bearer <token>

{
  "billing_day_of_week": 1,         // 0=Sunday, 1=Monday, etc.
  "billing_time_of_day": "09:00",   // Time of day (for future automation)
  "billing_recurrence_weeks": 2     // 1-4 weeks
}

Response:
{
  "message": "Billing settings updated",
  "billing_day_of_week": 1,
  "billing_time_of_day": "09:00:00",
  "billing_recurrence_weeks": 2,
  "next_billing_date": "2026-03-03",
  "next_billing_period": {
    "start": "2026-02-17",
    "end": "2026-03-02"
  }
}
```

### Bills

#### Get All Bills
```http
GET /bills
Authorization: Bearer <token>

Response:
{
  "bills": [
    {
      "id": 1,
      "bill_number": "B-202602-001",
      "client_id": 5,
      "client_name": "Jane Doe",
      "period_start": "2026-02-01",
      "period_end": "2026-02-14",
      "total_amount": "240.00",
      "invoice_count": 8,
      "paid": false,
      "paid_at": null,
      "created_at": "2026-02-15T10:00:00Z"
    }
  ],
  "next_billing_date": "2026-03-03",
  "next_billing_period": {
    "start": "2026-02-17",
    "end": "2026-03-02"
  }
}
```

#### Preview Next Bill
```http
GET /bills/preview?client_id=5
Authorization: Bearer <token>

Response:
{
  "period_start": "2026-02-17",
  "period_end": "2026-03-02",
  "invoice_count": 6,
  "total_amount": "180.00",
  "invoices": [
    {
      "id": 15,
      "date": "2026-02-17",
      "pet_name": "Max",
      "title": "30 minute walk",
      "compensation": 30.00,
      "paid": false,
      "on_bill": false
    }
  ]
}
```

#### Create Bill
```http
POST /bills
Content-Type: application/json
Authorization: Bearer <token>

{
  "client_id": 5,
  "period_start": "2026-02-01",  // Optional - uses suggested period if omitted
  "period_end": "2026-02-14",    // Optional
  "notes": "February billing"     // Optional
}

Response:
{
  "message": "Bill created with 8 invoices",
  "bill": {
    "id": 1,
    "bill_number": "B-202602-001",
    "client_name": "Jane Doe",
    "total_amount": "240.00",
    // ... full bill details
  }
}
```

#### Get Bill Detail
```http
GET /bills/1
Authorization: Bearer <token>

Response:
{
  "bill": {
    "id": 1,
    "bill_number": "B-202602-001",
    "client_id": 5,
    "client_name": "Jane Doe",
    "period_start": "2026-02-01",
    "period_end": "2026-02-14",
    "total_amount": "240.00",
    "invoice_count": 8,
    "paid": false,
    "paid_at": null,
    "notes": "February billing",
    "created_at": "2026-02-15T10:00:00Z"
  },
  "invoices": [
    {
      "id": 10,
      "date": "2026-02-01",
      "pet_name": "Max",
      "title": "30 minute walk",
      "compensation": 30.00,
      "paid": false,
      "on_bill": true
    }
  ]
}
```

#### Mark Bill as Paid
```http
PATCH /bills/1/mark_paid
Authorization: Bearer <token>

Response:
{
  "message": "Bill marked as paid",
  "bill": {
    "id": 1,
    "paid": true,
    "paid_at": "2026-02-20T14:30:00Z",
    // ... full bill details
  }
}
```

#### Mark Bill as Unpaid (Undo)
```http
PATCH /bills/1/mark_unpaid
Authorization: Bearer <token>

Response:
{
  "message": "Bill marked as unpaid",
  "bill": {
    "id": 1,
    "paid": false,
    "paid_at": null,
    // ... full bill details
  }
}
```

#### Delete Bill
```http
DELETE /bills/1
Authorization: Bearer <token>

Response:
{
  "message": "Bill deleted, invoices unbilled"
}
```

---

## 🎨 Frontend Implementation (React - Pocket Walks)

### 1. Billing Settings Component

**Location:** `client/src/components/BillingSettings.js`

```jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const BillingSettings = () => {
  const [settings, setSettings] = useState({
    billing_day_of_week: 1, // Monday
    billing_time_of_day: '09:00',
    billing_recurrence_weeks: 2
  });
  const [nextBillInfo, setNextBillInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const DAYS = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' }
  ];

  const RECURRENCE_OPTIONS = [
    { value: 1, label: 'Every week' },
    { value: 2, label: 'Every 2 weeks' },
    { value: 3, label: 'Every 3 weeks' },
    { value: 4, label: 'Every 4 weeks (monthly)' }
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3000/user/billing_settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (response.ok) {
        setNextBillInfo({
          date: data.next_billing_date,
          period: data.next_billing_period
        });
        alert('Billing settings updated!');
      } else {
        alert('Error: ' + (data.errors || data.error));
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h2>Billing Settings</h2>
      <p>Configure when you want to create bills for your clients</p>

      <FormGroup>
        <label>Bill Day</label>
        <select
          value={settings.billing_day_of_week}
          onChange={(e) => setSettings({...settings, billing_day_of_week: parseInt(e.target.value)})}
        >
          {DAYS.map(day => (
            <option key={day.value} value={day.value}>{day.label}</option>
          ))}
        </select>
      </FormGroup>

      <FormGroup>
        <label>Time of Day (for future automation)</label>
        <input
          type="time"
          value={settings.billing_time_of_day}
          onChange={(e) => setSettings({...settings, billing_time_of_day: e.target.value})}
        />
      </FormGroup>

      <FormGroup>
        <label>Billing Frequency</label>
        <select
          value={settings.billing_recurrence_weeks}
          onChange={(e) => setSettings({...settings, billing_recurrence_weeks: parseInt(e.target.value)})}
        >
          {RECURRENCE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </FormGroup>

      <Button onClick={handleSave} disabled={loading}>
        {loading ? 'Saving...' : 'Save Settings'}
      </Button>

      {nextBillInfo && (
        <InfoBox>
          <h3>Next Bill Schedule</h3>
          <p>Period: {nextBillInfo.period.start} to {nextBillInfo.period.end}</p>
          <p>Bill Date: {nextBillInfo.date}</p>
        </InfoBox>
      )}
    </Container>
  );
};

const Container = styled.div`
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }

  select, input {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
  }
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #0056b3;
  }
`;

const InfoBox = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: #e7f3ff;
  border-left: 4px solid #007bff;
  border-radius: 4px;

  h3 {
    margin: 0 0 10px 0;
    font-size: 16px;
  }

  p {
    margin: 5px 0;
  }
`;

export default BillingSettings;
```

### 2. Bills List Component

**Location:** `client/src/components/BillsList.js`

```jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const BillsList = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextBillInfo, setNextBillInfo] = useState(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const response = await fetch('http://localhost:3000/bills', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBills(data.bills);
        setNextBillInfo({
          date: data.next_billing_date,
          period: data.next_billing_period
        });
      }
    } catch (error) {
      console.error('Error fetching bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (billId) => {
    if (!confirm('Mark this bill as paid? This will mark all invoices as paid.')) return;

    try {
      const response = await fetch(`http://localhost:3000/bills/${billId}/mark_paid`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchBills(); // Refresh list
        alert('Bill marked as paid!');
      }
    } catch (error) {
      alert('Error marking bill as paid');
    }
  };

  const handleDelete = async (billId) => {
    if (!confirm('Delete this bill? Invoices will be unbilled.')) return;

    try {
      const response = await fetch(`http://localhost:3000/bills/${billId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchBills(); // Refresh list
        alert('Bill deleted');
      }
    } catch (error) {
      alert('Error deleting bill');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Container>
      <Header>
        <h1>Bills</h1>
        <Link to="/bills/new">
          <Button>+ Create New Bill</Button>
        </Link>
      </Header>

      {nextBillInfo && nextBillInfo.date && (
        <NextBillInfo>
          <strong>Next Bill:</strong> {nextBillInfo.date}
          (Period: {nextBillInfo.period.start} - {nextBillInfo.period.end})
        </NextBillInfo>
      )}

      <BillsTable>
        <thead>
          <tr>
            <th>Bill #</th>
            <th>Client</th>
            <th>Period</th>
            <th>Total</th>
            <th>Invoices</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {bills.map(bill => (
            <tr key={bill.id}>
              <td>
                <Link to={`/bills/${bill.id}`}>{bill.bill_number}</Link>
              </td>
              <td>{bill.client_name}</td>
              <td>{bill.period_start} to {bill.period_end}</td>
              <td>${bill.total_amount}</td>
              <td>{bill.invoice_count}</td>
              <td>
                {bill.paid ? (
                  <PaidBadge>✓ PAID</PaidBadge>
                ) : (
                  <UnpaidBadge>○ UNPAID</UnpaidBadge>
                )}
              </td>
              <td>
                {!bill.paid && (
                  <ActionButton onClick={() => handleMarkPaid(bill.id)}>
                    Mark Paid
                  </ActionButton>
                )}
                <DeleteButton onClick={() => handleDelete(bill.id)}>
                  Delete
                </DeleteButton>
              </td>
            </tr>
          ))}
        </tbody>
      </BillsTable>

      {bills.length === 0 && (
        <EmptyState>
          <p>No bills created yet.</p>
          <Link to="/bills/new">Create your first bill</Link>
        </EmptyState>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const Button = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #0056b3;
  }
`;

const NextBillInfo = styled.div`
  background: #fff3cd;
  border: 1px solid #ffc107;
  border-radius: 4px;
  padding: 12px;
  margin-bottom: 20px;
`;

const BillsTable = styled.table`
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  th {
    background: #f8f9fa;
    padding: 12px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 12px;
    border-top: 1px solid #eee;
  }

  a {
    color: #007bff;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const PaidBadge = styled.span`
  color: #28a745;
  font-weight: 600;
`;

const UnpaidBadge = styled.span`
  color: #ffc107;
  font-weight: 600;
`;

const ActionButton = styled.button`
  background: #28a745;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  margin-right: 8px;
  font-size: 14px;

  &:hover {
    background: #218838;
  }
`;

const DeleteButton = styled.button`
  background: #dc3545;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    background: #c82333;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 8px;

  p {
    margin-bottom: 20px;
    color: #666;
  }

  a {
    color: #007bff;
    text-decoration: none;
    font-weight: 500;

    &:hover {
      text-decoration: underline;
    }
  }
`;

export default BillsList;
```

### 3. Create Bill Component

**Location:** `client/src/components/CreateBill.js`

```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const CreateBill = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [preview, setPreview] = useState(null);
  const [useCustomDates, setUseCustomDates] = useState(false);
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch clients (you'll need to implement this endpoint or use existing data)
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient && !useCustomDates) {
      fetchPreview();
    }
  }, [selectedClient]);

  const fetchClients = async () => {
    // TODO: Implement your clients endpoint
    // For now, you can use the pets endpoint to get unique clients
    try {
      const response = await fetch('http://localhost:3000/pets', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();

      // Get unique clients from pets
      const uniqueClients = [...new Map(data.pets.map(pet =>
        [pet.client.id, { id: pet.client.id, name: pet.client.name || pet.client.first_name }]
      )).values()];

      setClients(uniqueClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchPreview = async () => {
    try {
      const response = await fetch(`http://localhost:3000/bills/preview?client_id=${selectedClient}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setPreview(data);
        setPeriodStart(data.period_start);
        setPeriodEnd(data.period_end);
      } else {
        alert(data.error || 'Error previewing bill');
      }
    } catch (error) {
      console.error('Error previewing bill:', error);
    }
  };

  const handleCreate = async () => {
    if (!selectedClient) {
      alert('Please select a client');
      return;
    }

    setLoading(true);
    try {
      const body = {
        client_id: parseInt(selectedClient),
        notes
      };

      if (useCustomDates) {
        body.period_start = periodStart;
        body.period_end = periodEnd;
      }

      const response = await fetch('http://localhost:3000/bills', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate('/bills');
      } else {
        alert('Error: ' + (data.errors || data.error));
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <h1>Create New Bill</h1>

      <FormGroup>
        <label>Client *</label>
        <select value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
          <option value="">Select a client...</option>
          {clients.map(client => (
            <option key={client.id} value={client.id}>{client.name}</option>
          ))}
        </select>
      </FormGroup>

      <FormGroup>
        <label>
          <input
            type="checkbox"
            checked={useCustomDates}
            onChange={(e) => setUseCustomDates(e.target.checked)}
          />
          {' '}Use custom dates (otherwise uses suggested period)
        </label>
      </FormGroup>

      {useCustomDates && (
        <>
          <FormGroup>
            <label>Period Start</label>
            <input
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <label>Period End</label>
            <input
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
            />
          </FormGroup>
        </>
      )}

      <FormGroup>
        <label>Notes (optional)</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Internal notes about this bill..."
        />
      </FormGroup>

      {preview && !useCustomDates && (
        <PreviewBox>
          <h3>Preview</h3>
          <p><strong>Period:</strong> {preview.period_start} to {preview.period_end}</p>
          <p><strong>Invoices:</strong> {preview.invoice_count}</p>
          <p><strong>Total:</strong> ${preview.total_amount}</p>

          {preview.invoice_count === 0 && (
            <Warning>⚠️ No unpaid, unbilled invoices found for this period</Warning>
          )}
        </PreviewBox>
      )}

      <ButtonGroup>
        <CancelButton onClick={() => navigate('/bills')}>Cancel</CancelButton>
        <CreateButton onClick={handleCreate} disabled={loading || !selectedClient}>
          {loading ? 'Creating...' : 'Create Bill'}
        </CreateButton>
      </ButtonGroup>
    </Container>
  );
};

const Container = styled.div`
  max-width: 600px;
  margin: 20px auto;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    margin-bottom: 8px;
    font-weight: 500;
  }

  select, input, textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    font-family: inherit;
  }
`;

const PreviewBox = styled.div`
  background: #e7f3ff;
  border: 1px solid #007bff;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 20px;

  h3 {
    margin: 0 0 10px 0;
  }

  p {
    margin: 5px 0;
  }
`;

const Warning = styled.div`
  background: #fff3cd;
  border: 1px solid #ffc107;
  padding: 10px;
  border-radius: 4px;
  margin-top: 10px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  background: #6c757d;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background: #5a6268;
  }
`;

const CreateButton = styled.button`
  background: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    background: #0056b3;
  }
`;

export default CreateBill;
```

### 4. Bill Detail Component

**Location:** `client/src/components/BillDetail.js`

```jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const BillDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [bill, setBill] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillDetail();
  }, [id]);

  const fetchBillDetail = async () => {
    try {
      const response = await fetch(`http://localhost:3000/bills/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setBill(data.bill);
        setInvoices(data.invoices);
      }
    } catch (error) {
      console.error('Error fetching bill:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm('Mark this bill as paid? This will mark all invoices as paid.')) return;

    try {
      const response = await fetch(`http://localhost:3000/bills/${id}/mark_paid`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchBillDetail();
        alert('Bill marked as paid!');
      }
    } catch (error) {
      alert('Error marking bill as paid');
    }
  };

  const handleMarkUnpaid = async () => {
    if (!confirm('Mark this bill as unpaid? This will unmark all invoices as paid.')) return;

    try {
      const response = await fetch(`http://localhost:3000/bills/${id}/mark_unpaid`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        fetchBillDetail();
        alert('Bill marked as unpaid');
      }
    } catch (error) {
      alert('Error marking bill as unpaid');
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this bill? All invoices will be unbilled.')) return;

    try {
      const response = await fetch(`http://localhost:3000/bills/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        navigate('/bills');
        alert('Bill deleted');
      }
    } catch (error) {
      alert('Error deleting bill');
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!bill) return <div>Bill not found</div>;

  return (
    <Container>
      <Header>
        <div>
          <BackButton onClick={() => navigate('/bills')}>← Back to Bills</BackButton>
          <h1>Bill {bill.bill_number}</h1>
        </div>
        <StatusBadge paid={bill.paid}>
          {bill.paid ? '✓ PAID' : '○ UNPAID'}
        </StatusBadge>
      </Header>

      <BillInfo>
        <InfoRow>
          <InfoLabel>Client:</InfoLabel>
          <InfoValue>{bill.client_name}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Period:</InfoLabel>
          <InfoValue>{bill.period_start} to {bill.period_end}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Total Amount:</InfoLabel>
          <InfoValue>${bill.total_amount}</InfoValue>
        </InfoRow>
        <InfoRow>
          <InfoLabel>Created:</InfoLabel>
          <InfoValue>{new Date(bill.created_at).toLocaleDateString()}</InfoValue>
        </InfoRow>
        {bill.paid_at && (
          <InfoRow>
            <InfoLabel>Paid On:</InfoLabel>
            <InfoValue>{new Date(bill.paid_at).toLocaleDateString()}</InfoValue>
          </InfoRow>
        )}
        {bill.notes && (
          <InfoRow>
            <InfoLabel>Notes:</InfoLabel>
            <InfoValue>{bill.notes}</InfoValue>
          </InfoRow>
        )}
      </BillInfo>

      <Section>
        <h2>Invoices ({invoices.length})</h2>
        <InvoicesTable>
          <thead>
            <tr>
              <th>Date</th>
              <th>Pet</th>
              <th>Service</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.date}</td>
                <td>{invoice.pet_name}</td>
                <td>{invoice.title}</td>
                <td>${invoice.compensation}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ textAlign: 'right', fontWeight: 'bold' }}>Total:</td>
              <td style={{ fontWeight: 'bold' }}>${bill.total_amount}</td>
            </tr>
          </tfoot>
        </InvoicesTable>
      </Section>

      <Actions>
        {!bill.paid ? (
          <Button onClick={handleMarkPaid} $variant="success">Mark as Paid</Button>
        ) : (
          <Button onClick={handleMarkUnpaid} $variant="warning">Mark as Unpaid</Button>
        )}
        <Button onClick={handleDelete} $variant="danger">Delete Bill</Button>
      </Actions>
    </Container>
  );
};

const Container = styled.div`
  max-width: 900px;
  margin: 20px auto;
  padding: 20px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;

  h1 {
    margin: 10px 0 0 0;
  }
`;

const BackButton = styled.button`
  background: none;
  border: none;
  color: #007bff;
  cursor: pointer;
  font-size: 14px;
  padding: 0;

  &:hover {
    text-decoration: underline;
  }
`;

const StatusBadge = styled.div`
  padding: 10px 20px;
  border-radius: 20px;
  font-weight: 600;
  background: ${props => props.paid ? '#d4edda' : '#fff3cd'};
  color: ${props => props.paid ? '#155724' : '#856404'};
  border: 1px solid ${props => props.paid ? '#c3e6cb' : '#ffeeba'};
`;

const BillInfo = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-bottom: 30px;
`;

const InfoRow = styled.div`
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.div`
  width: 150px;
  font-weight: 600;
  color: #666;
`;

const InfoValue = styled.div`
  flex: 1;
`;

const Section = styled.div`
  margin-bottom: 30px;

  h2 {
    margin-bottom: 15px;
  }
`;

const InvoicesTable = styled.table`
  width: 100%;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);

  th {
    background: #f8f9fa;
    padding: 12px;
    text-align: left;
    font-weight: 600;
  }

  td {
    padding: 12px;
    border-top: 1px solid #eee;
  }

  tfoot td {
    border-top: 2px solid #333;
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  color: white;

  background: ${props => {
    if (props.$variant === 'success') return '#28a745';
    if (props.$variant === 'warning') return '#ffc107';
    if (props.$variant === 'danger') return '#dc3545';
    return '#007bff';
  }};

  &:hover {
    opacity: 0.9;
  }
`;

export default BillDetail;
```

### 5. Add Routes to App.js

```jsx
// In your App.js or Routes component
import BillingSettings from './components/BillingSettings';
import BillsList from './components/BillsList';
import CreateBill from './components/CreateBill';
import BillDetail from './components/BillDetail';

// Add these routes:
<Route path="/billing-settings" element={<BillingSettings />} />
<Route path="/bills" element={<BillsList />} />
<Route path="/bills/new" element={<CreateBill />} />
<Route path="/bills/:id" element={<BillDetail />} />
```

---

## 📱 Mobile Implementation (Optional - React Native)

If you need mobile support, the same API endpoints work. Here's a quick example:

```jsx
// Example: Mark bill as paid in React Native
const markBillAsPaid = async (billId) => {
  try {
    const token = await AsyncStorage.getItem('token');
    const response = await fetch(`${API_URL}/bills/${billId}/mark_paid`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      Alert.alert('Success', 'Bill marked as paid');
      // Refresh your bills list
    } else {
      Alert.alert('Error', data.error || 'Failed to mark bill as paid');
    }
  } catch (error) {
    Alert.alert('Error', 'Network error');
  }
};
```

---

## ✅ Testing Checklist

Before deploying to production, test:

- [ ] Update billing settings
- [ ] View suggested next bill period
- [ ] Preview bill for a client
- [ ] Create bill manually
- [ ] View bill detail
- [ ] Mark bill as paid (check invoices are also marked paid)
- [ ] Mark bill as unpaid
- [ ] Delete bill (check invoices are unbilled)
- [ ] Create bills for multiple clients
- [ ] Verify bill numbers increment correctly

---

## 🎉 You're Ready!

The backend is production-ready and tested. Just implement the frontend components above and you'll have a complete billing system!

**Questions?** Check the API responses for any errors, and make sure your authentication token is valid.
