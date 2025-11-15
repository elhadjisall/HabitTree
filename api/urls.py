from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, HabitViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'habits', HabitViewSet, basename='habit')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', lambda request: __import__('rest_framework.response', fromlist=['Response']).Response({'status': 'OK'})),
]

