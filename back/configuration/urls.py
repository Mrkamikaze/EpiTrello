"""
URL configuration for configuration project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path
from api import views
from api.register.views import UserRegistrationView
from api.login.views import UserLoginView
from api.logout.views import UserLogoutView
from api.profile.email import UserProfileEmailView
from api.profile.username import UserProfileUsernameView
from api.profile.has_password import UserProfileHasPasswordView
from api.profile.change_password import UserProfileChangePasswordView
from api.profile.views import UserProfileView
from api.profile.id import UserProfileIDView
from api.Kanban.table import TableView, TableDetailView
from api.Kanban.list import ListView, allListView
from api.Kanban.ticket import TicketView, TicketAllView, TicketDetailView, TicketReorderView
from api.refresh_token import RefreshTokenView

urlpatterns = [
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', UserLogoutView.as_view(), name='logout'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('ping/', views.ping, name='ping'),
    path('admin/', admin.site.urls),
    path('csrf/', views.csrf, name='csrf'),
    path('email/', UserProfileEmailView.as_view(), name='email'),
    path('username/', UserProfileUsernameView.as_view(), name='username'),
    path('has_password/', UserProfileHasPasswordView.as_view(), name='has_password'),
    path('change_password/', UserProfileChangePasswordView.as_view(), name='change_password'),
    path('profile/', UserProfileView.as_view(), name='profile_view'),
    path('id/', UserProfileIDView.as_view(), name='ID'),
    path('kanban/table/', TableView.as_view(), name='table'),
    path('kanban/<int:board_id>/', TableDetailView.as_view(), name='table-detail'),
    path('kanban/<int:board_id>/list/', ListView.as_view(), name='list'),
    path('kanban/<int:board_id>/update/', allListView.as_view(), name='all_list'),
    path('kanban/list/<int:board_id>/', TicketAllView.as_view(), name='all_ticket'),
    path('kanban/list/<int:list_id>/reorder/', TicketReorderView.as_view(), name='all_ticket'),
    path('kanban/<int:board_id>/<int:list_id>/ticket/', TicketView.as_view(), name='ticket'),
    path('kanban/<int:board_id>/<int:list_id>/ticket/<int:id>/', TicketDetailView.as_view(), name='ticket'),
    path('refresh_token/', RefreshTokenView.as_view(), name='refresh_token'),
]
