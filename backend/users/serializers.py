from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    user_type = serializers.ChoiceField(choices=Profile.USER_TYPES)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'first_name', 'last_name', 'user_type']
    
    def create(self, validated_data):
        user_type = validated_data.pop('user_type')
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        
        # Update profile with user type
        profile = user.profile
        profile.user_type = user_type
        profile.save()
        
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.CharField(source='user.email')
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    
    class Meta:
        model = Profile
        fields = ['username', 'email', 'first_name', 'last_name', 'user_type', 'trust_score', 'skills', 'level', 'xp_points']