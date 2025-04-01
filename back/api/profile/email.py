from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .views import UserProfileView
from rest_framework.permissions import IsAuthenticated

class UserProfileEmailView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_email = request.data.get('email')
        user = request.user

        if not new_email:
            return Response(
                {"error": "the field 'email' is mandatory."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if User.objects.filter(email=new_email).exclude(id=user.id).exists():
            return Response(
                {"error": "this email has already been taken."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user.email = new_email
        user.save()

        return Response(
            {"message": "email successfully updated", "new email": user.email},
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        user = request.user

        user_data = {
            "email" : user.email,
        }
        return Response(user_data)
