# Create Albums API Documentation

## Overview

The Create Albums API allows photographers to create photo albums by importing images from Google Drive folders. The API automatically:

1. Lists all images from a Google Drive folder
2. Downloads original images
3. Uploads originals to MinIO storage
4. Resizes images to a specified width
5. Uploads resized images to MinIO
6. Creates album and photo records in the database
7. Generates a unique 6-character code for sharing

## Endpoints

There are two endpoints for creating albums:

1. **Standard Endpoint** (`POST /albums`) - Single response after completion
2. **Streaming Endpoint** (`POST /albums/stream`) - Real-time progress updates via SSE

Both endpoints are **protected** and require authentication.

---

## Standard Create Album Endpoint

### Endpoint Details

```
POST /api/v1/albums
Content-Type: application/json
Authorization: Bearer {access_token}
```

### Request Body

```json
{
  "folder_url": "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j",
  "title": "Wedding - Sarah & John",
  "max_width": 400
}
```

**Parameters:**

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `folder_url` | string | Yes | - | Google Drive folder URL |
| `title` | string | Yes | - | Album title (1-200 characters) |
| `max_width` | integer | No | 400 | Maximum width for resized images (100-2000px) |

### Response (201 Created)

```json
{
  "album": {
    "id": 1,
    "code": "3FS27C",
    "photographer_id": 1,
    "title": "Wedding - Sarah & John",
    "drive_folder_url": "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j",
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
      }
    ],
    "created_at": "2024-01-03T12:00:00",
    "updated_at": "2024-01-03T12:00:00"
  },
  "total_photos": 15,
  "message": "Successfully created album 'Wedding - Sarah & John' with 15 photos"
}
```

### Example Usage

**cURL:**

```bash
curl -X POST http://localhost:8000/api/v1/albums \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "folder_url": "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j",
    "title": "Wedding - Sarah & John",
    "max_width": 400
  }'
```

**JavaScript (fetch):**

```javascript
const createAlbum = async () => {
  const response = await fetch('http://localhost:8000/api/v1/albums', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      folder_url: 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j',
      title: 'Wedding - Sarah & John',
      max_width: 400
    })
  });

  const data = await response.json();
  console.log('Album created:', data.album);
  console.log('Album code:', data.album.code); // Share this code with clients
};
```

**Python:**

```python
import requests

url = "http://localhost:8000/api/v1/albums"
headers = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {access_token}"
}
payload = {
    "folder_url": "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j",
    "title": "Wedding - Sarah & John",
    "max_width": 400
}

response = requests.post(url, json=payload, headers=headers)
album = response.json()

print(f"Album created with code: {album['album']['code']}")
```

---

## Streaming Create Album Endpoint (SSE)

### Endpoint Details

```
POST /api/v1/albums/stream
Content-Type: application/json
Authorization: Bearer {access_token}
```

### Request Body

Same as standard endpoint:

```json
{
  "folder_url": "https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j",
  "title": "Wedding - Sarah & John",
  "max_width": 400
}
```

### Response (Streaming)

The endpoint returns `text/event-stream` with real-time progress updates.

**Response Headers:**
```
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive
```

### Event Types

The streaming endpoint sends various event types to track progress:

| Event Type | Description | Example Data |
|------------|-------------|--------------|
| `started` | Album creation started | `{type: 'started', message: '...', title: '...'}` |
| `generating_code` | Generating unique album code | `{type: 'generating_code', message: '...'}` |
| `listing_files` | Listing files from Google Drive | `{type: 'listing_files', message: '...'}` |
| `files_listed` | Files enumeration complete | `{type: 'files_listed', total_files: 20, total_images: 15}` |
| `creating_album` | Creating album record | `{type: 'creating_album', code: '3FS27C'}` |
| `album_created` | Album record created | `{type: 'album_created', album_id: 1, code: '3FS27C'}` |
| `processing_image` | Starting image processing | `{type: 'processing_image', current: 1, total: 15, file_name: 'IMG_001.jpg'}` |
| `downloading` | Downloading from Google Drive | `{type: 'downloading', current: 1, total: 15}` |
| `uploading_original` | Uploading original to MinIO | `{type: 'uploading_original', current: 1, total: 15}` |
| `resizing` | Resizing image | `{type: 'resizing', current: 1, total: 15}` |
| `uploading_resized` | Uploading resized to MinIO | `{type: 'uploading_resized', current: 1, total: 15}` |
| `image_processed` | Image successfully processed | `{type: 'image_processed', current: 1, processed: 1, failed: 0}` |
| `image_error` | Error processing specific image | `{type: 'image_error', file_name: 'IMG_002.jpg', error: '...'}` |
| `saving_photos` | Saving photos to database | `{type: 'saving_photos', message: '...'}` |
| `photos_saved` | Photos saved successfully | `{type: 'photos_saved', photo_count: 15}` |
| `completed` | Album creation completed | `{type: 'completed', album_id: 1, code: '3FS27C', processed: 15, failed: 0}` |
| `cancelled` | Client disconnected | `{type: 'cancelled', message: '...'}` |
| `fatal_error` | Critical error occurred | `{type: 'fatal_error', error: '...'}` |

