import json
from models import AnalysisResult

def generate_json_report(result: AnalysisResult, filepath: str = "report.json"):
    with open(filepath, "w") as f:
        json.dump(result.model_dump(), f, indent=4)
