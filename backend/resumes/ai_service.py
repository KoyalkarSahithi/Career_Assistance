import json
import re
import pdfplumber
import requests
from openai import OpenAI
from django.conf import settings


def _get_client():
    """Create a fresh OpenAI client for OpenRouter each call so the key is always read from settings."""
    key = settings.OPENROUTER_API_KEY
    if not key:
        raise ValueError('OPENROUTER_API_KEY is not set in .env')
    return OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=key,
        default_headers={
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Resume Analyzer",
        }
    )


def _call_openrouter_api(messages: list, temperature: float = 0.3, max_tokens: int = 1500) -> str:
    """Helper to call OpenRouter API. Tries OpenAI SDK first, falls back to direct requests if needed."""
    key = settings.OPENROUTER_API_KEY
    model = settings.OPENROUTER_MODEL
    
    # Try OpenAI client first
    try:
        client = _get_client()
        response = client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f'[AI] OpenAI SDK call failed ({type(e).__name__}: {e}). Trying direct HTTP fallback...')
        
        # Direct HTTP fallback to bypass proxy/SDK constructor bugs
        try:
            url = "https://openrouter.ai/api/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:8000",
                "X-Title": "Resume Analyzer",
            }
            payload = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            res = requests.post(url, headers=headers, json=payload, timeout=30)
            if res.status_code == 200:
                print('[AI] Direct HTTP fallback succeeded!')
                return res.json()['choices'][0]['message']['content'].strip()
            else:
                print(f'[AI] Direct HTTP fallback failed with status {res.status_code}: {res.text}')
                raise ValueError(f"HTTP status {res.status_code}")
        except Exception as ex:
            print(f'[AI] Direct HTTP fallback exception: {ex}')
            raise ex


def extract_text_from_pdf(file_path: str) -> str:
    """Extract plain text from a PDF file using pdfplumber."""
    text = ''
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    text += page_text + '\n'
    except Exception as e:
        print(f'PDF extraction error: {e}')
    return text.strip()


