# Kafoto API Documentation

## Overview

Kafoto is a photo album management API for photographers. It allows photographers to create albums by importing images from Google Drive, automatically processing and storing them, and generating shareable links for clients.

## Documentation Index

### API Documentation

- **[Create Albums API](./CREATE_ALBUMS_API.md)** - Complete guide to creating albums from Google Drive
  - Standard and streaming endpoints
  - Request/response formats
  - SSE event types
  - Code examples (JavaScript, Python, React)
  - Error handling and troubleshooting

### Security & Architecture

- **[Album Security](../ALBUM_SECURITY.md)** - Photographer-based access control
  - Data isolation between photographers
  - Protected vs public endpoints
  - Authorization implementation

- **[Refactoring Complete](../REFACTORING_COMPLETE.md)** - Admin → Photographer refactoring
  - Database schema changes
  - Breaking changes
  - Migration guide

## Quick Start

### 1. Setup Database

```bash
# Reset database
make db-reset

# Create initial photographer
python scripts/seed_photographer.py

# Start server
make run
```

### 2. Authenticate

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kafoto.com","password":"admin123"}'

# Save the access_token from response
```

### 3. Create Album

```bash
# Create album with streaming progress
curl -X POST http://localhost:8000/api/v1/albums/stream \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {access_token}" \
  -d '{
    "folder_url": "https://drive.google.com/drive/folders/YOUR_FOLDER_ID",
    "title": "Wedding Photos",
    "max_width": 400
  }'
```

## API Endpoints

### Authentication

- `POST /api/v1/auth/login` - Login photographer
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/me` - Get current photographer
- `POST /api/v1/auth/photographers` - Create new photographer (requires auth)

### Albums

**Protected (Require Authentication):**
- `GET /api/v1/albums` - List all my albums
- `GET /api/v1/albums/{album_id}` - Get specific album (if owned)
- `POST /api/v1/albums` - Create album
- `POST /api/v1/albums/stream` - Create album with SSE progress

**Public (No Authentication):**
- `GET /api/v1/albums/code/{code}` - Get album by code (for sharing)

### Google Drive

- `POST /api/v1/google-drive/files` - List files in folder
- `POST /api/v1/google-drive/urls` - Get file URLs
- `POST /api/v1/google-drive/process-images` - Process images
- `POST /api/v1/google-drive/process-images/stream` - Process with SSE

## Architecture

### Tech Stack

- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy
- **Storage**: MinIO (S3-compatible)
- **Image Processing**: Pillow (PIL)
- **External API**: Google Drive API
- **Authentication**: JWT (Access + Refresh tokens)

### Clean Architecture Layers

```
src/
├── domain/           # Business entities and repository interfaces
├── application/      # Use cases and DTOs
├── infrastructure/   # External services, database, repositories
└── presentation/     # API routes and dependencies
```

### Database Schema

```
photographers (id, email, hashed_password, full_name, ...)
  ├─ refresh_tokens (photographer_id→, token, expires_at, ...)
  └─ albums (photographer_id→, code, title, drive_folder_url, ...)
       └─ photos (album_id→, original_url, resized_url, ...)
```

## Key Features

### 1. Google Drive Integration

- Service account authentication
- Automatic folder scanning
- Download original images
- Support for multiple image formats

### 2. Automatic Image Processing

- Download from Google Drive
- Resize to specified width (maintains aspect ratio)
- Upload both original and resized to MinIO
- Extract metadata (dimensions, file size)

### 3. Real-time Progress (SSE)

- Server-Sent Events for live updates
- Track each image processing step
- Auto-cleanup on disconnect
- Error handling per image

### 4. Album Sharing

- Unique 6-character codes (e.g., `3FS27C`)
- Public access without authentication
- Share via URL: `/albums/code/{code}`

### 5. Multi-Tenant Security

- Data isolation per photographer
- Automatic ownership assignment
- Authorization on all protected endpoints
- Public sharing with codes

## Environment Variables

Create a `.env` file with:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/kafoto

# JWT
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# MinIO
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=images
MINIO_SECURE=false

# Google Drive
GOOGLE_CREDENTIALS_FILE=service-account.json
```

## Development Setup

### Prerequisites

- Python 3.11+
- PostgreSQL
- MinIO (or Docker)
- Google Cloud service account

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/kafoto-api.git
cd kafoto-api

# Install dependencies
pip install -r requirements.txt

# Setup database
make db-reset

# Seed initial photographer
python scripts/seed_photographer.py

# Run server
make run
```

### Docker Setup

```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f api
```

## Testing

### Manual Testing

```bash
# Test login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@kafoto.com","password":"admin123"}'

# Test create album
curl -X POST http://localhost:8000/api/v1/albums \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "folder_url": "https://drive.google.com/drive/folders/...",
    "title": "Test Album"
  }'
```

### API Documentation

Visit `http://localhost:8000/docs` for interactive Swagger documentation.

## Troubleshooting

### Database Issues

```bash
# Reset database
make db-reset

# Check database connection
psql $DATABASE_URL -c "SELECT 1"
```

### MinIO Issues

```bash
# Check MinIO is running
curl http://localhost:9000/minio/health/live

# Access MinIO console
open http://localhost:9001
```

### Google Drive Issues

```bash
# Verify service account file exists
cat service-account.json

# Test Google Drive access
python -c "from src.infrastructure.external_services.google_drive_service import GoogleDriveService; svc = GoogleDriveService(); print('Connected!')"
```

## Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [yourusername/kafoto-api/issues](https://github.com/yourusername/kafoto-api/issues)
- Email: support@kafoto.com
