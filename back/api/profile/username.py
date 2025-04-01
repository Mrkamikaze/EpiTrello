from rest_framework.response import Response
from rest_framework.views import APIView

from .views import UserProfileView
from rest_framework.permissions import IsAuthenticated

class UserProfileUsernameView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        user_data = {
            "username" : user.username,
        }
        return Response(user_data)
