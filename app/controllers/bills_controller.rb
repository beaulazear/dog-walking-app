class BillsController < ApplicationController
  before_action :authorized
  before_action :set_bill, only: [ :show, :mark_paid, :mark_unpaid, :destroy ]

  # GET /bills
  def index
    @bills = current_user.bills.order(created_at: :desc)
    render json: {
      bills: @bills.map { |b| bill_summary_json(b) },
      next_billing_date: current_user.next_billing_date,
      next_billing_period: current_user.next_billing_period
    }
  end

  # GET /bills/:id
  def show
    render json: {
      bill: bill_detail_json(@bill),
      invoices: @bill.invoices.order(:date_completed).map { |inv| invoice_json(inv) }
    }
  end

  # POST /bills
  # Manually create a bill for a client
  def create
    client_id = params[:client_id]
    period_start = params[:period_start] ? Date.parse(params[:period_start]) : nil
    period_end = params[:period_end] ? Date.parse(params[:period_end]) : nil

    # Use suggested period if not provided
    unless period_start && period_end
      suggested = current_user.next_billing_period
      if suggested
        period_start ||= suggested[:start]
        period_end ||= suggested[:end]
      else
        return render json: { error: "Configure billing settings first or provide period dates" },
                      status: :unprocessable_entity
      end
    end

    # Create the bill
    bill = current_user.bills.build(
      client_id: client_id,
      period_start: period_start,
      period_end: period_end,
      notes: params[:notes]
    )

    if bill.save
      # Add all unpaid, unbilled invoices from this period
      unbilled_invoices = Invoice.joins(:pet)
                                  .where(pets: { user_id: current_user.id, client_id: client_id })
                                  .where(
                                    paid: false,
                                    bill_id: nil,
                                    date_completed: period_start..period_end
                                  )

      unbilled_invoices.update_all(bill_id: bill.id)
      bill.reload  # Refresh to calculate total

      render json: {
        message: "Bill created with #{unbilled_invoices.count} invoices",
        bill: bill_detail_json(bill)
      }, status: :created
    else
      render json: { errors: bill.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # GET /bills/preview?client_id=123
  # Preview what would be on the next bill
  def preview
    client_id = params[:client_id]
    period = current_user.next_billing_period

    unless period
      return render json: { error: "Configure billing settings first" }, status: :unprocessable_entity
    end

    unbilled = Invoice.joins(:pet)
                     .where(pets: { user_id: current_user.id, client_id: client_id })
                     .where(
                       paid: false,
                       bill_id: nil,
                       date_completed: period[:start]..period[:end]
                     )
                     .order(:date_completed)

    total = unbilled.sum(:compensation)

    render json: {
      period_start: period[:start],
      period_end: period[:end],
      invoice_count: unbilled.count,
      total_amount: total,
      invoices: unbilled.map { |inv| invoice_json(inv) }
    }
  end

  # PATCH /bills/:id/mark_paid
  def mark_paid
    @bill.mark_as_paid!
    render json: {
      message: "Bill marked as paid",
      bill: bill_detail_json(@bill)
    }
  end

  # PATCH /bills/:id/mark_unpaid
  def mark_unpaid
    @bill.mark_as_unpaid!
    render json: {
      message: "Bill marked as unpaid",
      bill: bill_detail_json(@bill)
    }
  end

  # DELETE /bills/:id
  # Remove bill (unbills all invoices)
  def destroy
    @bill.invoices.update_all(bill_id: nil)
    @bill.destroy
    render json: { message: "Bill deleted, invoices unbilled" }
  end

  private

  def set_bill
    @bill = current_user.bills.find(params[:id])
  end

  def bill_summary_json(bill)
    {
      id: bill.id,
      bill_number: bill.bill_number,
      client_id: bill.client_id,
      client_name: bill.client&.name || bill.client&.first_name || "Unknown Client",
      period_start: bill.period_start,
      period_end: bill.period_end,
      total_amount: bill.total_amount,
      invoice_count: bill.invoices.count,
      paid: bill.paid,
      paid_at: bill.paid_at,
      created_at: bill.created_at
    }
  end

  def bill_detail_json(bill)
    bill_summary_json(bill).merge(notes: bill.notes)
  end

  def invoice_json(invoice)
    {
      id: invoice.id,
      date: invoice.date_completed,
      pet_name: invoice.pet&.name,
      title: invoice.title,
      compensation: invoice.compensation,
      paid: invoice.paid,
      on_bill: invoice.on_bill?
    }
  end
end
