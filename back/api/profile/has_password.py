from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .views import UserProfileView
from rest_framework.permissions import IsAuthenticated

class UserProfileHasPasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        user_data = {
            "has_password" : bool(user.password),
        }
        return Response(user_data)