### Example Event Stream

```
data: {"type":"started","message":"Starting to create album \"Wedding Photos\"...","title":"Wedding Photos"}

data: {"type":"generating_code","message":"Generating unique album code..."}

data: {"type":"listing_files","message":"Listing files from Google Drive folder..."}

data: {"type":"files_listed","message":"Found 15 images out of 20 total files","total_files":20,"total_images":15}

data: {"type":"creating_album","message":"Creating album record with code 3FS27C...","code":"3FS27C"}

data: {"type":"album_created","message":"Album created with code 3FS27C and ID: 1","album_id":1,"code":"3FS27C"}

data: {"type":"processing_image","message":"Processing IMG_001.jpg (1/15)","current":1,"total":15,"file_name":"IMG_001.jpg"}

data: {"type":"downloading","message":"Downloading IMG_001.jpg...","current":1,"total":15}

data: {"type":"uploading_original","message":"Uploading original IMG_001.jpg to MinIO...","current":1,"total":15}

data: {"type":"resizing","message":"Resizing IMG_001.jpg to max width 400px...","current":1,"total":15}

data: {"type":"uploading_resized","message":"Uploading resized IMG_001.jpg to MinIO...","current":1,"total":15}

data: {"type":"image_processed","message":"Successfully processed IMG_001.jpg (1/15)","current":1,"total":15,"processed":1,"failed":0}

...

data: {"type":"completed","message":"Album \"Wedding Photos\" created successfully with code 3FS27C","album_id":1,"code":"3FS27C","total_images":15,"processed":15,"failed":0,"success":true}
```

### JavaScript Example (EventSource)

**Note:** EventSource doesn't support custom headers, so you need to send the token as a query parameter or use fetch with streaming.

**Using fetch API:**

```javascript
const createAlbumWithProgress = async () => {
  const response = await fetch('http://localhost:8000/api/v1/albums/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      folder_url: 'https://drive.google.com/drive/folders/1a2b3c4d5e6f7g8h9i0j',
      title: 'Wedding - Sarah & John',
      max_width: 400
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = JSON.parse(line.substring(6));
        handleProgress(data);
      }
    }
  }
};

const handleProgress = (data) => {
  console.log(`[${data.type}] ${data.message}`);

  switch (data.type) {
    case 'started':
      showMessage(`Creating album: ${data.title}`);
      break;

    case 'files_listed':
      showMessage(`Found ${data.total_images} images`);
      break;

    case 'album_created':
      showMessage(`Album created with code: ${data.code}`);
      break;

    case 'processing_image':
      updateProgress(data.current, data.total);
      showMessage(`Processing ${data.file_name}...`);
      break;

    case 'image_processed':
      updateProgress(data.current, data.total);
      break;

    case 'image_error':
      showError(`Failed to process ${data.file_name}: ${data.error}`);
      break;

    case 'completed':
      showMessage(`Album created! Code: ${data.code}`);
      showMessage(`Processed: ${data.processed}, Failed: ${data.failed}`);
      onComplete(data);
      break;

    case 'fatal_error':
      showError(`Fatal error: ${data.error}`);
      break;
  }
};
```

### React Example with Progress Bar

```jsx
import { useState } from 'react';

function CreateAlbum() {
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [status, setStatus] = useState('');
  const [albumCode, setAlbumCode] = useState('');

  const createAlbum = async (formData) => {
    const response = await fetch('/api/v1/albums/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(formData)
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.substring(6));

          setStatus(data.message);

          if (data.current && data.total) {
            setProgress({ current: data.current, total: data.total });
          }

          if (data.type === 'completed') {
            setAlbumCode(data.code);
          }
        }
      }
    }
  };

  const percentage = progress.total > 0
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <div>
      <div className="progress-bar">
        <div style={{ width: `${percentage}%` }}>{percentage}%</div>
      </div>
      <p>{status}</p>
      {progress.total > 0 && (
        <p>Processing: {progress.current} / {progress.total}</p>
      )}
      {albumCode && (
        <div>
          <h3>Album Created!</h3>
          <p>Share this code with your clients: <strong>{albumCode}</strong></p>
          <p>Public URL: https://yourdomain.com/albums/{albumCode}</p>
        </div>
      )}
    </div>
  );
}
```

---

## Auto-Cleanup on Disconnect

If the client disconnects during streaming (e.g., user closes browser, network error), the server automatically:

1. Deletes all uploaded files from MinIO
2. Deletes the album and photo records from the database
3. Sends cleanup events before terminating

**Cleanup Events:**

```
data: {"type":"cancelled","message":"Client disconnected, cleaning up..."}

data: {"type":"cleanup_minio","message":"Cleaned up 10 files from MinIO","deleted":10,"failed":0}

data: {"type":"cleanup_database","message":"Deleted album and photos from database","album_id":1}

data: {"type":"cleanup_complete","message":"Cleanup completed"}
```

