from django.urls import path
from . import views

urlpatterns = [
    path('register/',        views.register,         name='auth-register'),
    path('login/',           views.login_view,        name='auth-login'),
    path('profile/',         views.profile,           name='auth-profile'),
    path('change-password/', views.change_password,   name='auth-change-password'),
]
