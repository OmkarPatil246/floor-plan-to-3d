from typing import List, Optional
from models import FloorPlan, Issue

_CONVERSATIONAL = frozenset(["hi", "hello", "hey", "thanks", "thank you", "okay", "ok", "sure", "cool", "got it"])

def is_conversational(question: str) -> bool:
    q = ''.join(c for c in question.lower().strip() if c.isalnum() or c.isspace())
    return q in _CONVERSATIONAL

def retrieve_context(question: str, floor_plan: Optional[FloorPlan], issues: Optional[List[Issue]]) -> str:
    if not floor_plan:
        return ""

    q = question.lower()

    # Direct room-name / room-type match
    relevant_rooms = [r for r in floor_plan.rooms if r.name.lower() in q or r.roomType.lower() in q]

    # Concept match when no direct room found
    if not relevant_rooms:
        if any(w in q for w in ("window", "light", "sun", "ventil", "air")):
            relevant_rooms = [r for r in floor_plan.rooms if r.windows == 0] or \
                             [r for r in floor_plan.rooms if r.windows <= 1]
        elif any(w in q for w in ("door", "privacy", "entrance")):
            relevant_rooms = [r for r in floor_plan.rooms if r.doors > 1]
        elif any(w in q for w in ("small", "area", "space", "size")):
            relevant_rooms = [r for r in floor_plan.rooms if r.area < 100]
        else:
            relevant_rooms = list(floor_plan.rooms)

    relevant_room_names = {r.name for r in relevant_rooms}
    relevant_issues = []
    if issues:
        for issue in issues:
            if (issue.room in relevant_room_names
                    or issue.room.lower() in q
                    or (any(w in q for w in ("window", "light", "sun")) and ("window" in issue.problem.lower() or "light" in issue.reason.lower()))
                    or (any(w in q for w in ("door", "privacy")) and "door" in issue.problem.lower())):
                relevant_issues.append(issue)

    parts = []
    if relevant_rooms:
        parts.append("Room Information:\n")
        for r in relevant_rooms[:5]:
            parts.append(f"- {r.name}: Area={r.area} sqft, Doors={r.doors}, Windows={r.windows}, Orientation={r.orientation}.\n")

    if relevant_issues:
        parts.append("\nDetected Issues and Recommendations:\n")
        seen = {}
        for i in relevant_issues:
            seen.setdefault(f"{i.room}_{i.problem}", i)
        for i in list(seen.values())[:5]:
            parts.append(f"- Issue in {i.room}: {i.problem}. Recommendation: {i.reason}\n")

    return "".join(parts).strip()

def generate_fallback_qa(question: str, context: str) -> str:
    """Template-based deterministic response when Qwen is unavailable."""
    if not context:
        return "I don't have enough information in this floor plan to answer that accurately."

    q = question.lower()
    issues_info, rooms_info = [], []

    for line in context.split('\n'):
        if line.startswith("- Issue in "):
            issues_info.append(line.removeprefix("- Issue in "))
        elif line.startswith("- ") and "Area=" in line:
            rooms_info.append(line.removeprefix("- "))

    if any(w in q for w in ("window", "light", "sun", "ventil")):
        rel = [i for i in issues_info if "window" in i.lower() or "light" in i.lower()]
        if rel:
            return f"Focus on these areas: {rel[0]}. Improving windows here will help with natural light and ventilation."
        if rooms_info:
            return f"{rooms_info[0].split(':')[0]} has limited natural light. Adding a window or increasing window area can improve daylight."

    if any(w in q for w in ("door", "privacy")):
        rel = [i for i in issues_info if "door" in i.lower()]
        if rel:
            return f"Privacy concern: {rel[0]}. Consider reducing unnecessary openings."

    if any(w in q for w in ("small", "area", "size")):
        rel = [i for i in issues_info if "small" in i.lower()]
        if rel:
            return f"Space issue: {rel[0]}. You may need to adjust the layout to increase usability."

    if issues_info:
        return f"Based on the rules: {issues_info[0]}."
    if rooms_info:
        return f"Regarding your question, here is what I see: {rooms_info[0]}."

    return "I don't have enough specific information in this floor plan to answer that accurately."

def generate_human_readable_review(floor_plan: FloorPlan, issues: List[Issue]) -> str:
    """Clean, professional, deterministic design review without AI."""
    num_rooms = len(floor_plan.rooms)

    if not issues:
        return (
            f"This floor plan features a cohesive arrangement of {num_rooms} rooms. "
            "The overall layout is functional and meets basic architectural standards. "
            "No major design issues were detected during the analysis. "
            "It should provide a comfortable and efficient living environment."
        )

    light_rooms, space_rooms, door_rooms = [], [], []
    for issue in issues:
        prob = issue.problem.lower()
        room_name = issue.room.title()
        if "window" in prob or "light" in prob:
            if room_name not in light_rooms:
                light_rooms.append(room_name)
        elif "door" in prob or "privacy" in prob or "entrance" in prob:
            if room_name not in door_rooms:
                door_rooms.append(room_name)
        elif "small" in prob or "area" in prob:
            if room_name not in space_rooms:
                space_rooms.append(room_name)

    concerns = []
    if light_rooms:
        concerns.append(f"limited natural light or ventilation in the {', '.join(light_rooms)}")
    if space_rooms:
        concerns.append(f"insufficient floor space in the {', '.join(space_rooms)}")
    if door_rooms:
        concerns.append(f"privacy and traffic flow issues caused by excessive doors in the {', '.join(door_rooms)}")

    review = (
        f"This floor plan consists of {num_rooms} rooms with a generally workable base layout. "
        "However, the architectural analysis has identified a few key areas that require improvement "
        "for optimal comfort and flow. Specifically, the main concerns revolve around "
    )

    if not concerns:
        review += "several minor layout inefficiencies. "
    elif len(concerns) == 1:
        review += concerns[0] + ". "
    elif len(concerns) == 2:
        review += concerns[0] + " as well as " + concerns[1] + ". "
    else:
        review += ", ".join(concerns[:-1]) + ", and " + concerns[-1] + ". "

    review += "Addressing these specific points will significantly enhance the overall livability of the design. We recommend reviewing the detailed issue list below to guide your revisions."
    return review
