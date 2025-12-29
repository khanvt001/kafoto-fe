# Album API Documentation

## Overview

The Album API provides endpoints for managing and viewing photo albums. It supports:

- **Pagination** for listing albums
- **Thumbnails** for efficient list views
- **Separate endpoints** for list and detail views
- **Public access** via album codes
- **Photographer-based access control**

---

## Endpoints Summary

### Protected Endpoints (Require Authentication)

- `GET /api/v1/albums` - List albums with pagination (thumbnails only)
- `GET /api/v1/albums/{album_id}/detail` - Get full album details with all photos
- `POST /api/v1/albums` - Create new album
- `POST /api/v1/albums/stream` - Create album with SSE progress

### Public Endpoints (No Authentication)

- `GET /api/v1/albums/code/{code}` - Get album by code (for sharing)

---

## List Albums (Paginated)

### Endpoint

```
GET /api/v1/albums?page=1&page_size=20
Authorization: Bearer {access_token}
```

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number (starts from 1) |
| `page_size` | integer | No | 20 | Items per page (max: 100) |

### Response (200 OK)

```json
{
  "items": [
    {
      "id": 1,
      "code": "3FS27C",
      "photographer_id": 1,
      "title": "Wedding - Sarah & John",
      "drive_folder_url": "https://drive.google.com/drive/folders/...",
      "thumbnail": {
        "id": 1,
        "album_id": 1,
        "original_file_name": "IMG_001.jpg",
        "original_minio_url": "http://minio:9000/images/original_uuid.jpg",
        "resized_minio_url": "http://minio:9000/images/resized_uuid.jpg",
        "file_size": 2048576,
        "width": 1920,
        "height": 1080,
        "created_at": "2024-01-03T12:00:00"
      },
      "total_photos": 45,
      "created_at": "2024-01-03T12:00:00",
      "updated_at": "2024-01-03T12:00:00"
    },
    {
      "id": 2,
      "code": "8KL9PQ",
      "photographer_id": 1,
      "title": "Birthday Party",
      "drive_folder_url": "https://drive.google.com/drive/folders/...",
      "thumbnail": {
        "id": 46,
        "album_id": 2,
        "original_file_name": "DSC_0001.jpg",
        "original_minio_url": "http://minio:9000/images/original_uuid2.jpg",
        "resized_minio_url": "http://minio:9000/images/resized_uuid2.jpg",
        "file_size": 1548576,
        "width": 1600,
        "height": 900,
        "created_at": "2024-01-05T14:30:00"
      },
      "total_photos": 23,
      "created_at": "2024-01-05T14:00:00",
      "updated_at": "2024-01-05T14:30:00"
    }
  ],
  "meta": {
    "total": 52,
    "page": 1,
    "page_size": 20,
    "total_pages": 3
  }
}
```

### Response Fields

**AlbumListItemResponse:**

| Field | Type | Description |
|-------|------|-------------|
| `id` | integer | Album ID |
| `code` | string | Unique 6-character code |
| `photographer_id` | integer | Owner photographer ID |
| `title` | string | Album title |
| `drive_folder_url` | string | Source Google Drive folder URL |
| `thumbnail` | PhotoResponse \| null | First photo as thumbnail (null if no photos) |
| `total_photos` | integer | Total number of photos in album |
| `created_at` | datetime | Creation timestamp |
| `updated_at` | datetime | Last update timestamp |

**PaginationMeta:**

| Field | Type | Description |
|-------|------|-------------|
| `total` | integer | Total number of albums |
| `page` | integer | Current page number |
| `page_size` | integer | Items per page |
| `total_pages` | integer | Total number of pages |

### Example Usage

**cURL:**

```bash
# Get first page (default)
curl http://localhost:8000/api/v1/albums \
  -H "Authorization: Bearer {token}"

# Get page 2 with 10 items per page
curl "http://localhost:8000/api/v1/albums?page=2&page_size=10" \
  -H "Authorization: Bearer {token}"
```

