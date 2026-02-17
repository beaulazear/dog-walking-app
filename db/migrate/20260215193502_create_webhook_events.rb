class CreateWebhookEvents < ActiveRecord::Migration[7.2]
  def change
    create_table :webhook_events do |t|
      t.string :stripe_event_id
      t.string :event_type
      t.text :payload
      t.datetime :processed_at

      t.timestamps
    end
    add_index :webhook_events, :stripe_event_id, unique: true
  end
end
