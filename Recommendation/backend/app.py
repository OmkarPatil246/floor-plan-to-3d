from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models import FloorPlan, AnalysisResult, QuestionRequest, QuestionResponse, Suggestion
from rule_engine import analyze_floor_plan
from prompt_builder import build_qa_prompt
from qwen_service import generate_recommendations
from rag_service import retrieve_context, generate_fallback_qa, generate_human_readable_review, is_conversational
from report_generator import generate_json_report

app = FastAPI(title="ArchGen 3D - Recommendation Module")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "ok", "message": "Recommendation Engine API is running"}

@app.post("/analyze", response_model=AnalysisResult)
def analyze_endpoint(floor_plan: FloorPlan):
    issues, overall_score, room_scores = analyze_floor_plan(floor_plan)

    severity_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
    seen_problems: set[str] = set()
    top_suggestions = []
    for issue in sorted(issues, key=lambda x: severity_order.get(x.severity, 3)):
        key = f"{issue.room}_{issue.problem}"
        if key not in seen_problems:
            seen_problems.add(key)
            top_suggestions.append(Suggestion(
                issue=f"{issue.room} has {issue.problem.lower()}",
                improvement=issue.reason
            ))
            if len(top_suggestions) == 3:
                break

    # Generate AI-powered recommendations using LLM if available
    ai_review = None
    
    # Build prompt for AI analysis
    from prompt_builder import build_analysis_prompt
    analysis_prompt = build_analysis_prompt(floor_plan, issues)
    
    # Try to generate AI-powered review
    ai_review = generate_recommendations(analysis_prompt)
    
    # Fallback to rule-based review if AI is unavailable
    if not ai_review:
        ai_review = generate_human_readable_review(floor_plan, issues)
    
    result = AnalysisResult(
        issues=issues,
        ai_recommendations=ai_review,
        top_suggestions=top_suggestions,
        overall_score=overall_score,
        room_scores=room_scores
    )
    generate_json_report(result)
    return result

@app.post("/ask", response_model=QuestionResponse)
def ask_endpoint(req: QuestionRequest):
    if is_conversational(req.question):
        q = req.question.lower().strip()
        if any(w in q for w in ("hi", "hello", "hey")):
            return QuestionResponse(answer="Hi there! How can I help you with your floor plan?")
        if any(w in q for w in ("thanks", "thank you")):
            return QuestionResponse(answer="You're welcome! Let me know if you need any other architectural advice.")
        return QuestionResponse(answer="Sure. Let me know what you would like to improve.")

    context = retrieve_context(req.question, req.floor_plan, req.issues)

    if not context and req.floor_plan:
        return QuestionResponse(answer="I can only answer questions related to the analyzed floor plan. Could you rephrase your question?")

    answer = generate_recommendations(build_qa_prompt(req.question, context))
    if not answer:
        answer = generate_fallback_qa(req.question, context)
    return QuestionResponse(answer=answer)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
