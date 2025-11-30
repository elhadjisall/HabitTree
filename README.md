# HabitTree Backend

A Django REST Framework backend for the HabitTree habit tracking application.

## Features

- User authentication with JWT tokens
- Habit tracking with multiple tracking modes (daily, weekly, count, time)
- Streak calculation and historical tracking
- Leaf dollars reward system
- Reward purchasing and equipping
- Comprehensive API endpoints for frontend integration

## Database Schema

The project uses PostgreSQL and follows the ERD design documented in `ERD_UPDATED.md`.

### Models

- **User**: User accounts with leaf dollars currency
- **Habit**: Habit definitions with flexible tracking options
- **HabitLog**: Daily/periodic log entries (replaces HabitCompletion)
- **Streak**: Historical streak records
- **Reward**: Available rewards in the system
- **UserReward**: User's unlocked rewards

## Setup Instructions

### Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE habittree;

# Exit psql
\q
```

#### Configure Environment Variables

Create a `.env` file in the project root:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database Configuration
DB_NAME=habittree
DB_USER=postgres
DB_PASSWORD=your-postgres-password
DB_HOST=localhost
DB_PORT=5432
```

### 3. Run Migrations

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate
```

### 4. Create Superuser (Optional)

```bash
python manage.py createsuperuser
```

### 5. Run Development Server

```bash
python manage.py runserver
```

The API will be available at `http://localhost:8000/api/`

## API Endpoints

### Authentication

- `POST /api/auth/token/` - Obtain JWT token (login)
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Users

- `GET /api/users/me/` - Get current user profile
- `GET /api/users/stats/` - Get user statistics
- `POST /api/users/` - Register new user (no auth required)

### Habits

- `GET /api/habits/` - List user's habits
- `POST /api/habits/` - Create new habit
- `GET /api/habits/{id}/` - Get habit details
- `PUT /api/habits/{id}/` - Update habit
- `DELETE /api/habits/{id}/` - Delete habit
- `POST /api/habits/{id}/complete/` - Mark habit as complete
- `POST /api/habits/{id}/incomplete/` - Mark habit as incomplete
- `GET /api/habits/{id}/stats/` - Get habit statistics

### Rewards

- `GET /api/rewards/` - List available rewards
- `GET /api/rewards/?category=badge` - Filter rewards by category
- `GET /api/rewards/{id}/` - Get reward details
- `POST /api/rewards/{id}/purchase/` - Purchase a reward

### User Rewards

- `GET /api/user-rewards/` - List user's unlocked rewards
- `GET /api/user-rewards/equipped/` - Get equipped rewards
- `POST /api/user-rewards/{id}/equip/` - Equip a reward
- `POST /api/user-rewards/{id}/unequip/` - Unequip a reward

## Model Changes from Previous Version

### HabitCompletion → HabitLog

The `HabitCompletion` model has been replaced with `HabitLog`:

- `date` → `log_date`
- `completed` (boolean) → `status` (enum: 'completed', 'skipped', 'failed', 'partial')
- `notes` → `note`
- Added `amount_done` field for quantity-based tracking

### Habit Model Updates

- `title` → `name`
- Added `emoji`, `habit_type`, `tracking_mode`, `target_amount`, `unit`, `frequency`, `is_public`
- All existing fields retained for backward compatibility

### New Models

- **Streak**: Tracks historical streak records
- **Reward**: Defines available rewards
- **UserReward**: Links users to their unlocked rewards

## Migration Notes

If you have existing data, you'll need to:

1. Create migrations for the new schema
2. Run data migration to convert HabitCompletion records to HabitLog
3. Populate Streak records from existing completion data

## Development

### Running Tests

```bash
python manage.py test
```

### Creating Migrations

```bash
python manage.py makemigrations api
```

### Applying Migrations

```bash
python manage.py migrate
```

## Environment Variables

All sensitive configuration should be in `.env` file (not committed to git):

- `SECRET_KEY`: Django secret key
- `DEBUG`: Debug mode (True/False)
- `ALLOWED_HOSTS`: Comma-separated list of allowed hosts
- `DB_NAME`: PostgreSQL database name
- `DB_USER`: PostgreSQL username
- `DB_PASSWORD`: PostgreSQL password
- `DB_HOST`: Database host (default: localhost)
- `DB_PORT`: Database port (default: 5432)

## CORS Configuration

The backend is configured to allow requests from:
- `http://localhost:3000`
- `http://127.0.0.1:3000`

Update `CORS_ALLOWED_ORIGINS` in `settings.py` for production.

## License

[Your License Here]

