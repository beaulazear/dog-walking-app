class AppointmentSerializer < ActiveModel::Serializer
  attributes :id, :pet, :solo, :recurring, :appointment_date, :start_time, :end_time, :duration, :price, :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday, :completed, :canceled, :invoices, :cancellations
  
  has_one :user
  has_one :pet
  has_many :invoices
  has_many :cancellations
end
