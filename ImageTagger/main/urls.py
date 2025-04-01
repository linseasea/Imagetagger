from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path('serve-image', views.serve_image, name='serve_image'),
    path('create-text-file', views.create_text_file, name='create_text_file'),
    path('read-text-file', views.read_text_file, name='read_text_file'),
    path('save-text-file', views.save_text_file, name='save_text_file'),
    path('get-directories', views.get_directories, name='get_directories'),
    path('save-settings', views.save_settings, name='save_settings'),
    path('ai-analyze-images', views.ai_analyze_images, name='ai_analyze_images'),
]