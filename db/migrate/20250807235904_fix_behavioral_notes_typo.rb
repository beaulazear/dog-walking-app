class FixBehavioralNotesTypo < ActiveRecord::Migration[7.2]
  def change
    rename_column :pets, :behavorial_notes, :behavioral_notes
  end
end
