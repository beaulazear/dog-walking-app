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

ActiveRecord::Schema[7.2].define(version: 2026_02_23_050103) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", precision: nil, null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum", null: false
    t.datetime "created_at", precision: nil, null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "additional_incomes", force: :cascade do |t|
    t.string "description"
    t.datetime "date_added", precision: nil
    t.integer "compensation"
    t.bigint "pet_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pet_id"], name: "index_additional_incomes_on_pet_id"
  end

  create_table "appointment_shares", force: :cascade do |t|
    t.bigint "appointment_id", null: false
    t.bigint "shared_by_user_id", null: false
    t.bigint "shared_with_user_id", null: false
    t.string "status", default: "pending", null: false
    t.boolean "recurring_share", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "covering_walker_percentage"
    t.string "proposed_by"
    t.index ["appointment_id", "shared_with_user_id"], name: "index_appointment_shares_unique", unique: true
    t.index ["appointment_id"], name: "index_appointment_shares_on_appointment_id"
    t.index ["shared_by_user_id"], name: "index_appointment_shares_on_shared_by_user_id"
    t.index ["shared_with_user_id"], name: "index_appointment_shares_on_shared_with_user_id"
    t.index ["status"], name: "index_appointment_shares_on_status"
  end

  create_table "appointments", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "pet_id", null: false
    t.boolean "recurring"
    t.datetime "appointment_date", precision: nil
    t.time "start_time"
    t.time "end_time"
    t.integer "duration"
    t.integer "price"
    t.boolean "monday"
    t.boolean "tuesday"
    t.boolean "wednesday"
    t.boolean "thursday"
    t.boolean "friday"
    t.boolean "saturday"
    t.boolean "sunday"
    t.boolean "completed"
    t.boolean "canceled"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "completed_by_user_id"
    t.string "delegation_status", default: "none", null: false
    t.string "walk_type"
    t.bigint "walk_group_id"
    t.integer "cloned_from_appointment_id"
    t.index ["completed_by_user_id"], name: "index_appointments_on_completed_by_user_id"
    t.index ["delegation_status"], name: "index_appointments_on_delegation_status"
    t.index ["pet_id"], name: "index_appointments_on_pet_id"
    t.index ["user_id", "appointment_date"], name: "index_appointments_on_user_and_date"
    t.index ["user_id", "recurring", "canceled", "completed"], name: "index_appointments_on_user_and_status"
    t.index ["user_id"], name: "index_appointments_on_user_id"
    t.index ["walk_group_id"], name: "index_appointments_on_walk_group_id"
  end

  create_table "bills", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.bigint "user_id", null: false
    t.date "period_start", null: false
    t.date "period_end", null: false
    t.decimal "total_amount", precision: 8, scale: 2, default: "0.0"
    t.boolean "paid", default: false
    t.datetime "paid_at"
    t.text "notes"
    t.string "bill_number"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["bill_number"], name: "index_bills_on_bill_number", unique: true
    t.index ["client_id"], name: "index_bills_on_client_id"
    t.index ["user_id", "client_id", "period_start"], name: "index_bills_on_user_id_and_client_id_and_period_start"
    t.index ["user_id"], name: "index_bills_on_user_id"
  end

  create_table "blocks", force: :cascade do |t|
    t.jsonb "geojson", null: false
    t.string "block_id", null: false
    t.string "neighborhood"
    t.string "borough"
    t.string "status", default: "inactive", null: false
    t.datetime "warning_started_at"
    t.datetime "warning_expires_at"
    t.integer "total_pickups_all_time", default: 0, null: false
    t.integer "current_month_pickups", default: 0, null: false
    t.integer "active_streak_days", default: 0, null: false
    t.date "last_cleanup_date"
    t.bigint "active_scooper_id"
    t.decimal "active_monthly_rate", precision: 10, scale: 2
    t.datetime "activated_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "this_week_pickups", default: 0
    t.date "clean_since_date"
    t.string "sponsor_display_name"
    t.index ["active_scooper_id"], name: "index_blocks_on_active_scooper_id"
    t.index ["block_id"], name: "index_blocks_on_block_id", unique: true
    t.index ["borough"], name: "index_blocks_on_borough"
    t.index ["neighborhood"], name: "index_blocks_on_neighborhood"
    t.index ["status"], name: "index_blocks_on_status"
  end

  create_table "blogs", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "pet_id"
    t.text "content"
    t.string "training_focus", default: [], array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pet_id"], name: "index_blogs_on_pet_id"
    t.index ["user_id", "created_at"], name: "index_blogs_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_blogs_on_user_id"
  end

  create_table "books", force: :cascade do |t|
    t.bigint "user_id"
    t.string "title", null: false
    t.string "author", null: false
    t.string "category", null: false
    t.boolean "is_default", default: false, null: false
    t.string "status", default: "not_started"
    t.integer "progress_percentage", default: 0
    t.text "notes"
    t.integer "rating"
    t.text "description"
    t.integer "pages"
    t.string "publisher"
    t.integer "year"
    t.string "isbn"
    t.string "price_range"
    t.string "format"
    t.text "why_you_need_it"
    t.text "best_for"
    t.date "completed_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "purchase_url"
    t.string "audible_url"
    t.index ["status"], name: "index_books_on_status"
    t.index ["user_id", "is_default"], name: "index_books_on_user_id_and_is_default"
    t.index ["user_id"], name: "index_books_on_user_id"
  end

  create_table "cancellations", force: :cascade do |t|
    t.datetime "date", precision: nil
    t.bigint "appointment_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_id", "date"], name: "index_cancellations_on_appointment_and_date"
    t.index ["appointment_id"], name: "index_cancellations_on_appointment_id"
  end

  create_table "certification_goals", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "certification_type", default: "CPDT-KA"
    t.integer "target_hours", default: 300
    t.integer "weekly_goal_hours", default: 12
    t.date "target_completion_date"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_certification_goals_on_user_id", unique: true
  end

  create_table "cleanup_jobs", force: :cascade do |t|
    t.bigint "poster_id", null: false
    t.decimal "latitude", precision: 10, scale: 7, null: false
    t.decimal "longitude", precision: 10, scale: 7, null: false
    t.string "address"
    t.bigint "block_id"
    t.decimal "price", precision: 10, scale: 2, null: false
    t.text "note"
    t.string "status", default: "open", null: false
    t.bigint "scooper_id"
    t.datetime "claimed_at"
    t.datetime "scooper_arrived_at"
    t.integer "pickup_count"
    t.datetime "completed_at"
    t.datetime "confirmed_at"
    t.datetime "expires_at"
    t.string "stripe_payment_intent_id"
    t.decimal "platform_fee", precision: 10, scale: 2
    t.decimal "scooper_payout", precision: 10, scale: 2
    t.string "dispute_reason"
    t.text "dispute_notes"
    t.datetime "disputed_at"
    t.string "dispute_resolution"
    t.datetime "job_expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "job_type", default: "poop", null: false
    t.string "poop_itemization"
    t.string "litter_itemization"
    t.jsonb "segments_selected", default: []
    t.bigint "cancelled_by_id"
    t.datetime "cancelled_at"
    t.decimal "cancellation_fee_amount", precision: 10, scale: 2
    t.text "cancellation_reason"
    t.bigint "recurring_cleanup_id"
    t.string "arrival_status"
    t.decimal "price_adjustment_requested", precision: 10, scale: 2
    t.string "price_adjustment_status"
    t.datetime "price_adjustment_requested_at"
    t.datetime "price_adjustment_responded_at"
    t.string "block_identifier"
    t.string "neighborhood"
    t.index ["arrival_status"], name: "index_cleanup_jobs_on_arrival_status"
    t.index ["block_id"], name: "index_cleanup_jobs_on_block_id"
    t.index ["block_identifier"], name: "index_cleanup_jobs_on_block_identifier"
    t.index ["cancelled_by_id"], name: "index_cleanup_jobs_on_cancelled_by_id"
    t.index ["job_type"], name: "index_cleanup_jobs_on_job_type"
    t.index ["latitude", "longitude"], name: "index_cleanup_jobs_on_latitude_and_longitude"
    t.index ["neighborhood"], name: "index_cleanup_jobs_on_neighborhood"
    t.index ["poster_id"], name: "index_cleanup_jobs_on_poster_id"
    t.index ["price_adjustment_status"], name: "index_cleanup_jobs_on_price_adjustment_status"
    t.index ["recurring_cleanup_id"], name: "index_cleanup_jobs_on_recurring_cleanup_id"
    t.index ["scooper_id"], name: "index_cleanup_jobs_on_scooper_id"
    t.index ["status", "created_at"], name: "index_cleanup_jobs_on_status_and_created_at"
    t.index ["status"], name: "index_cleanup_jobs_on_status"
  end

  create_table "cleanups", force: :cascade do |t|
    t.bigint "block_id", null: false
    t.bigint "user_id", null: false
    t.decimal "latitude", precision: 10, scale: 7, null: false
    t.decimal "longitude", precision: 10, scale: 7, null: false
    t.integer "pickup_count", default: 0, null: false
    t.date "cleanup_date", null: false
    t.datetime "cleanup_timestamp", null: false
    t.boolean "has_photo", default: false
    t.boolean "gps_verified", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["block_id", "cleanup_date"], name: "index_cleanups_on_block_id_and_cleanup_date"
    t.index ["block_id"], name: "index_cleanups_on_block_id"
    t.index ["cleanup_date"], name: "index_cleanups_on_cleanup_date"
    t.index ["user_id", "block_id", "cleanup_date"], name: "index_cleanups_on_user_id_and_block_id_and_cleanup_date", unique: true
    t.index ["user_id", "block_id", "cleanup_date"], name: "index_cleanups_unique_daily", unique: true
    t.index ["user_id", "cleanup_date"], name: "index_cleanups_on_user_id_and_cleanup_date"
    t.index ["user_id"], name: "index_cleanups_on_user_id"
  end

  create_table "clients", force: :cascade do |t|
    t.string "first_name", null: false
    t.string "last_name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.string "phone_number"
    t.string "push_token"
    t.string "notification_preferences", default: "email"
    t.datetime "email_verified_at"
    t.datetime "phone_verified_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "current_block_id"
    t.bigint "current_pledge_id"
    t.string "stripe_customer_id"
    t.index ["current_block_id"], name: "index_clients_on_current_block_id"
    t.index ["email"], name: "index_clients_on_email", unique: true
    t.index ["push_token"], name: "index_clients_on_push_token"
    t.index ["stripe_customer_id"], name: "index_clients_on_stripe_customer_id"
  end

  create_table "contributions", force: :cascade do |t|
    t.bigint "sponsorship_id", null: false
    t.bigint "contributor_id", null: false
    t.decimal "monthly_amount", precision: 8, scale: 2, null: false
    t.string "stripe_subscription_id"
    t.string "status", default: "active"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["contributor_id"], name: "index_contributions_on_contributor_id"
    t.index ["sponsorship_id"], name: "index_contributions_on_sponsorship_id"
  end

  create_table "coverage_regions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "block_id", null: false
    t.decimal "monthly_rate", precision: 10, scale: 2, null: false
    t.string "status", default: "claimed", null: false
    t.boolean "monday", default: true
    t.boolean "tuesday", default: true
    t.boolean "wednesday", default: true
    t.boolean "thursday", default: true
    t.boolean "friday", default: true
    t.boolean "saturday", default: false
    t.boolean "sunday", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["block_id"], name: "index_coverage_regions_on_block_id"
    t.index ["status"], name: "index_coverage_regions_on_status"
    t.index ["user_id", "block_id"], name: "index_coverage_regions_on_user_id_and_block_id", unique: true
    t.index ["user_id"], name: "index_coverage_regions_on_user_id"
  end

  create_table "invoices", force: :cascade do |t|
    t.bigint "appointment_id"
    t.bigint "pet_id", null: false
    t.datetime "date_completed", precision: nil
    t.integer "compensation"
    t.boolean "paid"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "pending"
    t.string "title"
    t.boolean "cancelled"
    t.bigint "training_session_id"
    t.boolean "is_shared", default: false, null: false
    t.decimal "split_percentage", precision: 5, scale: 2, default: "0.0"
    t.decimal "owner_amount", precision: 10, scale: 2
    t.decimal "walker_amount", precision: 10, scale: 2
    t.bigint "completed_by_user_id"
    t.bigint "pet_sit_id"
    t.bigint "bill_id"
    t.index ["appointment_id"], name: "index_invoices_on_appointment_id"
    t.index ["bill_id", "date_completed"], name: "index_invoices_on_bill_id_and_date_completed"
    t.index ["bill_id"], name: "index_invoices_on_bill_id"
    t.index ["completed_by_user_id"], name: "index_invoices_on_completed_by_user_id"
    t.index ["is_shared"], name: "index_invoices_on_is_shared"
    t.index ["pet_id", "paid", "pending"], name: "index_invoices_on_pet_and_payment_status"
    t.index ["pet_id"], name: "index_invoices_on_pet_id"
    t.index ["pet_sit_id"], name: "index_invoices_on_pet_sit_id"
    t.index ["training_session_id"], name: "index_invoices_on_training_session_id"
  end

  create_table "milestones", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.integer "hours_reached"
    t.datetime "achieved_at", null: false
    t.boolean "celebrated", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id", "hours_reached"], name: "index_milestones_on_user_id_and_hours_reached", unique: true
    t.index ["user_id"], name: "index_milestones_on_user_id"
  end

  create_table "pet_sit_completions", force: :cascade do |t|
    t.bigint "pet_sit_id", null: false
    t.date "completion_date", null: false
    t.bigint "completed_by_user_id"
    t.datetime "completed_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["completion_date"], name: "index_pet_sit_completions_on_completion_date"
    t.index ["pet_sit_id", "completion_date"], name: "index_completions_unique", unique: true
    t.index ["pet_sit_id"], name: "index_pet_sit_completions_on_pet_sit_id"
  end

  create_table "pet_sits", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "pet_id", null: false
    t.date "start_date", null: false
    t.date "end_date", null: false
    t.integer "daily_rate", null: false
    t.integer "additional_charge", default: 0
    t.text "description"
    t.boolean "canceled", default: false
    t.bigint "completed_by_user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["completed_by_user_id"], name: "index_pet_sits_on_completed_by_user_id"
    t.index ["pet_id"], name: "index_pet_sits_on_pet_id"
    t.index ["start_date", "end_date"], name: "index_pet_sits_on_start_date_and_end_date"
    t.index ["user_id"], name: "index_pet_sits_on_user_id"
  end

  create_table "pets", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name"
    t.datetime "birthdate", precision: nil
    t.string "sex"
    t.boolean "spayed_neutered"
    t.string "address"
    t.text "behavioral_notes"
    t.text "supplies_location"
    t.string "allergies"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "active", default: true, null: false
    t.boolean "origin_trainer", default: false, null: false
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.datetime "geocoded_at"
    t.boolean "geocoding_failed", default: false
    t.string "geocoding_error"
    t.bigint "client_id"
    t.index ["client_id"], name: "index_pets_on_client_id"
    t.index ["latitude", "longitude"], name: "index_pets_on_latitude_and_longitude"
    t.index ["user_id"], name: "index_pets_on_user_id"
  end

  create_table "pledges", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.bigint "block_id", null: false
    t.bigint "coverage_region_id", null: false
    t.decimal "amount", precision: 10, scale: 2, null: false
    t.string "status", default: "pending", null: false
    t.string "stripe_subscription_id"
    t.string "stripe_customer_id"
    t.boolean "anonymous", default: true, null: false
    t.datetime "activated_at"
    t.datetime "cancelled_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "stripe_payment_method_id"
    t.boolean "requires_action"
    t.string "client_secret"
    t.index ["block_id"], name: "index_pledges_on_block_id"
    t.index ["client_id", "block_id"], name: "index_pledges_on_client_id_and_block_id"
    t.index ["client_id", "block_id"], name: "index_pledges_unique_client_block", unique: true
    t.index ["client_id"], name: "index_pledges_on_client_id"
    t.index ["coverage_region_id"], name: "index_pledges_on_coverage_region_id"
    t.index ["status"], name: "index_pledges_on_status"
    t.index ["stripe_subscription_id"], name: "index_pledges_on_stripe_subscription_id"
  end

  create_table "poop_reports", force: :cascade do |t|
    t.bigint "client_id", null: false
    t.bigint "block_id", null: false
    t.decimal "latitude", precision: 10, scale: 7, null: false
    t.decimal "longitude", precision: 10, scale: 7, null: false
    t.text "notes"
    t.datetime "reported_at", null: false
    t.boolean "has_photo", default: false
    t.string "status", default: "open", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["block_id", "reported_at"], name: "index_poop_reports_on_block_id_and_reported_at"
    t.index ["block_id"], name: "index_poop_reports_on_block_id"
    t.index ["client_id"], name: "index_poop_reports_on_client_id"
    t.index ["reported_at"], name: "index_poop_reports_on_reported_at"
    t.index ["status"], name: "index_poop_reports_on_status"
  end

  create_table "recurring_cleanups", force: :cascade do |t|
    t.bigint "poster_id", null: false
    t.bigint "scooper_id"
    t.string "address", null: false
    t.decimal "latitude", precision: 10, scale: 6, null: false
    t.decimal "longitude", precision: 10, scale: 6, null: false
    t.string "frequency", null: false
    t.integer "day_of_week"
    t.decimal "price", precision: 8, scale: 2, null: false
    t.string "status", default: "pending", null: false
    t.string "stripe_subscription_id"
    t.string "stripe_customer_id"
    t.datetime "last_job_generated_at"
    t.date "next_job_date"
    t.datetime "started_at"
    t.datetime "cancelled_at"
    t.string "job_type", null: false
    t.text "segments_selected"
    t.string "poop_itemization"
    t.string "litter_itemization"
    t.text "note"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["next_job_date"], name: "index_recurring_cleanups_on_next_job_date"
    t.index ["poster_id"], name: "index_recurring_cleanups_on_poster_id"
    t.index ["scooper_id"], name: "index_recurring_cleanups_on_scooper_id"
    t.index ["status"], name: "index_recurring_cleanups_on_status"
    t.index ["stripe_subscription_id"], name: "index_recurring_cleanups_on_stripe_subscription_id", unique: true
  end

  create_table "reviews", force: :cascade do |t|
    t.bigint "cleanup_job_id", null: false
    t.bigint "reviewer_id", null: false
    t.bigint "scooper_id", null: false
    t.integer "rating", null: false
    t.text "comment"
    t.decimal "tip_amount", precision: 10, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "quality_rating"
    t.integer "thoroughness_rating"
    t.integer "timeliness_rating"
    t.integer "communication_rating"
    t.index ["cleanup_job_id"], name: "index_reviews_on_cleanup_job_id"
    t.index ["reviewer_id"], name: "index_reviews_on_reviewer_id"
    t.index ["scooper_id"], name: "index_reviews_on_scooper_id"
  end

  create_table "scooper_milestones", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "milestone_type", null: false
    t.integer "threshold", null: false
    t.string "title", null: false
    t.string "badge_icon"
    t.text "description"
    t.datetime "achieved_at", null: false
    t.boolean "celebrated", default: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["celebrated"], name: "index_scooper_milestones_on_celebrated"
    t.index ["user_id", "milestone_type", "threshold"], name: "index_milestones_unique", unique: true
    t.index ["user_id"], name: "index_scooper_milestones_on_user_id"
  end

  create_table "share_dates", force: :cascade do |t|
    t.bigint "appointment_share_id", null: false
    t.date "date", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["appointment_share_id", "date"], name: "index_share_dates_on_appointment_share_id_and_date", unique: true
    t.index ["appointment_share_id"], name: "index_share_dates_on_appointment_share_id"
  end

  create_table "sponsorship_ratings", force: :cascade do |t|
    t.bigint "sponsorship_id", null: false
    t.bigint "sponsor_id", null: false
    t.bigint "scooper_id", null: false
    t.date "month", null: false
    t.integer "quality_rating"
    t.integer "thoroughness_rating"
    t.integer "timeliness_rating"
    t.integer "communication_rating"
    t.decimal "overall_rating", precision: 3, scale: 2
    t.text "review_text"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["scooper_id"], name: "index_sponsorship_ratings_on_scooper_id"
    t.index ["sponsor_id"], name: "index_sponsorship_ratings_on_sponsor_id"
    t.index ["sponsorship_id", "month"], name: "index_sponsorship_ratings_on_sponsorship_id_and_month", unique: true
    t.index ["sponsorship_id"], name: "index_sponsorship_ratings_on_sponsorship_id"
  end

  create_table "sponsorships", force: :cascade do |t|
    t.bigint "sponsor_id", null: false
    t.bigint "scooper_id"
    t.decimal "latitude", precision: 10, scale: 6, null: false
    t.decimal "longitude", precision: 10, scale: 6, null: false
    t.string "block_id", null: false
    t.text "segments_selected", default: [], array: true
    t.string "schedule", null: false
    t.decimal "monthly_budget", precision: 8, scale: 2, null: false
    t.string "display_preference", null: false
    t.string "display_name"
    t.string "status", default: "open"
    t.datetime "claimed_at"
    t.datetime "started_at"
    t.string "stripe_subscription_id"
    t.decimal "current_monthly_cost", precision: 8, scale: 2
    t.integer "total_pickups", default: 0
    t.integer "pickups_this_month", default: 0
    t.integer "contributor_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["block_id"], name: "index_sponsorships_on_block_id"
    t.index ["latitude", "longitude"], name: "index_sponsorships_on_latitude_and_longitude"
    t.index ["scooper_id"], name: "index_sponsorships_on_scooper_id"
    t.index ["sponsor_id"], name: "index_sponsorships_on_sponsor_id"
    t.index ["status"], name: "index_sponsorships_on_status"
  end

  create_table "sweeps", force: :cascade do |t|
    t.bigint "sponsorship_id", null: false
    t.bigint "scooper_id", null: false
    t.decimal "arrival_latitude", precision: 10, scale: 6
    t.decimal "arrival_longitude", precision: 10, scale: 6
    t.datetime "arrived_at"
    t.integer "pickup_count", default: 0
    t.string "after_photo_url"
    t.text "notes"
    t.boolean "litter_flagged", default: false
    t.string "status", default: "scheduled"
    t.datetime "completed_at"
    t.decimal "payout_amount", precision: 8, scale: 2
    t.string "stripe_payout_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "gps_verified", default: false, null: false
    t.index ["completed_at"], name: "index_sweeps_on_completed_at"
    t.index ["scooper_id"], name: "index_sweeps_on_scooper_id"
    t.index ["sponsorship_id"], name: "index_sweeps_on_sponsorship_id"
    t.index ["status"], name: "index_sweeps_on_status"
  end

  create_table "training_sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "pet_id"
    t.datetime "session_date", null: false
    t.integer "duration_minutes", null: false
    t.string "session_type"
    t.text "notes"
    t.string "training_focus", default: [], array: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pet_id"], name: "index_training_sessions_on_pet_id"
    t.index ["user_id", "session_date"], name: "index_training_sessions_on_user_id_and_session_date"
    t.index ["user_id"], name: "index_training_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "username"
    t.string "password_digest"
    t.string "name"
    t.string "email_address"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "thirty", default: 0
    t.integer "fortyfive", default: 0
    t.integer "sixty", default: 0
    t.integer "solo_rate", default: 0
    t.integer "training_rate", default: 0
    t.integer "sibling_rate", default: 0
    t.integer "pet_sitting_rate"
    t.boolean "is_scooper", default: false, null: false
    t.string "stripe_connect_account_id"
    t.boolean "stripe_connect_onboarded", default: false
    t.decimal "total_scooper_earnings", precision: 10, scale: 2, default: "0.0"
    t.integer "total_lifetime_pickups", default: 0
    t.integer "current_streak_days", default: 0
    t.integer "longest_streak_days", default: 0
    t.boolean "admin", default: false, null: false
    t.string "device_token"
    t.string "device_platform"
    t.string "custom_pin", default: "📍"
    t.boolean "is_poster", default: false, null: false
    t.boolean "is_dog_walker", default: false, null: false
    t.string "instagram_handle"
    t.text "neighborhoods", default: [], array: true
    t.string "business_name"
    t.string "profile_photo_url"
    t.decimal "overall_rating", precision: 3, scale: 2, default: "0.0"
    t.integer "total_pickups", default: 0
    t.string "user_type"
    t.boolean "uses_pocket_walks", default: false, null: false
    t.boolean "uses_scoopers", default: false, null: false
    t.string "registered_from_app"
    t.integer "billing_day_of_week", comment: "0=Sunday, 1=Monday, etc."
    t.time "billing_time_of_day", comment: "Time of day to generate bills"
    t.integer "billing_recurrence_weeks", default: 2, comment: "Billing frequency in weeks (1-4)"
    t.index ["device_token"], name: "index_users_on_device_token"
    t.index ["is_dog_walker"], name: "index_users_on_is_dog_walker"
    t.index ["is_poster"], name: "index_users_on_is_poster"
    t.index ["is_scooper"], name: "index_users_on_is_scooper"
    t.index ["neighborhoods"], name: "index_users_on_neighborhoods", using: :gin
    t.index ["registered_from_app"], name: "index_users_on_registered_from_app"
    t.index ["stripe_connect_account_id"], name: "index_users_on_stripe_connect_account_id"
    t.index ["uses_pocket_walks"], name: "index_users_on_uses_pocket_walks"
    t.index ["uses_scoopers"], name: "index_users_on_uses_scoopers"
  end

  create_table "waitlist_signups", force: :cascade do |t|
    t.string "email", null: false
    t.string "ip_address"
    t.string "user_agent"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_waitlist_signups_on_email", unique: true
  end

  create_table "walk_groups", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.date "date"
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["user_id"], name: "index_walk_groups_on_user_id"
  end

  create_table "walker_connections", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "connected_user_id", null: false
    t.string "status", default: "pending", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["connected_user_id"], name: "index_walker_connections_on_connected_user_id"
    t.index ["status"], name: "index_walker_connections_on_status"
    t.index ["user_id", "connected_user_id"], name: "index_walker_connections_on_user_id_and_connected_user_id", unique: true
    t.index ["user_id"], name: "index_walker_connections_on_user_id"
  end

  create_table "walker_earnings", force: :cascade do |t|
    t.bigint "appointment_id", null: false
    t.bigint "walker_id", null: false
    t.bigint "appointment_share_id", null: false
    t.bigint "pet_id", null: false
    t.date "date_completed", null: false
    t.integer "compensation", null: false
    t.integer "split_percentage", null: false
    t.boolean "paid", default: false, null: false
    t.boolean "pending", default: false, null: false
    t.string "title"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "training_session_id"
    t.index ["appointment_id"], name: "index_walker_earnings_on_appointment_id"
    t.index ["appointment_share_id"], name: "index_walker_earnings_on_appointment_share_id"
    t.index ["date_completed"], name: "index_walker_earnings_on_date_completed"
    t.index ["pet_id"], name: "index_walker_earnings_on_pet_id"
    t.index ["training_session_id"], name: "index_walker_earnings_on_training_session_id"
    t.index ["walker_id", "paid", "pending"], name: "index_walker_earnings_on_walker_and_payment_status"
    t.index ["walker_id"], name: "index_walker_earnings_on_walker_id"
  end

  create_table "webhook_events", force: :cascade do |t|
    t.string "stripe_event_id"
    t.string "event_type"
    t.text "payload"
    t.datetime "processed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["stripe_event_id"], name: "index_webhook_events_on_stripe_event_id", unique: true
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "additional_incomes", "pets"
  add_foreign_key "appointment_shares", "appointments"
  add_foreign_key "appointment_shares", "users", column: "shared_by_user_id"
  add_foreign_key "appointment_shares", "users", column: "shared_with_user_id"
  add_foreign_key "appointments", "pets"
  add_foreign_key "appointments", "users"
  add_foreign_key "appointments", "users", column: "completed_by_user_id"
  add_foreign_key "appointments", "walk_groups"
  add_foreign_key "bills", "clients"
  add_foreign_key "bills", "users"
  add_foreign_key "blogs", "pets"
  add_foreign_key "blogs", "users"
  add_foreign_key "books", "users"
  add_foreign_key "cancellations", "appointments"
  add_foreign_key "certification_goals", "users"
  add_foreign_key "cleanup_jobs", "recurring_cleanups"
  add_foreign_key "cleanup_jobs", "users", column: "cancelled_by_id"
  add_foreign_key "cleanup_jobs", "users", column: "poster_id"
  add_foreign_key "cleanup_jobs", "users", column: "scooper_id"
  add_foreign_key "cleanups", "blocks"
  add_foreign_key "cleanups", "users"
  add_foreign_key "contributions", "sponsorships"
  add_foreign_key "contributions", "users", column: "contributor_id"
  add_foreign_key "coverage_regions", "blocks"
  add_foreign_key "coverage_regions", "users"
  add_foreign_key "invoices", "appointments"
  add_foreign_key "invoices", "bills"
  add_foreign_key "invoices", "pet_sits"
  add_foreign_key "invoices", "pets"
  add_foreign_key "invoices", "training_sessions"
  add_foreign_key "invoices", "users", column: "completed_by_user_id"
  add_foreign_key "milestones", "users"
  add_foreign_key "pet_sit_completions", "pet_sits"
  add_foreign_key "pet_sit_completions", "users", column: "completed_by_user_id"
  add_foreign_key "pet_sits", "pets"
  add_foreign_key "pet_sits", "users"
  add_foreign_key "pet_sits", "users", column: "completed_by_user_id"
  add_foreign_key "pets", "clients"
  add_foreign_key "pets", "users"
  add_foreign_key "pledges", "blocks"
  add_foreign_key "pledges", "clients"
  add_foreign_key "pledges", "coverage_regions"
  add_foreign_key "poop_reports", "blocks"
  add_foreign_key "poop_reports", "clients"
  add_foreign_key "recurring_cleanups", "users", column: "poster_id"
  add_foreign_key "recurring_cleanups", "users", column: "scooper_id"
  add_foreign_key "reviews", "cleanup_jobs"
  add_foreign_key "reviews", "users", column: "reviewer_id"
  add_foreign_key "reviews", "users", column: "scooper_id"
  add_foreign_key "scooper_milestones", "users"
  add_foreign_key "share_dates", "appointment_shares"
  add_foreign_key "sponsorship_ratings", "sponsorships"
  add_foreign_key "sponsorship_ratings", "users", column: "scooper_id"
  add_foreign_key "sponsorship_ratings", "users", column: "sponsor_id"
  add_foreign_key "sponsorships", "users", column: "scooper_id"
  add_foreign_key "sponsorships", "users", column: "sponsor_id"
  add_foreign_key "sweeps", "sponsorships"
  add_foreign_key "sweeps", "users", column: "scooper_id"
  add_foreign_key "training_sessions", "pets"
  add_foreign_key "training_sessions", "users"
  add_foreign_key "walk_groups", "users"
  add_foreign_key "walker_connections", "users"
  add_foreign_key "walker_connections", "users", column: "connected_user_id"
  add_foreign_key "walker_earnings", "appointment_shares"
  add_foreign_key "walker_earnings", "appointments"
  add_foreign_key "walker_earnings", "pets"
  add_foreign_key "walker_earnings", "training_sessions"
  add_foreign_key "walker_earnings", "users", column: "walker_id"
end
