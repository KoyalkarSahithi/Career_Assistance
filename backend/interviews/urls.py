from django.urls import path
from . import views

urlpatterns = [
    path('generate-questions/', views.generate_questions,    name='generate-questions'),
    path('mock/start/',         views.start_mock_interview,  name='mock-start'),
    path('mock/respond/',       views.respond_to_interview,  name='mock-respond'),
    path('mock/<int:session_id>/report/', views.session_report, name='session-report'),
]
