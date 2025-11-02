from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse

def home_test(request):
    return HttpResponse("WorkSphere API is running!")

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('accounts/', include('allauth.urls')),  # Keep this
    path('', home_test, name='home'),  # Add a test home page
]