---

## Error Responses

### 400 Bad Request

Invalid folder URL format:

```json
{
  "detail": "Invalid Google Drive folder URL format"
}
```

### 401 Unauthorized

Missing or invalid authentication:

```json
{
  "detail": "Invalid authentication credentials"
}
```

### 500 Internal Server Error

Processing failed:

```json
{
  "detail": "Failed to create album: No image files found in the specified folder"
}
```

---

## Google Drive Folder URL Format

The API accepts Google Drive folder URLs in the following format:

```
https://drive.google.com/drive/folders/FOLDER_ID
https://drive.google.com/drive/u/0/folders/FOLDER_ID
```

**How to get the folder URL:**

1. Open Google Drive
2. Navigate to the folder containing images
3. Copy the URL from the browser address bar
4. Paste it into the `folder_url` field

---

## Supported Image Formats

The API processes the following image formats:

- JPEG (`.jpg`, `.jpeg`)
- PNG (`.png`)
- GIF (`.gif`)
- BMP (`.bmp`)
- TIFF (`.tiff`, `.tif`)
- WebP (`.webp`)

Non-image files in the folder are automatically skipped.

---

## Album Code

Each album receives a unique 6-character code (e.g., `3FS27C`) that:

- Uses uppercase letters and numbers
- Excludes confusing characters: `0`, `O`, `I`, `1`
- Is guaranteed to be unique across all albums
- Can be shared with clients for public access

**Example public URL:**
```
https://yourdomain.com/albums/3FS27C
```

Clients can view the album without authentication using the code.

---

## Performance Considerations

### Image Processing Time

Processing time depends on:

- Number of images in the folder
- Image file sizes
- Network speed (Google Drive → Server → MinIO)
- Server resources

**Approximate processing time:**
- Small album (10 images, ~2MB each): 30-60 seconds
- Medium album (50 images, ~2MB each): 2-5 minutes
- Large album (100+ images, ~2MB each): 5-15 minutes

### Recommendations

1. **Use streaming endpoint** for albums with many images to provide real-time feedback
2. **Use standard endpoint** for small albums (< 10 images) for simplicity
3. **Implement timeout handling** on the client side (recommended: 15 minutes)
4. **Show progress indicator** to keep users engaged during processing

---

## Complete Workflow Example

### 1. Login

```javascript
const login = async () => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'photographer@example.com',
      password: 'password123'
    })
  });
  const data = await response.json();
  return data.access_token;
};
```

### 2. Create Album with Progress

```javascript
const accessToken = await login();

const createAlbumWithProgress = async () => {
  const response = await fetch('/api/v1/albums/stream', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      folder_url: 'https://drive.google.com/drive/folders/ABC123',
      title: 'Wedding Photos',
      max_width: 400
    })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const event = JSON.parse(line.substring(6));
        console.log(`[${event.type}] ${event.message}`);

        if (event.type === 'completed') {
          return event; // Returns album data
        }
      }
    }
  }
};

const result = await createAlbumWithProgress();
console.log('Album code:', result.code);
```

### 3. Share Album with Client

```javascript
const shareAlbum = (albumCode) => {
  const publicUrl = `https://yourdomain.com/albums/${albumCode}`;

  // Send to client via email, SMS, etc.
  sendEmail({
    to: 'client@example.com',
    subject: 'Your Wedding Photos',
    body: `View your photos here: ${publicUrl}`
  });
};

shareAlbum(result.code);
```

---

## Troubleshooting

### "No image files found"

**Cause:** The Google Drive folder doesn't contain any supported image files.

**Solution:**
- Verify the folder contains images
- Check that images have supported extensions (jpg, png, etc.)
- Ensure the service account has access to the folder

### "Failed to download file"

**Cause:** Service account doesn't have permission to access the folder.

**Solution:**
- Share the folder with the service account email
- Grant "Viewer" or "Editor" permissions

### "MinIO upload failed"

**Cause:** MinIO service is not running or misconfigured.

**Solution:**
- Check MinIO is running: `docker-compose ps`
- Verify MinIO credentials in `.env` file
- Check MinIO bucket exists

### Stream disconnects prematurely

**Cause:** Network timeout or client-side timeout.

**Solution:**
- Increase client timeout (recommended: 15 minutes)
- Implement reconnection logic
- Use smaller batches of images

---

## Best Practices

1. **Always use HTTPS** in production for secure token transmission
2. **Implement progress indicators** when using the streaming endpoint
3. **Handle errors gracefully** and provide user feedback
4. **Validate folder URLs** on the client side before submitting
5. **Store album codes** for future reference
6. **Implement rate limiting** to prevent abuse
7. **Test with small albums** first before processing large batches
8. **Provide feedback** to users about expected processing time

---

## Related Documentation

- [ALBUM_SECURITY.md](./ALBUM_SECURITY.md) - Album access control and security
- [REFACTORING_COMPLETE.md](./REFACTORING_COMPLETE.md) - Photographer refactoring details
- [API Authentication](./AUTH_API.md) - Login and token management
