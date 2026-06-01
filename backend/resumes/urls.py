from django.urls import path
from . import views

urlpatterns = [
    path('upload/',              views.upload_resume,  name='resume-upload'),
    path('<int:resume_id>/analyze/', views.analyze_resume, name='resume-analyze'),
    path('history/',             views.resume_history,  name='resume-history'),
]
