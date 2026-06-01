from django.db.models import Avg
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from resumes.models import Resume, ResumeAnalysis
from interviews.models import InterviewSession


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard(request):
    user = request.user

    resumes   = Resume.objects.filter(user=user).order_by('-upload_date')
    sessions  = InterviewSession.objects.filter(user=user).order_by('-session_date')

    # ATS history
    ats_history = []
    for r in resumes:
        try:
            analysis = r.resumeanalysis
            ats_history.append({
                'date':  r.upload_date.strftime('%b %d'),
                'score': analysis.ats_score,
            })
        except ResumeAnalysis.DoesNotExist:
            pass

    latest_ats = ats_history[0]['score'] if ats_history else None
    ats_change = None
    if len(ats_history) >= 2:
        ats_change = ats_history[0]['score'] - ats_history[1]['score']

    avg_score = sessions.aggregate(avg=Avg('overall_score'))['avg']

    recent_sessions = []
    for s in sessions[:5]:
        recent_sessions.append({
            'session_date':     s.session_date,
            'technical_score':  s.technical_score,
            'comm_score':       s.communication_score,
            'overall':          s.overall_score,
        })

    return Response({
        'resume_count':      resumes.count(),
        'latest_ats':        latest_ats,
        'ats_change':        ats_change,
        'ats_history':       list(reversed(ats_history)),   # oldest first
        'interview_count':   sessions.count(),
        'avg_interview_score': round(avg_score) if avg_score else None,
        'recent_sessions':   recent_sessions,
    })
