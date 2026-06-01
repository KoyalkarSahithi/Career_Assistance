from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class InterviewSession(models.Model):
    user                = models.ForeignKey(User, on_delete=models.CASCADE, related_name='interview_sessions')
    session_date        = models.DateTimeField(auto_now_add=True)
    messages            = models.JSONField(default=list)   # [{role, content}]
    technical_score     = models.IntegerField(null=True, blank=True)
    communication_score = models.IntegerField(null=True, blank=True)
    overall_score       = models.IntegerField(null=True, blank=True)
    feedback            = models.TextField(blank=True)
    strengths           = models.JSONField(default=list)
    improvements        = models.JSONField(default=list)
    is_complete         = models.BooleanField(default=False)
    resume_text         = models.TextField(blank=True)   # snapshot at session start

    class Meta:
        ordering = ['-session_date']

    def __str__(self):
        return f"Session {self.id} — {self.user.email}"
