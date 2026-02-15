class AddStripeCustomerIdToClients < ActiveRecord::Migration[7.2]
  def change
    add_column :clients, :stripe_customer_id, :string
    add_index :clients, :stripe_customer_id
  end
end