**JavaScript:**

```javascript
const listAlbums = async (page = 1, pageSize = 20) => {
  const response = await fetch(
    `http://localhost:8000/api/v1/albums?page=${page}&page_size=${pageSize}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const data = await response.json();

  console.log(`Page ${data.meta.page} of ${data.meta.total_pages}`);
  console.log(`Total albums: ${data.meta.total}`);

  data.items.forEach(album => {
    console.log(`${album.title} - ${album.total_photos} photos`);
    if (album.thumbnail) {
      console.log(`Thumbnail: ${album.thumbnail.resized_minio_url}`);
    }
  });
};
```

**React Example:**

```jsx
import { useState, useEffect } from 'react';

function AlbumList() {
  const [albums, setAlbums] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchAlbums(page);
  }, [page]);

  const fetchAlbums = async (pageNum) => {
    const response = await fetch(
      `/api/v1/albums?page=${pageNum}&page_size=20`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );
    const data = await response.json();
    setAlbums(data.items);
    setPagination(data.meta);
  };

  return (
    <div>
      <div className="albums-grid">
        {albums.map(album => (
          <div key={album.id} className="album-card">
            {album.thumbnail && (
              <img src={album.thumbnail.resized_minio_url} alt={album.title} />
            )}
            <h3>{album.title}</h3>
            <p>{album.total_photos} photos</p>
            <p>Code: {album.code}</p>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
        >
          Previous
        </button>
        <span>Page {pagination.page} of {pagination.total_pages}</span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={page === pagination.total_pages}
        >
          Next
        </button>
      </div>
    </div>
  );
}
```

---

## Get Album Detail (Photographer)

### Endpoint

```
GET /api/v1/albums/{album_id}/detail
Authorization: Bearer {access_token}
```

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `album_id` | integer | Yes | Album ID |

### Response (200 OK)

```json
{
  "id": 1,
  "code": "3FS27C",
  "photographer_id": 1,
  "title": "Wedding - Sarah & John",
  "drive_folder_url": "https://drive.google.com/drive/folders/...",
  "photos": [
    {
      "id": 1,
      "album_id": 1,
      "original_file_name": "IMG_001.jpg",
      "original_minio_url": "http://minio:9000/images/original_uuid.jpg",
      "resized_minio_url": "http://minio:9000/images/resized_uuid.jpg",
      "file_size": 2048576,
      "width": 1920,
      "height": 1080,
      "created_at": "2024-01-03T12:00:00"
    },
    {
      "id": 2,
      "album_id": 1,
      "original_file_name": "IMG_002.jpg",
      "original_minio_url": "http://minio:9000/images/original_uuid2.jpg",
      "resized_minio_url": "http://minio:9000/images/resized_uuid2.jpg",
      "file_size": 1948576,
      "width": 1920,
      "height": 1080,
      "created_at": "2024-01-03T12:00:05"
    }
  ],
  "total_photos": 45,
  "created_at": "2024-01-03T12:00:00",
  "updated_at": "2024-01-03T12:00:00"
}
```

### Error Responses

**404 Not Found:**

```json
{
  "detail": "Album with ID 999 not found or you don't have permission to access it"
}
```

**401 Unauthorized:**

```json
{
  "detail": "Invalid authentication credentials"
}
```

### Example Usage

**cURL:**

```bash
curl http://localhost:8000/api/v1/albums/1/detail \
  -H "Authorization: Bearer {token}"
```

**JavaScript:**

```javascript
const getAlbumDetail = async (albumId) => {
  const response = await fetch(
    `http://localhost:8000/api/v1/albums/${albumId}/detail`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  );

  const album = await response.json();

  console.log(`Album: ${album.title}`);
  console.log(`Total photos: ${album.total_photos}`);
  console.log(`Photos:`, album.photos);

  return album;
};
```

---

## Get Album by Code (Public)

### Endpoint

```
GET /api/v1/albums/code/{code}
```

**No authentication required** - Anyone with the code can view the album.

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | Yes | 6-character album code (e.g., "3FS27C") |

### Response (200 OK)

Same as "Get Album Detail" - returns full album with all photos.

```json
{
  "id": 1,
  "code": "3FS27C",
  "photographer_id": 1,
  "title": "Wedding - Sarah & John",
  "drive_folder_url": "https://drive.google.com/drive/folders/...",
  "photos": [...],
  "total_photos": 45,
  "created_at": "2024-01-03T12:00:00",
  "updated_at": "2024-01-03T12:00:00"
}
```

### Error Responses

**404 Not Found:**

```json
{
  "detail": "Album with code ABC123 not found"
}
```

### Example Usage

**cURL:**

```bash
# No authentication needed
curl http://localhost:8000/api/v1/albums/code/3FS27C
```

**JavaScript:**

```javascript
const viewPublicAlbum = async (code) => {
  const response = await fetch(
    `http://localhost:8000/api/v1/albums/code/${code}`
  );

  if (!response.ok) {
    throw new Error('Album not found');
  }

  const album = await response.json();
  return album;
};

// Usage
const album = await viewPublicAlbum('3FS27C');
console.log(`Viewing: ${album.title}`);
```

**React Example:**

```jsx
function PublicAlbumViewer({ code }) {
  const [album, setAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/v1/albums/code/${code}`)
      .then(res => res.json())
      .then(data => {
        setAlbum(data);
        setLoading(false);
      })
      .catch(err => {
        setError('Album not found');
        setLoading(false);
      });
  }, [code]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div>
      <h1>{album.title}</h1>
      <p>{album.total_photos} photos</p>

      <div className="photo-gallery">
        {album.photos.map(photo => (
          <img
            key={photo.id}
            src={photo.resized_minio_url}
            alt={photo.original_file_name}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Pagination Best Practices

### 1. Default Page Size

The API uses a default page size of **20 items**. This is a good balance between:
- Loading time
- Memory usage
- User experience

### 2. Maximum Page Size

The maximum allowed page size is **100 items** to prevent:
- Server overload
- Large payload sizes
- Slow response times

### 3. Page Calculation

```javascript
// Calculate total pages
const totalPages = Math.ceil(total / pageSize);

// Calculate if there's a next page
const hasNextPage = page < totalPages;

// Calculate if there's a previous page
const hasPreviousPage = page > 1;

// Calculate offset for database query
const offset = (page - 1) * pageSize;
```

### 4. Handling Empty Results

```javascript
if (data.items.length === 0 && data.meta.page > 1) {
  // User requested a page beyond available data
  // Redirect to last valid page
  const lastPage = data.meta.total_pages || 1;
  fetchAlbums(lastPage);
}
```

---

## Response Optimization

### List View (Lightweight)

The list endpoint returns **only thumbnail and metadata**:

- **Reduces payload size** by ~95% (vs full photos array)
- **Faster load times** for album browsing
- **Better UX** for mobile users
- **Reduced bandwidth** costs

**Comparison:**

```
Full Album (all photos):     ~500 KB - 5 MB
List Item (thumbnail only):  ~5 KB - 20 KB
```

### Detail View (Complete)

The detail endpoint returns **all photos** when needed:

- Used for viewing specific albums
- Lazy-loaded only when requested
- Full photo array for galleries

---

## Thumbnail Strategy

### First Photo as Thumbnail

The API automatically selects the **first photo** in each album as the thumbnail:

```javascript
// In the response
{
  "thumbnail": {
    "id": 1,
    "resized_minio_url": "http://minio:9000/images/resized_uuid.jpg",
    // ... other photo fields
  }
}
```

### No Photos Case

If an album has no photos yet:

```json
{
  "id": 5,
  "title": "Empty Album",
  "thumbnail": null,
  "total_photos": 0
}
```

### Displaying Thumbnails

```jsx
function AlbumThumbnail({ album }) {
  return (
    <div className="album-card">
      {album.thumbnail ? (
        <img
          src={album.thumbnail.resized_minio_url}
          alt={album.title}
        />
      ) : (
        <div className="no-thumbnail">
          <span>No photos</span>
        </div>
      )}
      <h3>{album.title}</h3>
      <p>{album.total_photos} photos</p>
    </div>
  );
}
```

---

## Common Use Cases

### 1. Album Gallery View

```javascript
// Fetch albums for gallery
const { items, meta } = await listAlbums(page, pageSize);

// Display as grid with thumbnails
items.forEach(album => {
  displayAlbumCard({
    title: album.title,
    thumbnail: album.thumbnail?.resized_minio_url,
    photoCount: album.total_photos,
    shareUrl: `/albums/${album.code}`
  });
});
```

### 2. Album Detail Page

```javascript
// User clicks on album
const albumId = getAlbumIdFromUrl();

// Fetch full details
const album = await getAlbumDetail(albumId);

// Display all photos in lightbox
displayPhotoGallery(album.photos);
```

### 3. Public Album Sharing

```javascript
// Generate shareable URL
const shareUrl = `https://yourdomain.com/albums/${album.code}`;

// Share via email, SMS, etc.
sendEmail({
  to: 'client@example.com',
  subject: `Photos: ${album.title}`,
  body: `View your photos here: ${shareUrl}`
});
```

### 4. Infinite Scroll

```javascript
let currentPage = 1;
let hasMore = true;

const loadMore = async () => {
  if (!hasMore) return;

  const { items, meta } = await listAlbums(currentPage);

  appendToGallery(items);

  currentPage++;
  hasMore = currentPage <= meta.total_pages;
};

// Load more on scroll
window.addEventListener('scroll', () => {
  if (nearBottomOfPage() && !loading) {
    loadMore();
  }
});
```

---

## Error Handling

### Common Errors

**400 Bad Request:**
```json
{
  "detail": "page_size must be between 1 and 100"
}
```

**401 Unauthorized:**
```json
{
  "detail": "Invalid authentication credentials"
}
```

**404 Not Found:**
```json
{
  "detail": "Album with ID 999 not found or you don't have permission to access it"
}
```

**500 Internal Server Error:**
```json
{
  "detail": "Failed to list albums: Database connection error"
}
```

### Error Handling Example

```javascript
const listAlbums = async (page, pageSize) => {
  try {
    const response = await fetch(
      `/api/v1/albums?page=${page}&page_size=${pageSize}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (response.status === 401) {
      // Token expired - refresh or redirect to login
      await refreshToken();
      return listAlbums(page, pageSize); // Retry
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail);
    }

    return await response.json();

  } catch (error) {
    console.error('Failed to load albums:', error.message);
    showErrorMessage('Failed to load albums. Please try again.');
  }
};
```

---

## Performance Considerations

### List Endpoint

- **Fast**: Only loads metadata and first photo
- **Scalable**: Supports thousands of albums with pagination
- **Efficient**: Minimal database queries with proper indexing

### Detail Endpoint

- **On-demand**: Only loads when user requests specific album
- **Complete**: All photos included for full viewing experience
- **Cached**: Consider client-side caching for frequently accessed albums

### Recommendations

1. **Use list endpoint** for browsing/navigation
2. **Use detail endpoint** only when viewing specific albums
3. **Implement caching** for frequently accessed data
4. **Lazy load images** in the photo gallery
5. **Prefetch next page** for better UX

---

## Related Documentation

- [CREATE_ALBUMS_API.md](./CREATE_ALBUMS_API.md) - Creating albums from Google Drive
- [ALBUM_SECURITY.md](../ALBUM_SECURITY.md) - Access control and permissions
- [README.md](./README.md) - Complete API documentation index
