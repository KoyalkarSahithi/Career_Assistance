from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model  = User
        fields = ('id', 'username', 'email', 'password', 'first_name', 'last_name')
        extra_kwargs = {
            'username': {'required': False, 'validators': []},
        }

    def validate(self, attrs):
        import re
        full_name = attrs.get('username', '').strip()
        email = attrs.get('email', '').strip()

        # Split full name into first and last names
        if full_name:
            parts = full_name.split(' ', 1)
            attrs['first_name'] = parts[0]
            if len(parts) > 1:
                attrs['last_name'] = parts[1]

        # Generate a safe username (only letters, numbers, _, ., -, no spaces)
        safe_username = re.sub(r'[^a-zA-Z0-9_.-]', '', full_name)
        if not safe_username:
            safe_username = email.split('@')[0]
            safe_username = re.sub(r'[^a-zA-Z0-9_.-]', '', safe_username)

        # Ensure username uniqueness in the database
        base_username = safe_username if safe_username else "user"
        username = base_username
        counter = 1
        while User.objects.filter(username=username).exists():
            username = f"{base_username}{counter}"
            counter += 1

        attrs['username'] = username
        return attrs

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model  = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined')
        read_only_fields = ('id', 'date_joined')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=8)
