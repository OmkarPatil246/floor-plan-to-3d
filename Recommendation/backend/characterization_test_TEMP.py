"""
Characterization tests for the Suggestion/Recommendation module.
Run BEFORE and AFTER optimization and compare outputs.
Delete this file when done.

Usage:
    cd d:/Suggestions/recommendation-module/backend
    python characterization_test_TEMP.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))

from models import FloorPlan, Room, Issue
from rule_engine import analyze_floor_plan, get_deduction
from prompt_builder import build_prompt, build_qa_prompt
from rag_service import (
    is_conversational, retrieve_context,
    generate_fallback_qa, generate_human_readable_review
)
from report_generator import generate_json_report

def ok(label):
    print(f"  OK  {label}")

def fail(label, got, expected):
    print(f"  FAIL  {label}")
    print(f"       got:      {repr(got)}")
    print(f"       expected: {repr(expected)}")

def assert_eq(label, got, expected):
    if got == expected:
        ok(label)
    else:
        fail(label, got, expected)

def assert_true(label, value):
    if value:
        ok(label)
    else:
        print(f"  FAIL  {label}  (was falsy: {repr(value)})")

SAMPLE_ROOMS = [
    Room(name="Master Bedroom", roomType="Bedroom", area=120, doors=1, windows=2,
         wallLength=45, orientation="South", connectedRooms=["Hallway"]),
    Room(name="Guest Bedroom", roomType="Bedroom", area=80, doors=1, windows=0,
         wallLength=35, orientation="North", connectedRooms=["Hallway"]),
    Room(name="Main Kitchen", roomType="Kitchen", area=150, doors=2, windows=1,
         wallLength=50, orientation="East", connectedRooms=["Dining"]),
    Room(name="Family Living Room", roomType="Living Room", area=250, doors=3, windows=1,
         wallLength=70, orientation="West", connectedRooms=["Dining"]),
    Room(name="Common Bathroom", roomType="Bathroom", area=35, doors=1, windows=0,
         wallLength=24, orientation="North", connectedRooms=["Hallway"]),
]
FLOOR_PLAN = FloorPlan(rooms=SAMPLE_ROOMS)

print("\n== rule_engine ==")
issues, score, room_scores = analyze_floor_plan(FLOOR_PLAN)
assert_eq("issue count", len(issues), 6)
assert_eq("overall score", score, 15)
assert_eq("master bedroom score", room_scores["Master Bedroom"], 100)
assert_eq("guest bedroom score", room_scores["Guest Bedroom"], 60)
assert_eq("common bathroom score", room_scores["Common Bathroom"], 75)
assert_eq("deduction HIGH", get_deduction("HIGH"), 20)
assert_eq("deduction MEDIUM", get_deduction("MEDIUM"), 10)
assert_eq("deduction LOW", get_deduction("LOW"), 5)
assert_eq("deduction unknown", get_deduction("UNKNOWN"), 0)

print("\n== is_conversational ==")
assert_eq("hi is conversational", is_conversational("hi"), True)
assert_eq("hello is conversational", is_conversational("hello"), True)
assert_eq("thanks is conversational", is_conversational("thanks"), True)
assert_eq("thank you is conversational", is_conversational("thank you"), True)
assert_eq("ok is conversational", is_conversational("ok"), True)
assert_eq("technical q not conversational", is_conversational("what windows should I add?"), False)
assert_eq("empty string not conversational", is_conversational(""), False)

print("\n== retrieve_context ==")
ctx = retrieve_context("what about the guest bedroom windows?", FLOOR_PLAN, issues)
assert_true("context has guest bedroom", "Guest Bedroom" in ctx)
assert_true("context has windows info", "Windows" in ctx)
assert_eq("no plan = empty", retrieve_context("q", None, None), "")
ctx_all = retrieve_context("what is the general layout?", FLOOR_PLAN, issues)
assert_true("general q has context", len(ctx_all) > 0)

print("\n== generate_fallback_qa ==")
ctx_issues = "Room Information:\n- Guest Bedroom: Area=80 sqft, Doors=1, Windows=0, Orientation=North.\n\nDetected Issues and Recommendations:\n- Issue in Guest Bedroom: No windows. Recommendation: Add a window for light."
answer = generate_fallback_qa("how can I improve natural light?", ctx_issues)
assert_true("fallback window answer non-empty", len(answer) > 0)
assert_eq("empty ctx default", generate_fallback_qa("anything?", ""), "I don't have enough information in this floor plan to answer that accurately.")

print("\n== generate_human_readable_review ==")
review_no = generate_human_readable_review(FLOOR_PLAN, [])
assert_true("no-issues review has room count", "5" in review_no)
review = generate_human_readable_review(FLOOR_PLAN, issues)
assert_true("review with issues non-empty", len(review) > 0)
assert_true("review ends with revisions", "revisions" in review.lower())

print("\n== prompt_builder ==")
prompt = build_prompt(FLOOR_PLAN, issues)
assert_true("prompt has room names", "Master Bedroom" in prompt)
assert_true("prompt has INSTRUCTIONS", "INSTRUCTIONS" in prompt)
assert_true("prompt has severities", "HIGH" in prompt or "MEDIUM" in prompt)
qa_p = build_qa_prompt("Fix the bathroom?", "Some context.")
assert_true("qa prompt has question", "Fix the bathroom?" in qa_p)
assert_true("qa prompt has context", "Some context." in qa_p)
qa_p2 = build_qa_prompt("Fix the bathroom?", "")
assert_true("qa no ctx skips block", "Floor Plan Context" not in qa_p2)

print("\n== report_generator ==")
from models import AnalysisResult, Suggestion
result = AnalysisResult(
    issues=issues, ai_recommendations="Test.",
    top_suggestions=[Suggestion(issue="Guest Bedroom has no windows.", improvement="Add a window.")],
    overall_score=score, room_scores=room_scores
)
tmp = "test_report_TEMP.json"
generate_json_report(result, tmp)
with open(tmp) as f:
    data = json.load(f)
assert_eq("report issue count", len(data["issues"]), 6)
assert_eq("report score", data["overall_score"], 15)
os.remove(tmp)
ok("report file written and cleaned")

print("\n=== All characterization tests complete ===\n")
