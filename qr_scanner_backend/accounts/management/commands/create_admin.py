from django.core.management.base import BaseCommand

from accounts.models import User


class Command(BaseCommand):
    help = 'Create the initial admin user if none exists'

    def add_arguments(self, parser):
        parser.add_argument('--username', default='admin')
        parser.add_argument('--email', default='admin@example.com')
        parser.add_argument('--password', default='admin123456')

    def handle(self, *args, **options):
        if User.objects.filter(role='admin').exists():
            self.stdout.write(self.style.WARNING('Admin user already exists. Skipping.'))
            return

        user = User.objects.create_superuser(
            username=options['username'],
            email=options['email'],
            password=options['password'],
        )
        user.role = 'admin'
        user.save()
        self.stdout.write(self.style.SUCCESS(
            f'Admin user "{user.username}" created successfully.'
        ))
