class AppointmentSerializer < ActiveModel::Serializer
  attributes :id, :pet, :recurring, :appointment_date, :start_time, :end_time, :duration, :price, :monday, :tuesday, :wednesday, :thursday, :friday, :saturday, :sunday, :completed, :canceled, :invoices
  
  has_one :user
  has_one :pet
  has_many :invoices
end
