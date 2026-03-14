from django.contrib import admin
from django.urls import path, include, re_path
from django.utils.cache import add_never_cache_headers
from django.views.generic import TemplateView


class NoCacheTemplateView(TemplateView):
    """Serve index.html with no-cache headers so browsers always fetch the latest build."""

    def dispatch(self, request, *args, **kwargs):
        response = super().dispatch(request, *args, **kwargs)
        add_never_cache_headers(response)
        return response


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')),
    path('api/scan/', include('scanner.urls')),
    re_path(r'^(?!api/|admin/|static/).*$', NoCacheTemplateView.as_view(template_name='index.html')),
]
