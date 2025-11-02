from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile
import requests

User = get_user_model()

# Add these missing view functions:

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_profile(request):
    """Get current user profile"""
    user = request.user
    profile = user.profile
    
    return Response({
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_type': profile.user_type,
            'trust_score': profile.trust_score,
            'level': profile.level,
            'xp_points': profile.xp_points
        }
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """User registration"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    user_type = request.data.get('user_type', 'worker')

    if not username or not email or not password:
        return Response({'error': 'Username, email and password are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create user profile
        profile = user.profile
        profile.user_type = user_type
        profile.save()

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'User created successfully',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': profile.user_type
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        })

    except Exception as e:
        return Response({'error': str(e)}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    """User login"""
    username = request.data.get('username')
    password = request.data.get('password')

    if not username or not password:
        return Response({'error': 'Username and password are required'}, 
                       status=status.HTTP_400_BAD_REQUEST)

    try:
        user = User.objects.get(username=username)
        if user.check_password(password):
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            
            return Response({
                'message': 'Login successful',
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
        else:
            return Response({'error': 'Invalid credentials'}, 
                           status=status.HTTP_401_UNAUTHORIZED)
            
    except User.DoesNotExist:
        return Response({'error': 'Invalid credentials'}, 
                       status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def refresh_token(request):
    """Refresh JWT token"""
    refresh_token = request.data.get('refresh')
    
    if not refresh_token:
        return Response({'error': 'Refresh token is required'}, 
                       status=status.HTTP_400_BAD_REQUEST)
    
    try:
        refresh = RefreshToken(refresh_token)
        access_token = str(refresh.access_token)
        
        return Response({
            'access': access_token
        })
        
    except Exception as e:
        return Response({'error': 'Invalid refresh token'}, 
                       status=status.HTTP_401_UNAUTHORIZED)

# Your existing google_auth function (keep this)
@api_view(['POST'])
@permission_classes([AllowAny])
def google_auth(request):
    """
    Handle Google OAuth authentication using ID token
    """
    credential = request.data.get('credential')
    
    if not credential:
        return Response({'error': 'Google credential is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # Verify the ID token with Google
        google_response = requests.get(
            f'https://oauth2.googleapis.com/tokeninfo?id_token={credential}'
        )
        
        if google_response.status_code != 200:
            return Response({'error': 'Invalid Google token'}, status=status.HTTP_400_BAD_REQUEST)
        
        google_data = google_response.json()
        
        # Verify the audience matches your client ID
        if google_data.get('aud') != '20168939763-v261is7435m1kbu4gbtffvvr3nf5ut09.apps.googleusercontent.com':
            return Response({'error': 'Invalid token audience'}, status=status.HTTP_400_BAD_REQUEST)
        
        email = google_data.get('email')
        if not email:
            return Response({'error': 'Email not provided by Google'}, status=status.HTTP_400_BAD_REQUEST)
            
        first_name = google_data.get('given_name', '')
        last_name = google_data.get('family_name', '')
        picture = google_data.get('picture', '')
        
        # Find or create user
        try:
            user = User.objects.get(email=email)
            created = False
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
            # Set unused password for social auth users
            user.set_unusable_password()
            user.save()
            created = True
        
        # Generate JWT tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'message': 'Google authentication successful',
            'user_created': created,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'user_type': user.profile.user_type if hasattr(user, 'profile') else 'worker'
            },
            'tokens': {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        })
        
    except Exception as e:
        print(f"Google auth error: {str(e)}")
        return Response({'error': f'Authentication failed: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)