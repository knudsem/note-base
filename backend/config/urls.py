from django.http import JsonResponse
from django.urls import include, path

urlpatterns = [
    path("", include("workspaces.urls")),
    path("", include("notes.urls")),
]


def handler404(request, exception=None):
    return JsonResponse(
        {"error": "NotFoundError", "message": "Resource not found."},
        status=404,
    )
