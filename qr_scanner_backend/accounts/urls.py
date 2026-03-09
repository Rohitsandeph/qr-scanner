from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    UserDeactivateView,
    UserDetailView,
    UserListCreateView,
    UserReactivateView,
)

urlpatterns = [
    # Auth
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    # User management (admin only)
    path('users/', UserListCreateView.as_view(), name='user-list-create'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/deactivate/', UserDeactivateView.as_view(), name='user-deactivate'),
    path('users/<int:pk>/reactivate/', UserReactivateView.as_view(), name='user-reactivate'),
]
