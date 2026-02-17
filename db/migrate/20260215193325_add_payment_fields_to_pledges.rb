class AddPaymentFieldsToPledges < ActiveRecord::Migration[7.2]
  def change
    add_column :pledges, :stripe_payment_method_id, :string
    add_column :pledges, :requires_action, :boolean
    add_column :pledges, :client_secret, :string
  end
end
