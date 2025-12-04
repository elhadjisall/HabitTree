from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = 'Give leaf dollars to a specific user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='Username or email of the user')
        parser.add_argument('amount', type=int, help='Amount of leaf dollars to give')

    def handle(self, *args, **options):
        username = options['username']
        amount = options['amount']

        try:
            # Try to find by username first, then by email
            user = User.objects.filter(username__iexact=username).first()
            if not user:
                user = User.objects.filter(email__iexact=username).first()
            
            if not user:
                self.stdout.write(self.style.ERROR(f'User "{username}" not found'))
                return

            old_balance = user.leaf_dollars
            user.leaf_dollars = amount
            user.save()

            self.stdout.write(self.style.SUCCESS(
                f'Successfully set {user.username}\'s leaf dollars from {old_balance} to {amount}'
            ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))

