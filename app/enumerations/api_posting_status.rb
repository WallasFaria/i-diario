class ApiPostingStatus < EnumerateIt::Base
  associate_values :started, :error, :completed
end
