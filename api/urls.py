from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .views import UserViewSet, HabitViewSet, RewardViewSet, UserRewardViewSet, FriendViewSet

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'habits', HabitViewSet, basename='habit')
router.register(r'rewards', RewardViewSet, basename='reward')
router.register(r'user-rewards', UserRewardViewSet, basename='user-reward')
router.register(r'friends', FriendViewSet, basename='friend')


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'OK'})


urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health'),
]

