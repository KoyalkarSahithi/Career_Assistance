import os
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Resume, ResumeAnalysis
from .ai_service import extract_text_from_pdf, analyze_resume_with_ai


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_resume(request):
    file = request.FILES.get('resume')
    if not file:
        return Response({'detail': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
    if not file.name.endswith('.pdf'):
        return Response({'detail': 'Only PDF files are allowed'}, status=status.HTTP_400_BAD_REQUEST)
    if file.size > 5 * 1024 * 1024:
        return Response({'detail': 'File size exceeds 5MB'}, status=status.HTTP_400_BAD_REQUEST)

    resume = Resume.objects.create(
        user=request.user,
        file=file,
        file_name=file.name,
    )

    # Extract text immediately
    resume.raw_text = extract_text_from_pdf(resume.file.path)
    resume.save()

    return Response({
        'id':          resume.id,
        'file_name':   resume.file_name,
        'upload_date': resume.upload_date,
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def analyze_resume(request, resume_id):
    resume = get_object_or_404(Resume, id=resume_id, user=request.user)

    # Always delete existing analysis and re-run so results are always fresh
    # This also fixes returning stale mock data (score 72) from before the API key was added
    ResumeAnalysis.objects.filter(resume=resume).delete()

    if not resume.raw_text:
        resume.raw_text = extract_text_from_pdf(resume.file.path)
        resume.save()

    result = analyze_resume_with_ai(resume.raw_text)
    analysis = ResumeAnalysis.objects.create(
        resume=resume,
        ats_score=result.get('ats_score', 0),
        technical_skills=result.get('technical_skills', []),
        soft_skills=result.get('soft_skills', []),
        missing_skills=result.get('missing_skills', []),
        feedback=result.get('feedback', []),
        category_scores=result.get('category_scores', {}),
    )

    return Response({
        'ats_score':        analysis.ats_score,
        'technical_skills': analysis.technical_skills,
        'soft_skills':      analysis.soft_skills,
        'missing_skills':   analysis.missing_skills,
        'feedback':         analysis.feedback,
        'category_scores':  analysis.category_scores,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def resume_history(request):
    resumes = Resume.objects.filter(user=request.user).order_by('-upload_date')
    data = []
    for r in resumes:
        item = {'id': r.id, 'file_name': r.file_name, 'upload_date': r.upload_date, 'ats_score': None}
        try:
            item['ats_score'] = r.resumeanalysis.ats_score
        except ResumeAnalysis.DoesNotExist:
            pass
        data.append(item)
    return Response(data)
