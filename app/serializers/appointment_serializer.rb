class AppointmentSerializer
  def self.serialize(appointment, include_pet: true, include_cancellations: true)
    data = {
      id: appointment.id,
      pet_id: appointment.pet_id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      duration: appointment.duration,
      recurring: appointment.recurring,
      solo: appointment.solo,
      completed: appointment.completed,
      canceled: appointment.canceled,
      monday: appointment.monday,
      tuesday: appointment.tuesday,
      wednesday: appointment.wednesday,
      thursday: appointment.thursday,
      friday: appointment.friday,
      saturday: appointment.saturday,
      sunday: appointment.sunday
    }

    data[:pet] = PetSerializer.serialize(appointment.pet) if include_pet && appointment.association(:pet).loaded?

    if include_cancellations && appointment.association(:cancellations).loaded?
      data[:cancellations] = appointment.cancellations.map { |c| { id: c.id, date: c.date } }
    end

    data
  end

  def self.serialize_collection(appointments, include_pet: true, include_cancellations: true)
    appointments.map { |apt| serialize(apt, include_pet: include_pet, include_cancellations: include_cancellations) }
  end

  # Lightweight serialization without nested data
  def self.serialize_minimal(appointment)
    {
      id: appointment.id,
      appointment_date: appointment.appointment_date,
      start_time: appointment.start_time,
      end_time: appointment.end_time,
      duration: appointment.duration,
      recurring: appointment.recurring,
      completed: appointment.completed,
      canceled: appointment.canceled
    }
  end

  def self.serialize_minimal_collection(appointments)
    appointments.map { |apt| serialize_minimal(apt) }
  end
end
