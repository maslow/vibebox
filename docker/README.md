# Docker Development Environment

This directory contains Docker configuration for the VibeBox development environment.

## Services

### PostgreSQL (Port 5432)
- **Image**: postgres:17-alpine
- **Container**: vibebox-postgres
- **Databases**:
  - `logto` - Logto authentication service database
  - `vibebox` - VibeBox main application database
- **Data persistence**: Docker volume `postgres_data`

### Logto (Ports 3001, 3002)
- **Image**: svhd/logto:latest
- **Container**: vibebox-logto
- **Port 3001**: Logto API endpoint
- **Port 3002**: Admin Console (web interface)

## Quick Start

### 1. First Time Setup

```bash
# Copy environment template (if not done already)
cp .env.example .env

# Edit .env and set your passwords
# nano .env

# Start all services
docker compose up -d
```

### 2. Verify Services

```bash
# Check service status
docker compose ps

# View logs
docker compose logs -f

# Check specific service
docker compose logs -f logto
```

### 3. Access Services

- **Logto Admin Console**: http://localhost:3002
- **Logto API**: http://localhost:3001
- **PostgreSQL**: localhost:5432

## Database Connection Strings

### From Host Machine (for development tools)

```bash
# VibeBox Database
postgresql://postgres:vibebox_dev_password_2025@localhost:5432/vibebox

# Logto Database
postgresql://postgres:vibebox_dev_password_2025@localhost:5432/logto
```

### From Docker Containers (internal networking)

```bash
# VibeBox Database
postgresql://postgres:vibebox_dev_password_2025@postgres:5432/vibebox

# Logto Database
postgresql://postgres:vibebox_dev_password_2025@postgres:5432/logto
```

## Common Commands

### Start Services

```bash
# Start all services in detached mode
docker compose up -d

# Start with logs visible
docker compose up

# Start specific service
docker compose up -d postgres
```

### Stop Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (WARNING: deletes all data)
docker compose down -v

# Stop specific service
docker compose stop logto
```

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f postgres
docker compose logs -f logto

# Last 100 lines
docker compose logs --tail=100 -f
```

### Database Operations

```bash
# Access PostgreSQL CLI
docker compose exec postgres psql -U postgres

# List all databases
docker compose exec postgres psql -U postgres -c '\l'

# Connect to specific database
docker compose exec postgres psql -U postgres -d vibebox

# Run SQL file
docker compose exec -T postgres psql -U postgres -d vibebox < script.sql

# Backup database
docker compose exec -T postgres pg_dump -U postgres vibebox > backup.sql

# Restore database
docker compose exec -T postgres psql -U postgres vibebox < backup.sql
```

### Restart Services

```bash
# Restart all services
docker compose restart

# Restart specific service
docker compose restart logto
```

### Check Service Health

```bash
# View service status
docker compose ps

# Check container resource usage
docker stats

# Inspect specific container
docker compose exec postgres pg_isready
```

## Troubleshooting

### Port Already in Use

If you get port conflict errors:

```bash
# Check what's using the port
lsof -i :5432
lsof -i :3001
lsof -i :3002

# Kill the process or change ports in docker-compose.yml
```

### Logto Won't Start

```bash
# Check logs
docker compose logs logto

# Ensure PostgreSQL is healthy
docker compose ps postgres

# Restart Logto
docker compose restart logto
```

### Database Connection Issues

```bash
# Verify PostgreSQL is running
docker compose ps postgres

# Check if databases exist
docker compose exec postgres psql -U postgres -c '\l'

# Check PostgreSQL logs
docker compose logs postgres
```

### Reset Everything (Clean Slate)

```bash
# WARNING: This deletes all data
docker compose down -v
docker compose up -d
```

### Permission Issues

```bash
# Ensure init scripts are executable
chmod +x docker/postgres/init/*.sql
```

## Data Persistence

Data is persisted in Docker volumes:

- **Volume name**: `postgres_data`
- **Location**: Managed by Docker (typically in `/var/lib/docker/volumes/`)

To inspect volume:

```bash
docker volume inspect happy_postgres_data
```

To remove volume (WARNING: deletes all data):

```bash
docker compose down -v
# or
docker volume rm happy_postgres_data
```

## Logto Admin Console

### First Time Access

1. Open http://localhost:3002
2. Create admin account
3. Complete setup wizard

### Common Tasks

- **Create Application**: Applications → Create Application
- **Add Social Connectors**: Connectors → Social Connectors
- **Manage Users**: User Management → Users
- **Configure RBAC**: Authorization → Roles

## Environment Variables

Edit `.env` file to customize:

```env
# PostgreSQL
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password_here

# Logto
LOGTO_DB_NAME=logto
LOGTO_ENDPOINT=http://localhost:3001
LOGTO_ADMIN_ENDPOINT=http://localhost:3002

# VibeBox
VIBEBOX_DB_NAME=vibebox
```

## Production Notes

This setup is for **development only**. For production:

1. Use strong passwords
2. Enable SSL/TLS for PostgreSQL
3. Use reverse proxy (Nginx) for HTTPS
4. Set up proper backup strategy
5. Use Docker secrets instead of .env
6. Configure proper resource limits
7. Use managed database service (optional)

## Network Configuration

All services are connected via `vibebox-network` bridge network:

- Services can communicate using container names (e.g., `postgres`, `logto`)
- Ports are exposed to host for development access

## Initialization Scripts

PostgreSQL initialization scripts in `docker/postgres/init/`:

- **01-create-databases.sql**: Creates `logto` and `vibebox` databases
- Scripts run only on first container creation
- Scripts must have `.sql`, `.sql.gz`, or `.sh` extension

## Support

For issues:

1. Check logs: `docker compose logs -f`
2. Verify services are healthy: `docker compose ps`
3. Restart services: `docker compose restart`
4. Check Logto documentation: https://docs.logto.io
5. Check PostgreSQL documentation: https://www.postgresql.org/docs/

## References

- [Logto Documentation](https://docs.logto.io)
- [PostgreSQL Docker Official Image](https://hub.docker.com/_/postgres)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
