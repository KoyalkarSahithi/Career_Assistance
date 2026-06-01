from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from resumes.models import Resume
from resumes.ai_service import generate_interview_questions, conduct_mock_interview
from .models import InterviewSession


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_questions(request):
    resume_id  = request.data.get('resume_id')
    role       = request.data.get('role', 'Software Engineer')
    difficulty = request.data.get('difficulty', 'Medium')

    resume_text = ''
    if resume_id:
        try:
            resume = Resume.objects.get(id=resume_id, user=request.user)
            resume_text = resume.raw_text
        except Resume.DoesNotExist:
            pass

    questions = generate_interview_questions(resume_text, role, difficulty)
    return Response({'questions': questions})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def start_mock_interview(request):
    resume_id   = request.data.get('resume_id')
    resume_text = ''

    if resume_id:
        try:
            resume = Resume.objects.get(id=resume_id, user=request.user)
            resume_text = resume.raw_text
        except Resume.DoesNotExist:
            pass

    opening_msg = {
        'role': 'ai',
        'content': (
            "Hello! I'm your AI interviewer today. I'll ask you a series of questions to assess your technical skills and communication. "
            "Take your time with each answer — quality matters more than speed. Let's begin!\n\n"
            "**Question 1:** Tell me a little about yourself and what excites you most about your field."
        ),
    }

    session = InterviewSession.objects.create(
        user=request.user,
        messages=[opening_msg],
        resume_text=resume_text,
    )

    return Response({
        'session_id': session.id,
        'messages':   session.messages,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_interview(request):
    session_id = request.data.get('session_id')
    user_msg   = request.data.get('message', '').strip()

    if not session_id or not user_msg:
        return Response({'detail': 'session_id and message are required'}, status=status.HTTP_400_BAD_REQUEST)

    session = get_object_or_404(InterviewSession, id=session_id, user=request.user)

    # Add user message
    session.messages.append({'role': 'user', 'content': user_msg})

    # Get AI response
    result = conduct_mock_interview(session.messages, session.resume_text)

    ai_msg = {'role': 'ai', 'content': result['response']}
    session.messages.append(ai_msg)

    if result.get('is_complete') and result.get('report'):
        report = result['report']
        session.technical_score     = report.get('technical_score')
        session.communication_score = report.get('communication_score')
        session.overall_score       = report.get('overall_score')
        session.feedback            = report.get('feedback', '')
        session.strengths           = report.get('strengths', [])
        session.improvements        = report.get('improvements', [])
        session.is_complete         = True
        session.save()
        return Response({
            'response':    result['response'],
            'is_complete': True,
            'report': {
                'technical_score':     session.technical_score,
                'communication_score': session.communication_score,
                'overall_score':       session.overall_score,
                'feedback':            session.feedback,
                'strengths':           session.strengths,
                'improvements':        session.improvements,
            },
        })

    session.save()
    return Response({'response': result['response'], 'is_complete': False})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def session_report(request, session_id):
    session = get_object_or_404(InterviewSession, id=session_id, user=request.user)
    return Response({
        'technical_score':     session.technical_score,
        'communication_score': session.communication_score,
        'overall_score':       session.overall_score,
        'feedback':            session.feedback,
        'strengths':           session.strengths,
        'improvements':        session.improvements,
    })
