class AddPerformanceIndices < ActiveRecord::Migration[7.2]
  def change
    # Optimize appointments queries by date and user
    add_index :appointments, %i[user_id appointment_date], name: 'index_appointments_on_user_and_date'

    # Optimize pet_appointments query (filtering by user, recurring, canceled, completed)
    add_index :appointments, %i[user_id recurring canceled completed],
              name: 'index_appointments_on_user_and_status'

    # Optimize invoice queries by pet and payment status
    add_index :invoices, %i[pet_id paid pending], name: 'index_invoices_on_pet_and_payment_status'

    # Optimize cancellation lookups
    add_index :cancellations, %i[appointment_id date], name: 'index_cancellations_on_appointment_and_date'

    # Optimize additional_incomes by pet_id for user authorization checks
    add_index :additional_incomes, :pet_id, name: 'index_additional_incomes_on_pet_id' unless index_exists?(
      :additional_incomes, :pet_id
    )
  end
end
