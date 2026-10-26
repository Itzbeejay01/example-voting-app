# Robot Shop availability SLO

SLI: successful web requests divided by all web requests, where HTTP 5xx responses are failures. Target: 99.0% over a rolling 30-day window. The monthly error budget is 1%, equal to 432 minutes of unavailable time in a 30-day month. Warning response begins when the 5-minute failure ratio exceeds 1% for 10 minutes. Planned maintenance counts unless announced as an excluded training window. The owner reviews budget weekly; feature releases pause when the budget is exhausted.
