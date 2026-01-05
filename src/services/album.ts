import { authService } from './auth';

const API_URL = 'http://127.0.0.1:8000/api/v1';

export interface Photo {
    id: number;
    album_id: number;
    original_file_name: string;
    original_minio_url: string;
    resized_minio_url: string;
    file_size: number;
    width: number;
    height: number;
    created_at: string;
}

export interface Album {
    id: number;
    code: string;
    photographer_id: number;
    title: string;
    drive_folder_url: string;
    total_photos: number;
    is_password_protected: boolean;
    created_at: string;
    updated_at: string;
}

export interface PhotoListResponse {
    items: Photo[];
    meta: PaginationMeta;
}

export interface AlbumListItem {
    id: number;
    code: string;
    photographer_id: number;
    title: string;
    drive_folder_url: string;
    thumbnail: Photo | null;
    total_photos: number;
    created_at: string;
    updated_at: string;
}

export interface PaginationMeta {
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}

export interface ListAlbumsResponse {
    items: AlbumListItem[];
    meta: PaginationMeta;
}

export const albumService = {
    listAlbums: async (page: number = 1, pageSize: number = 20): Promise<ListAlbumsResponse> => {
        const response = await authService.fetchWithAuth(
            `${API_URL}/albums?page=${page}&page_size=${pageSize}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch albums');
        }

        const data = await response.json();
        return data;
    },

    getAlbumDetail: async (albumId: number): Promise<Album> => {
        const response = await authService.fetchWithAuth(`${API_URL}/albums/${albumId}/detail`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch album detail');
        }

        const data = await response.json();
        return data;
    },

    getAlbumByCode: async (code: string, accessToken?: string): Promise<Album> => {
        // Public endpoint - optional auth for password-protected albums
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
        };

        if (accessToken) {
            headers['Authorization'] = `Bearer ${accessToken}`;
        }

        const response = await fetch(`${API_URL}/albums/code/${code}`, {
            method: 'GET',
            headers,
        });

        if (!response.ok) {
            throw new Error('Failed to fetch album');
        }

        const data = await response.json();
        return data;
    },

    getAlbumPhotos: async (albumId: number, page: number = 1, pageSize: number = 30): Promise<PhotoListResponse> => {
        const response = await authService.fetchWithAuth(
            `${API_URL}/albums/${albumId}/photos?page=${page}&page_size=${pageSize}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            throw new Error('Failed to fetch album photos');
        }

        const data = await response.json();
        return data;
    },

    getAlbumPhotosByCode: async (code: string, accessToken: string, page: number = 1, pageSize: number = 30): Promise<PhotoListResponse> => {
        const response = await fetch(`${API_URL}/albums/code/${code}/photos?page=${page}&page_size=${pageSize}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch album photos');
        }

        const data = await response.json();
        return data;
    },

    removeAlbum: async (albumId: number): Promise<{ message: string; album_id: number }> => {
        const response = await authService.fetchWithAuth(`${API_URL}/albums/remove-album`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                album_id: albumId,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to remove album');
        }

        const data = await response.json();
        return data;
    },

    updateAlbum: async (albumId: number, updates: { title?: string; password?: string | null }): Promise<Album> => {
        const response = await authService.fetchWithAuth(`${API_URL}/albums/${albumId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
        });

        if (!response.ok) {
            throw new Error('Failed to update album');
        }

        const data = await response.json();
        return data;
    },

    removePhotos: async (albumId: number, photoIds: number[]): Promise<{ message: string; removed_count: number }> => {
        const response = await authService.fetchWithAuth(`${API_URL}/albums/${albumId}/photos/remove`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                photo_ids: photoIds,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to remove photos');
        }

        const data = await response.json();
        return data;
    },

    downloadSinglePhoto: async (albumCode: string, photoId: number, accessToken: string): Promise<Blob> => {
        const response = await fetch(`${API_URL}/albums/code/${albumCode}/photos/${photoId}/download`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            throw new Error('Failed to download photo');
        }

        return await response.blob();
    },

    downloadMultiplePhotos: async (albumCode: string, photoIds: number[], accessToken: string): Promise<Blob> => {
        const response = await fetch(`${API_URL}/albums/code/${albumCode}/photos/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                photo_ids: photoIds,
            }),
        });

        if (!response.ok) {
            throw new Error('Failed to download photos');
        }

        return await response.blob();
    },
};
