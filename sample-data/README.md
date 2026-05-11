# Sample Dataset Support

The workspace includes `final data.xls` at the repository root. Use it from the frontend upload page to test the full workflow.

The upload pipeline supports:

- `.xls`
- `.xlsx`
- `.csv`

Recommended disease dataset columns:

- Disease or Disease Type
- Cases or Case Count
- Deaths or Fatalities
- State, City, Region, or Governorate
- Weather, Temperature, Rain, or Humidity
- Month or Date
- Gender or Sex
- Age

Column names do not need to match exactly. The system attempts automatic semantic detection and still allows manual target selection during model training.
