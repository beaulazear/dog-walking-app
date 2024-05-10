class InvoiceSerializer < ActiveModel::Serializer
  attributes :id, :date_completed, :compensation, :paid, :pending, :pet_id, :title
  
  has_one :appointment
  has_one :pet
end
