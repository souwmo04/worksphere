from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_user, name='register'),
    path('login/', views.login_user, name='login'),
    path('profile/', views.get_user_profile, name='profile'),
    path('token/refresh/', views.refresh_token, name='token_refresh'),
    path('google/', views.google_auth, name='google_auth'),
]