from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from .validate_password import validate_new_password

class UserProfileChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        new_password = request.data.get('password')
        user = request.user

        if not new_password:
            return Response(
                {"error": "the field 'password' is mandatory."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            validate_new_password(new_password)
        except ValidationError as e:
            return Response(
        {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST,
        )
        user.password = new_password
        user.save()

        return Response(
            {"message": "Successfully updated password", "new password": user.password},
            status=status.HTTP_200_OK,
        )