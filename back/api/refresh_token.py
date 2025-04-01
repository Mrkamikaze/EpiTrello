from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import AuthenticationFailed
from datetime import timedelta
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User

class RefreshTokenView(APIView):
    def post(self, request):
        refresh_token = request.data.get('refreshToken')

        if not refresh_token:
            raise AuthenticationFailed('Refresh token missing')

        try:
            token = RefreshToken(refresh_token)
            new_access_token = token.access_token

            new_refresh_token = RefreshToken.for_user(token.user)

            return Response({
                'token': str(new_access_token),
                'refreshToken': str(new_refresh_token)
            })

        except Exception as e:
            raise AuthenticationFailed('Invalid refresh token')