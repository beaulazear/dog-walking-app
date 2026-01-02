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
