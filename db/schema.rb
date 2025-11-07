# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 20_251_107_221_510) do
  # These are extensions that must be enabled in order to support this database
  enable_extension 'plpgsql'

  create_table 'active_storage_attachments', force: :cascade do |t|
    t.string 'name', null: false
    t.string 'record_type', null: false
    t.bigint 'record_id', null: false
    t.bigint 'blob_id', null: false
    t.datetime 'created_at', precision: nil, null: false
    t.index ['blob_id'], name: 'index_active_storage_attachments_on_blob_id'
    t.index %w[record_type record_id name blob_id], name: 'index_active_storage_attachments_uniqueness',
                                                    unique: true
  end

  create_table 'active_storage_blobs', force: :cascade do |t|
    t.string 'key', null: false
    t.string 'filename', null: false
    t.string 'content_type'
    t.text 'metadata'
    t.string 'service_name', null: false
    t.bigint 'byte_size', null: false
    t.string 'checksum', null: false
    t.datetime 'created_at', precision: nil, null: false
    t.index ['key'], name: 'index_active_storage_blobs_on_key', unique: true
  end

  create_table 'active_storage_variant_records', force: :cascade do |t|
    t.bigint 'blob_id', null: false
    t.string 'variation_digest', null: false
    t.index %w[blob_id variation_digest], name: 'index_active_storage_variant_records_uniqueness', unique: true
  end

  create_table 'additional_incomes', force: :cascade do |t|
    t.string 'description'
    t.datetime 'date_added', precision: nil
    t.integer 'compensation'
    t.bigint 'pet_id', null: false
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.index ['pet_id'], name: 'index_additional_incomes_on_pet_id'
  end

  create_table 'appointment_shares', force: :cascade do |t|
    t.bigint 'appointment_id', null: false
    t.bigint 'shared_by_user_id', null: false
    t.bigint 'shared_with_user_id', null: false
    t.string 'status', default: 'pending', null: false
    t.boolean 'recurring_share', default: false
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.index %w[appointment_id shared_with_user_id], name: 'index_appointment_shares_unique', unique: true
    t.index ['appointment_id'], name: 'index_appointment_shares_on_appointment_id'
    t.index ['shared_by_user_id'], name: 'index_appointment_shares_on_shared_by_user_id'
    t.index ['shared_with_user_id'], name: 'index_appointment_shares_on_shared_with_user_id'
    t.index ['status'], name: 'index_appointment_shares_on_status'
  end

  create_table 'appointments', force: :cascade do |t|
    t.bigint 'user_id', null: false
    t.bigint 'pet_id', null: false
    t.boolean 'recurring'
    t.datetime 'appointment_date', precision: nil
    t.time 'start_time'
    t.time 'end_time'
    t.integer 'duration'
    t.integer 'price'
    t.boolean 'monday'
    t.boolean 'tuesday'
    t.boolean 'wednesday'
    t.boolean 'thursday'
    t.boolean 'friday'
    t.boolean 'saturday'
    t.boolean 'sunday'
    t.boolean 'completed'
    t.boolean 'canceled'
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.boolean 'solo'
    t.bigint 'completed_by_user_id'
    t.string 'delegation_status', default: 'none', null: false
    t.index ['completed_by_user_id'], name: 'index_appointments_on_completed_by_user_id'
    t.index ['delegation_status'], name: 'index_appointments_on_delegation_status'
    t.index ['pet_id'], name: 'index_appointments_on_pet_id'
    t.index %w[user_id appointment_date], name: 'index_appointments_on_user_and_date'
    t.index %w[user_id recurring canceled completed], name: 'index_appointments_on_user_and_status'
    t.index ['user_id'], name: 'index_appointments_on_user_id'
  end

  create_table 'books', force: :cascade do |t|
    t.bigint 'user_id'
    t.string 'title', null: false
    t.string 'author', null: false
    t.string 'category', null: false
    t.boolean 'is_default', default: false, null: false
    t.string 'status', default: 'not_started'
    t.integer 'progress_percentage', default: 0
    t.text 'notes'
    t.integer 'rating'
    t.text 'description'
    t.integer 'pages'
    t.string 'publisher'
    t.integer 'year'
    t.string 'isbn'
    t.string 'price_range'
    t.string 'format'
    t.text 'why_you_need_it'
    t.text 'best_for'
    t.date 'completed_date'
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.index ['status'], name: 'index_books_on_status'
    t.index %w[user_id is_default], name: 'index_books_on_user_id_and_is_default'
    t.index ['user_id'], name: 'index_books_on_user_id'
  end

  create_table 'cancellations', force: :cascade do |t|
    t.datetime 'date', precision: nil
    t.bigint 'appointment_id', null: false
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.index %w[appointment_id date], name: 'index_cancellations_on_appointment_and_date'
    t.index ['appointment_id'], name: 'index_cancellations_on_appointment_id'
  end

  create_table 'certification_goals', force: :cascade do |t|
    t.bigint 'user_id', null: false
    t.string 'certification_type', default: 'CPDT-KA'
    t.integer 'target_hours', default: 300
    t.integer 'weekly_goal_hours', default: 12
    t.date 'target_completion_date'
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.index ['user_id'], name: 'index_certification_goals_on_user_id', unique: true
  end

  create_table 'invoices', force: :cascade do |t|
    t.bigint 'appointment_id', null: false
    t.bigint 'pet_id', null: false
    t.datetime 'date_completed', precision: nil
    t.integer 'compensation'
    t.boolean 'paid'
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.boolean 'pending'
    t.string 'title'
    t.boolean 'cancelled'
    t.bigint 'training_session_id'
    t.boolean 'is_shared', default: false, null: false
    t.decimal 'split_percentage', precision: 5, scale: 2, default: '0.0'
    t.decimal 'owner_amount', precision: 10, scale: 2
    t.decimal 'walker_amount', precision: 10, scale: 2
    t.bigint 'completed_by_user_id'
    t.index ['appointment_id'], name: 'index_invoices_on_appointment_id'
    t.index ['completed_by_user_id'], name: 'index_invoices_on_completed_by_user_id'
    t.index ['is_shared'], name: 'index_invoices_on_is_shared'
    t.index %w[pet_id paid pending], name: 'index_invoices_on_pet_and_payment_status'
    t.index ['pet_id'], name: 'index_invoices_on_pet_id'
    t.index ['training_session_id'], name: 'index_invoices_on_training_session_id'
  end

  create_table 'milestones', force: :cascade do |t|
    t.bigint 'user_id', null: false
    t.integer 'hours_reached'
    t.datetime 'achieved_at', null: false
    t.boolean 'celebrated', default: false
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.index %w[user_id hours_reached], name: 'index_milestones_on_user_id_and_hours_reached', unique: true
    t.index ['user_id'], name: 'index_milestones_on_user_id'
  end

  create_table 'pets', force: :cascade do |t|
    t.bigint 'user_id', null: false
    t.string 'name'
    t.datetime 'birthdate', precision: nil
    t.string 'sex'
    t.boolean 'spayed_neutered'
    t.string 'address'
    t.text 'behavioral_notes'
    t.text 'supplies_location'
    t.string 'allergies'
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.boolean 'active', default: true, null: false
    t.boolean 'origin_trainer', default: false, null: false
    t.index ['user_id'], name: 'index_pets_on_user_id'
  end

  create_table 'training_sessions', force: :cascade do |t|
    t.bigint 'user_id', null: false
    t.bigint 'pet_id'
    t.datetime 'session_date', null: false
    t.integer 'duration_minutes', null: false
    t.string 'session_type'
    t.text 'notes'
    t.string 'training_focus', default: [], array: true
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.index ['pet_id'], name: 'index_training_sessions_on_pet_id'
    t.index %w[user_id session_date], name: 'index_training_sessions_on_user_id_and_session_date'
    t.index ['user_id'], name: 'index_training_sessions_on_user_id'
  end

  create_table 'users', force: :cascade do |t|
    t.string 'username'
    t.string 'password_digest'
    t.string 'name'
    t.string 'email_address'
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.integer 'thirty'
    t.integer 'fortyfive'
    t.integer 'sixty'
    t.integer 'solo_rate'
  end

  create_table 'walker_connections', force: :cascade do |t|
    t.bigint 'user_id', null: false
    t.bigint 'connected_user_id', null: false
    t.string 'status', default: 'pending', null: false
    t.datetime 'created_at', null: false
    t.datetime 'updated_at', null: false
    t.index ['connected_user_id'], name: 'index_walker_connections_on_connected_user_id'
    t.index ['status'], name: 'index_walker_connections_on_status'
    t.index %w[user_id connected_user_id], name: 'index_walker_connections_on_user_id_and_connected_user_id',
                                           unique: true
    t.index ['user_id'], name: 'index_walker_connections_on_user_id'
  end

  add_foreign_key 'active_storage_attachments', 'active_storage_blobs', column: 'blob_id'
  add_foreign_key 'active_storage_variant_records', 'active_storage_blobs', column: 'blob_id'
  add_foreign_key 'additional_incomes', 'pets'
  add_foreign_key 'appointment_shares', 'appointments'
  add_foreign_key 'appointment_shares', 'users', column: 'shared_by_user_id'
  add_foreign_key 'appointment_shares', 'users', column: 'shared_with_user_id'
  add_foreign_key 'appointments', 'pets'
  add_foreign_key 'appointments', 'users'
  add_foreign_key 'appointments', 'users', column: 'completed_by_user_id'
  add_foreign_key 'books', 'users'
  add_foreign_key 'cancellations', 'appointments'
  add_foreign_key 'certification_goals', 'users'
  add_foreign_key 'invoices', 'appointments'
  add_foreign_key 'invoices', 'pets'
  add_foreign_key 'invoices', 'training_sessions'
  add_foreign_key 'invoices', 'users', column: 'completed_by_user_id'
  add_foreign_key 'milestones', 'users'
  add_foreign_key 'pets', 'users'
  add_foreign_key 'training_sessions', 'pets'
  add_foreign_key 'training_sessions', 'users'
  add_foreign_key 'walker_connections', 'users'
  add_foreign_key 'walker_connections', 'users', column: 'connected_user_id'
end
