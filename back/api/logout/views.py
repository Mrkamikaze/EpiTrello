from django.contrib.auth import logout
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from django.views.decorators.csrf import csrf_exempt

class UserLogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @csrf_exempt
    def post(self, request):
        logout(request)
        return Response({"message": "successfuly logged out"},
                    status=status.HTTP_200_OK)
