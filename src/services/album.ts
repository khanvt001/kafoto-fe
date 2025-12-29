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
    photos: Photo[];
    total_photos: number;
    created_at: string;
    updated_at: string;
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

    getAlbumByCode: async (code: string): Promise<Album> => {
        // Public endpoint - no auth required
        const response = await fetch(`${API_URL}/albums/code/${code}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to fetch album');
        }

        const data = await response.json();
        return data;
    },
};
