class ApiPostingTypes < EnumerateIt::Base
  associate_values :numerical_exams, :conceptual_exams, :absences, :descriptive_exams
end
