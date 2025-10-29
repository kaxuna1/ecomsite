#!/bin/bash
set -e

echo "Starting Luxia E-commerce Application..."

# Export environment variables for child scripts
export DB_HOST DB_PORT DB_NAME DB_USER DB_PASSWORD
export INITIAL_ADMIN_EMAIL INITIAL_ADMIN_PASSWORD INITIAL_ADMIN_NAME

# Initialize PostgreSQL data directory if it doesn't exist
if [ ! -s "/var/lib/postgresql/data/PG_VERSION" ]; then
    echo "Initializing PostgreSQL database cluster..."
    su - postgres -c "/usr/lib/postgresql/14/bin/initdb -D /var/lib/postgresql/data"

    # Create log file with correct permissions
    touch /var/log/postgresql.log
    chown postgres:postgres /var/log/postgresql.log

    # Start PostgreSQL temporarily to create database and user
    echo "Starting PostgreSQL temporarily for initialization..."
    su - postgres -c "/usr/lib/postgresql/14/bin/pg_ctl -D /var/lib/postgresql/data -l /var/log/postgresql.log start"

    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    until su - postgres -c "pg_isready -h localhost"; do
        sleep 2
    done

    # Run initialization script with environment variables
    bash -c "source /etc/environment 2>/dev/null || true; /docker-entrypoint-initdb.d/init-postgres.sh"

    # Stop PostgreSQL (supervisor will restart it)
    echo "Stopping temporary PostgreSQL instance..."
    su - postgres -c "/usr/lib/postgresql/14/bin/pg_ctl -D /var/lib/postgresql/data stop"

    echo "PostgreSQL initialization complete"
else
    echo "PostgreSQL data directory already initialized"
fi

# Wait a moment for PostgreSQL to fully stop
sleep 2

# Note: Migrations will be run by supervisor after PostgreSQL starts
# Start supervisor which will manage PostgreSQL, Backend, and Nginx
echo "Starting all services via Supervisor..."
exec "$@"
