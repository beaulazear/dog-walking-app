class PetSitCompletionSerializer < ActiveModel::Serializer
  attributes :id, :pet_sit_id, :completion_date, :completed_at,
             :completed_by_user_id, :created_at

  belongs_to :pet_sit
  belongs_to :completed_by_user, class_name: 'User'
end
