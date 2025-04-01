from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login
from rest_framework_simplejwt.tokens import RefreshToken

class UserLoginView(APIView):
    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        print("Datas are", request)
        user = authenticate(request=request, username=email, password=password)
        if user is not None:
            login(request, user)
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    "message": "The user is logged in",
                    "user": {
                        "email": user.email,
                    },
                    "token": str(refresh.access_token),
                },
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"error": "Invalid password or email"},
                status=status.HTTP_401_UNAUTHORIZED
            )