from models import Issue, FloorPlan
from typing import List, Optional

_HEADER = (
    "You are a licensed residential architect with over 20 years of experience reviewing a residential floor plan drawing.\n"
    "NEVER mention AI, and NEVER say 'As an AI...', 'Based on the provided JSON...', or 'According to the data...'. "
    "Write naturally and professionally as if you personally reviewed the architectural blueprint drawing.\n\n"
)

_QA_HEADER = (
    "You are a helpful residential floor-plan advisor.\n"
    "NEVER mention AI, and NEVER say 'As an AI...', 'Based on the provided JSON...', or 'According to the data...'.\n\n"
)

def build_prompt(floor_plan: FloorPlan, issues: List[Issue]) -> str:
    parts = [_HEADER]
    
    # Overall floor plan context
    total_rooms = len(floor_plan.rooms)
    total_windows = sum(room.windows for room in floor_plan.rooms)
    total_doors = sum(room.doors for room in floor_plan.rooms)
    total_area = sum(room.area for room in floor_plan.rooms)
    
    parts.append(f"Overall Floor Plan:\n")
    parts.append(f"- Total Rooms: {total_rooms}\n")
    parts.append(f"- Total Area: {total_area:.1f} sq units\n")
    parts.append(f"- Total Windows: {total_windows} (Natural light sources)\n")
    parts.append(f"- Total Doors: {total_doors} (Access points)\n\n")
    
    parts.append("Room Breakdown:\n")
    for room in floor_plan.rooms:
        ventilation = "Good" if room.windows > 0 else "Poor"
        sunlight = "Excellent" if room.windows >= 2 else ("Good" if room.windows == 1 else "Poor")
        parts.append(
            f"- {room.name} ({room.roomType}): "
            f"Area={room.area:.1f} sq units, "
            f"Doors={room.doors}, "
            f"Windows={room.windows}, "
            f"Ventilation={ventilation}, "
            f"Sunlight={sunlight}\n"
        )

    parts.append("\nIdentified Architectural Observations:\n")
    if not issues:
        parts.append("No architectural non-compliances identified.\n")
    else:
        for issue in issues:
            parts.append(f"- {issue.room}: {issue.problem} (Severity: {issue.severity})\n")

    parts.append(
        "\nINSTRUCTIONS:\n"
        "Write ONE concise, cohesive, and professional architectural design review paragraph.\n"
        "STRICT RULES:\n"
        "1. Maximum 3-5 short sentences.\n"
        "2. Write in ONE fluid paragraph. Do NOT use bullet points, numbered lists, markdown, headings, asterisks, or hash symbols.\n"
        "3. Tone: Professional but easy for a normal homeowner to understand. Avoid technical jargon.\n"
        "4. Do NOT repeat the same issue multiple times.\n"
        "5. Clearly explain what is good (e.g., overall layout, room distribution) and what needs improvement (e.g., ventilation, sunlight).\n"
        "6. Consider the overall floor plan flow, room connectivity, and functionality.\n"
        "7. Absolutely NO AI conversational filler, intro, or outro.\n"
    )
    return "".join(parts)

# Alias for backward compatibility
def build_analysis_prompt(floor_plan: FloorPlan, issues: List[Issue]) -> str:
    """Build a prompt for complete floor plan analysis. Alias for build_prompt."""
    return build_prompt(floor_plan, issues)

def build_qa_prompt(question: str, context: str) -> str:
    parts = [_QA_HEADER]
    if context:
        parts.append(f"Floor Plan Context:\n{context}\n")
    parts.append(
        f"\nUser Question: {question}\n\n"
        "STRICT INSTRUCTIONS:\n"
        "1. Answer only using the provided floor-plan context. Do not invent information.\n"
        "2. Answer the user's exact question directly.\n"
        "3. Use simple language that a normal homeowner can understand. Keep it practical.\n"
        "4. Use plain text only. Do not use Markdown, *, **, -, #, headings, or unnecessary formatting.\n"
        "5. Usually answer in 1-3 sentences (Maximum 50 words total).\n"
        "6. Do not repeat the entire analysis. Never summarize unless asked.\n"
    )
    return "".join(parts)
