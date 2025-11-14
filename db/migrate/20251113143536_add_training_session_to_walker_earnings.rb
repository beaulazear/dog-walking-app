class AddTrainingSessionToWalkerEarnings < ActiveRecord::Migration[7.2]
  def change
    add_reference :walker_earnings, :training_session, null: true, foreign_key: true
  end
end
