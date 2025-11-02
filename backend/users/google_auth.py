from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken
import requests

@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Handle Google OAuth authentication and return JWT tokens
    """
    access_token = request.data.get('access_token')
    
    if not access_token:
        return Response({'error': 'Access token is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Verify token with Google
    google_response = requests.get(
        f'https://www.googleapis.com/oauth2/v1/userinfo?access_token={access_token}'
    )
    
    if google_response.status_code != 200:
        return Response({'error': 'Invalid Google access token'}, status=status.HTTP_400_BAD_REQUEST)
    
    google_data = google_response.json()
    email = google_data['email']
    first_name = google_data.get('given_name', '')
    last_name = google_data.get('family_name', '')
    
    # Find or create user
    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        # Create new user
        username = email.split('@')[0]
        # Ensure username is unique
        base_username = username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1
            
        user = User.objects.create_user(
            username=username,
            email=email,
            first_name=first_name,
            last_name=last_name
        )
        # Set unused password
        user.set_unusable_password()
        user.save()
    
    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)
    
    return Response({
        'message': 'Google authentication successful',
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_type': user.profile.user_type
        },
        'tokens': {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }
    })