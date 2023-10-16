class InvoiceSerializer < ActiveModel::Serializer
  attributes :id, :date_completed, :compensation, :paid
  has_one :appointment
  has_one :user
end
