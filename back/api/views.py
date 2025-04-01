from django.shortcuts import render

from django.http import JsonResponse, HttpResponse, FileResponse, Http404
# Create your views here.

from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.response import Response
from rest_framework.views import APIView


def csrf(request):
    return JsonResponse({'csrfToken': get_token(request)})

def ping(request):
    if request.method == "GET":
        return JsonResponse({"message": "pong"})
    return JsonResponse({"forbidden request": "not a GET"})

@method_decorator(csrf_exempt, name='dispatch')
class MyView(APIView):
    def options(self, request, *args, **kwargs):
        return Response(status=200)