def analyze_resume_with_ai(resume_text: str) -> dict:
    """Call OpenRouter to analyze a resume and return structured data."""
    key = settings.OPENROUTER_API_KEY
    if not key or key == 'your-openai-api-key-here':
        print('[AI] No valid API key — returning mock analysis')
        return _mock_analysis()

    prompt = f"""
You are an expert resume analyzer and ATS specialist.
Analyze the following resume and return a JSON object with exactly these fields:

{{
  "technical_skills": ["list", "of", "technical", "skills"],
  "soft_skills": ["communication", "teamwork", ...],
  "missing_skills": ["skills commonly expected but missing for the apparent role"],
  "ats_score": <integer 0-100>,
  "category_scores": {{
    "Contact & Summary": <int 0-100>,
    "Work Experience": <int 0-100>,
    "Education": <int 0-100>,
    "Skills Section": <int 0-100>,
    "Projects": <int 0-100>,
    "Formatting & Keywords": <int 0-100>
  }},
  "feedback": [
    {{"type": "positive", "title": "...", "message": "..."}},
    {{"type": "warning", "title": "...", "message": "..."}},
    {{"type": "negative", "title": "...", "message": "..."}}
  ]
}}

Rules:
- ATS score must consider keyword density, section completeness, formatting, and relevance.
- Provide at least 3 feedback items mixing positive and constructive criticism.
- Missing skills should be relevant to the candidate's apparent target role.
- Return ONLY the JSON, no markdown code block.

Resume text:
{resume_text[:4000]}
"""
    try:
        content = _call_openrouter_api([{'role': 'user', 'content': prompt}], temperature=0.3, max_tokens=800)
        # Strip markdown if present
        content = re.sub(r'^```json\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        return json.loads(content)
    except Exception as e:
        print(f'[AI] OpenRouter analysis error: {e}')
        return _mock_analysis()


def _mock_analysis() -> dict:
    """Return a mock analysis when OpenAI key is not set."""
    return {
        'technical_skills': ['Python', 'JavaScript', 'SQL', 'React', 'Django'],
        'soft_skills': ['Communication', 'Problem Solving', 'Teamwork', 'Leadership'],
        'missing_skills': ['Docker', 'Kubernetes', 'CI/CD', 'AWS'],
        'ats_score': 72,
        'category_scores': {
            'Contact & Summary': 80,
            'Work Experience': 75,
            'Education': 90,
            'Skills Section': 70,
            'Projects': 65,
            'Formatting & Keywords': 70,
        },
        'feedback': [
            {'type': 'positive', 'title': 'Good Education Section', 'message': 'Your education section is well-structured and easy to read.'},
            {'type': 'warning',  'title': 'Add a Professional Summary', 'message': 'A 2-3 sentence professional summary at the top would improve ATS scores significantly.'},
            {'type': 'negative', 'title': 'Missing Cloud Skills', 'message': 'Cloud platform experience (AWS/GCP/Azure) is highly expected for this role.'},
            {'type': 'warning',  'title': 'Quantify Achievements', 'message': 'Add metrics to your experience bullets, e.g., "Reduced load time by 40%".'},
        ],
    }


def generate_interview_questions(resume_text: str, role: str, difficulty: str) -> list:
    """Generate categorized interview questions using OpenRouter."""
    if not settings.OPENROUTER_API_KEY:
        return _mock_questions(role)

    prompt = f"""
You are an expert technical interviewer. Generate exactly 12 interview questions for a {role} candidate.
Difficulty level: {difficulty}.
Tailor the technical and project-based questions to the resume content.

Return a JSON array with this structure:
[
  {{"category": "HR", "question": "...", "hint": "Key points to address..."}},
  {{"category": "Technical", "question": "...", "hint": "..."}},
  {{"category": "Project-Based", "question": "...", "hint": "..."}}
]

Distribute: 4 HR questions, 5 Technical questions, 3 Project-Based questions.
Return ONLY the JSON array.

Resume:
{resume_text[:2000]}
"""
    try:
        content = _call_openrouter_api([{'role': 'user', 'content': prompt}], temperature=0.7, max_tokens=800)
        content = re.sub(r'^```json\s*', '', content)
        content = re.sub(r'\s*```$', '', content)
        return json.loads(content)
    except Exception as e:
        print(f'[AI] OpenRouter question generation error: {e}')
        return _mock_questions(role)


def _mock_questions(role: str) -> list:
    return [
        {'category': 'HR',           'question': 'Tell me about yourself and your journey into tech.',           'hint': 'Brief background, key achievements, why this role.'},
        {'category': 'HR',           'question': 'Where do you see yourself in 5 years?',                       'hint': 'Align with company growth and your personal goals.'},
        {'category': 'HR',           'question': 'Describe a time you handled a conflict with a teammate.',     'hint': 'Use STAR method: Situation, Task, Action, Result.'},
        {'category': 'HR',           'question': 'Why do you want to work for us?',                            'hint': 'Research the company, align with their values.'},
        {'category': 'Technical',    'question': f'What are the key principles of {role} you follow daily?',   'hint': 'Mention relevant design patterns or best practices.'},
        {'category': 'Technical',    'question': 'Explain the difference between REST and GraphQL.',            'hint': 'Focus on use cases, advantages, and trade-offs.'},
        {'category': 'Technical',    'question': 'How do you ensure code quality in your projects?',           'hint': 'Mention testing, code reviews, linting, CI/CD.'},
        {'category': 'Technical',    'question': 'What is the time complexity of binary search?',              'hint': 'O(log n) — explain why with the divide-and-conquer approach.'},
        {'category': 'Technical',    'question': 'How would you design a URL shortening service?',             'hint': 'Hash function, database schema, redirect flow.'},
        {'category': 'Project-Based','question': 'Walk me through your most complex project.',                  'hint': 'Architecture decisions, challenges, what you learned.'},
        {'category': 'Project-Based','question': 'What was the biggest technical challenge in your projects?', 'hint': 'Specific problem, your approach, outcome.'},
        {'category': 'Project-Based','question': 'How did you handle performance issues in your projects?',    'hint': 'Profiling, caching, query optimization examples.'},
    ]


def conduct_mock_interview(messages: list, resume_text: str) -> dict:
    """Process one turn of a mock interview and return AI response."""
    if not settings.OPENROUTER_API_KEY:
        return {'response': 'Good answer! Let me ask you the next question. Can you explain how you approach debugging a complex production issue?', 'is_complete': False}

    system_prompt = f"""
You are a professional interviewer conducting a technical job interview.
You have the candidate's resume context below.
Ask one question at a time. After they answer, evaluate briefly, then ask the next question.
After 6–8 exchanges, end the interview by saying exactly: "INTERVIEW_COMPLETE"
Then provide a JSON report structured as:
{{
  "technical_score": <int 0-100>,
  "communication_score": <int 0-100>,
  "overall_score": <int 0-100>,
  "feedback": "overall feedback paragraph",
  "strengths": ["strength1", "strength2"],
  "improvements": ["area1", "area2"]
}}

Resume context:
{resume_text[:1500]}
"""
    try:
        api_messages = [{'role': 'system', 'content': system_prompt}]
        for m in messages:
            api_messages.append({'role': m['role'] if m['role'] != 'ai' else 'assistant', 'content': m['content']})

        content = _call_openrouter_api(api_messages, temperature=0.7, max_tokens=500)

        if 'INTERVIEW_COMPLETE' in content:
            # Extract the report JSON
            try:
                json_match = re.search(r'\{.*\}', content, re.DOTALL)
                report = json.loads(json_match.group()) if json_match else _mock_report()
            except Exception:
                report = _mock_report()
            return {'response': 'Thank you for your time! Your interview is complete. Check your report below.', 'is_complete': True, 'report': report}

        return {'response': content, 'is_complete': False}
    except Exception as e:
        print(f'[AI] OpenRouter mock interview error: {e}')
        return {'response': 'Good answer! Can you tell me about a challenging project you worked on?', 'is_complete': False}


def _mock_report() -> dict:
    return {
        'technical_score':     75,
        'communication_score': 80,
        'overall_score':       77,
        'feedback': 'You demonstrated solid technical knowledge and communicated clearly. Focus on providing more quantified examples from your experience.',
        'strengths':     ['Clear communication', 'Good problem-solving approach', 'Strong foundational knowledge'],
        'improvements':  ['Provide more specific examples with metrics', 'Deeper knowledge of system design', 'Practice STAR method for behavioral questions'],
    }
