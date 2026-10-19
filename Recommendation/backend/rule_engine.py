import json
import os
from models import Issue, FloorPlan
from typing import List, Dict, Tuple

_DEDUCTIONS = {"HIGH": 20, "MEDIUM": 10, "LOW": 5}

def load_rules():
    rules_path = os.path.join(os.path.dirname(__file__), "data", "rules.json")
    with open(rules_path) as f:
        return json.load(f)

rules_db = load_rules()

def get_deduction(severity: str) -> int:
    return _DEDUCTIONS.get(severity, 0)

def _apply_rule(issues, room, room_score, overall_score, problem, severity, actual, expected, reason):
    deduction = get_deduction(severity)
    issues.append(Issue(
        room=room.name,
        problem=problem,
        severity=severity,
        actual=str(actual),
        expected=str(expected),
        reason=reason
    ))
    return room_score - deduction, overall_score - deduction

def analyze_floor_plan(floor_plan: FloorPlan) -> Tuple[List[Issue], int, Dict[str, int]]:
    issues = []
    overall_score = 100
    room_scores = {}

    for room in floor_plan.rooms:
        room_score = 100
        rule = rules_db.get(room.roomType)
        if not rule:
            room_scores[room.name] = room_score
            continue

        if "minArea" in rule and room.area < rule["minArea"]["value"]:
            room_score, overall_score = _apply_rule(
                issues, room, room_score, overall_score,
                "Room too small", rule["minArea"]["severity"],
                room.area, rule["minArea"]["value"],
                "Insufficient area for expected functionality."
            )

        if "maxDoors" in rule and room.doors > rule["maxDoors"]["value"]:
            room_score, overall_score = _apply_rule(
                issues, room, room_score, overall_score,
                "Too many doors", rule["maxDoors"]["severity"],
                room.doors, rule["maxDoors"]["value"],
                "Reduces usable wall space and makes furniture placement difficult."
            )

        if "minWindows" in rule and room.windows < rule["minWindows"]["value"]:
            problem = "No windows" if room.windows == 0 else "Insufficient windows"
            room_score, overall_score = _apply_rule(
                issues, room, room_score, overall_score,
                problem, rule["minWindows"]["severity"],
                room.windows, rule["minWindows"]["value"],
                "Inadequate natural lighting and ventilation."
            )

        room_scores[room.name] = max(0, room_score)

    return issues, max(0, overall_score), room_scores
