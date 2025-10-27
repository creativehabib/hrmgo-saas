# HRM React

A SaaS application for managing HR Operations And built with Laravel and React.

## Setup Instructions

### Option 1: Web Installer (Recommended)

1. Clone the repository
2. Install dependencies:
   ```
   composer install
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your database
4. Generate application key:
   ```
   php artisan key:generate
   ```
5. Start the development server:
   ```
   php artisan serve
   npm run dev
   ```
6. Visit your application URL - you'll be automatically redirected to the installer
7. Or manually visit `/setup` to access the web installer
8. Click "Install Application" to run migrations and seeders automatically

### Option 2: Manual Installation

1. Clone the repository
2. Install dependencies:
   ```
   composer install
   npm install
   ```
3. Copy `.env.example` to `.env` and configure your database
4. Generate application key:
   ```
   php artisan key:generate
   ```
5. Run migrations and seeders:
   ```
   php artisan migrate
   php artisan db:seed
   ```
6. Start the development server:
   ```
   php artisan serve
   npm run dev
   ```

## Web Installer Features

- **Automatic Installation**: No need to run `php artisan migrate` manually
- **Update Detection**: Automatically detects when new migrations are available
- **One-Click Updates**: Update database schema with a single click
- **Status Monitoring**: Real-time installation and update status
- **Error Handling**: Clear error messages and troubleshooting guidance

## Default Users

After running the seeders, you can log in with the following credentials:

- Super Admin:
  - Email: superadmin@example.com
  - Password: password

- Admin:
  - Email: admin@example.com
  - Password: password

## Features

- Multi-store management
- Role-based access control
- Subscription plans
- User management
- Store settings
- And more...

## License

The HRM React is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).