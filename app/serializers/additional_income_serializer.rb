class AdditionalIncomeSerializer < ActiveModel::Serializer
  attributes :id, :description, :date_added, :compensation
  
  has_one :pet
end
