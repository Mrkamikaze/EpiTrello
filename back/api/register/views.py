from django.contrib.auth import authenticate, login
from drf_yasg import openapi
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.response import Response
from .serializers import UserSerializer
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken

class UserRegistrationView(APIView):
    @csrf_exempt
    def post(self, request):
        serializer = UserSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()

            # Authentifier l'utilisateur (Django utilise `username` par défaut, donc vérifie si c'est `email`)
            authenticated_user = authenticate(request, username=user.email, password=request.data['password'])

            if authenticated_user is not None:
                login(request, authenticated_user)

                # Générer un token JWT après l'inscription
                refresh = RefreshToken.for_user(authenticated_user)
                print("created")
                return Response(
                    {
                        "message": "The user has been created",
                        "user": serializer.data,
                        "token": str(refresh.access_token)  # Renvoie le token au frontend
                    },
                    status=status.HTTP_201_CREATED
                )
                print("Error details:", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)