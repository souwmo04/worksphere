from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Import the google_auth function directly
from .views import get_user_profile, register_user, login_user
from .google_auth import google_auth

urlpatterns = [
    path('register/', register_user, name='register'),
    path('login/', login_user, name='login'),
    path('google/', google_auth, name='google-auth'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', get_user_profile, name='profile'),
]