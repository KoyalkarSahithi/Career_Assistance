from django.contrib.auth import get_user_model
from django.db import models

User = get_user_model()


class Resume(models.Model):
    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resumes')
    file        = models.FileField(upload_to='resumes/')
    file_name   = models.CharField(max_length=255)
    upload_date = models.DateTimeField(auto_now_add=True)
    raw_text    = models.TextField(blank=True)

    class Meta:
        ordering = ['-upload_date']

    def __str__(self):
        return f"{self.user.email} — {self.file_name}"


class ResumeAnalysis(models.Model):
    resume           = models.OneToOneField(Resume, on_delete=models.CASCADE)
    ats_score        = models.IntegerField(default=0)
    technical_skills = models.JSONField(default=list)
    soft_skills      = models.JSONField(default=list)
    missing_skills   = models.JSONField(default=list)
    feedback         = models.JSONField(default=list)
    category_scores  = models.JSONField(default=dict)
    created_at       = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Analysis for {self.resume.file_name} — ATS: {self.ats_score}"
