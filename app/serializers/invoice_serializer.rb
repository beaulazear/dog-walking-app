class InvoiceSerializer < ActiveModel::Serializer
  attributes :id, :date_completed, :compensation, :paid, :pet_id
  
  has_one :appointment
  has_one :pet
end
