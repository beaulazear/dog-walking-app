class InvoiceSerializer < ActiveModel::Serializer
  attributes :id, :date_completed, :compensation, :paid, :pending, :pet_id, :title, :cancelled
  
  has_one :appointment
  has_one :pet
end
