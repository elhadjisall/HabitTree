"""
URL configuration for habittree project.
"""
from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponseRedirect
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from api.serializers import CustomTokenObtainPairSerializer

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

def redirect_to_frontend(request):
    """Redirect root URL to frontend development server"""
    return HttpResponseRedirect('http://localhost:5173/')

urlpatterns = [
    path('', redirect_to_frontend, name='home'),
    path('admin/', admin.site.urls),
    path('api/auth/token/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/', include('api.urls')),
]

