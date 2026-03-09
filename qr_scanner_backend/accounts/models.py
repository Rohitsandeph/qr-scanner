from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        GENERATOR = 'generator', 'Generator'
        SCANNER = 'scanner', 'Scanner'

    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.SCANNER,
    )
    created_by = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='created_users',
    )

    def __str__(self):
        return f"{self.username} ({self.role})"
