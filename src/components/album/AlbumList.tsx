import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { albumService } from '../../services/album';
import type { AlbumListItem, PaginationMeta } from '../../services/album';

interface AlbumListProps {
    onRefresh?: number;
}

const AlbumList = ({ onRefresh }: AlbumListProps) => {
    const navigate = useNavigate();
    const [albums, setAlbums] = useState<AlbumListItem[]>([]);
    const [pagination, setPagination] = useState<PaginationMeta | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingAlbumId, setDeletingAlbumId] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [albumToDelete, setAlbumToDelete] = useState<AlbumListItem | null>(null);

    const fetchAlbums = async (page: number = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await albumService.listAlbums(page, 20);
            setAlbums(response.items);
            setPagination(response.meta);
            setCurrentPage(page);
        } catch (err) {
            console.error('Error fetching albums:', err);
            setError(err instanceof Error ? err.message : 'Failed to load albums');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAlbums(1);
    }, [onRefresh]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    const copyToClipboard = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleDeleteClick = (album: AlbumListItem) => {
        setAlbumToDelete(album);
        setShowDeleteConfirm(true);
    };

    const handleDeleteConfirm = async () => {
        if (!albumToDelete) return;

        try {
            setDeletingAlbumId(albumToDelete.id);
            await albumService.removeAlbum(albumToDelete.id);

            // Refresh the album list
            await fetchAlbums(currentPage);

            // Close confirmation dialog
            setShowDeleteConfirm(false);
            setAlbumToDelete(null);
        } catch (err) {
            console.error('Error deleting album:', err);
            alert(err instanceof Error ? err.message : 'Failed to delete album');
        } finally {
            setDeletingAlbumId(null);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
        setAlbumToDelete(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                <p className="text-red-600 mb-4">{error}</p>
                <button
                    onClick={() => fetchAlbums(1)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (albums.length === 0) {
        return (
            <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <svg className="mx-auto mb-4 text-gray-400" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No albums yet</h3>
                <p className="text-gray-600">Click "Create Album" to get started</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">My Albums</h2>
                {pagination && (
                    <p className="text-gray-600">
                        {pagination.total} album{pagination.total !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {albums.map((album) => (
                    <div
                        key={album.id}
                        className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                    >
                        {/* Album Thumbnail */}
                        <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center relative overflow-hidden">
                            {album.thumbnail ? (
                                <img
                                    src={album.thumbnail.resized_minio_url}
                                    alt={album.title}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                />
                            ) : (
                                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-300">
                                    <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" />
                                </svg>
                            )}
                            {album.total_photos > 0 && (
                                <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                                    {album.total_photos} photo{album.total_photos !== 1 ? 's' : ''}
                                </div>
                            )}
                        </div>

                        {/* Album Info */}
                        <div className="p-4">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                                {album.title}
                            </h3>

                            <div className="space-y-2">
                                {/* Album Code */}
                                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                                    <div className="flex items-center space-x-2">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-500">
                                            <path d="M9 11H7V13H9V11ZM13 11H11V13H13V11ZM17 11H15V13H17V11ZM19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="currentColor" />
                                        </svg>
                                        <span className="text-sm font-mono font-medium text-gray-700">
                                            {album.code}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(album.code)}
                                        className="text-blue-600 hover:text-blue-700 text-xs"
                                        title="Copy code"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor" />
                                        </svg>
                                    </button>
                                </div>

                                {/* Date */}
                                <div className="flex items-center text-sm text-gray-500">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                        <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor" />
                                    </svg>
                                    Created {formatDate(album.created_at)}
                                </div>

                                {/* Photo Count */}
                                <div className="flex items-center text-sm text-gray-500">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                        <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" />
                                    </svg>
                                    {album.total_photos} photo{album.total_photos !== 1 ? 's' : ''}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => navigate(`/albums/${album.id}`)}
                                    className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    View
                                </button>
                                <button
                                    onClick={() => copyToClipboard(`${window.location.origin}/albums/code/${album.code}`)}
                                    className="px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                                    title="Copy share link"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M18 16.08C17.24 16.08 16.56 16.38 16.04 16.85L8.91 12.7C8.96 12.47 9 12.24 9 12C9 11.76 8.96 11.53 8.91 11.3L15.96 7.19C16.5 7.69 17.21 8 18 8C19.66 8 21 6.66 21 5C21 3.34 19.66 2 18 2C16.34 2 15 3.34 15 5C15 5.24 15.04 5.47 15.09 5.7L8.04 9.81C7.5 9.31 6.79 9 6 9C4.34 9 3 10.34 3 12C3 13.66 4.34 15 6 15C6.79 15 7.5 14.69 8.04 14.19L15.16 18.35C15.11 18.56 15.08 18.78 15.08 19C15.08 20.61 16.39 21.92 18 21.92C19.61 21.92 20.92 20.61 20.92 19C20.92 17.39 19.61 16.08 18 16.08Z" fill="currentColor" />
                                    </svg>
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(album)}
                                    disabled={deletingAlbumId === album.id}
                                    className="px-3 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    title="Delete album"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M6 19C6 20.1 6.9 21 8 21H16C17.1 21 18 20.1 18 19V7H6V19ZM19 4H15.5L14.5 3H9.5L8.5 4H5V6H19V4Z" fill="currentColor" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.total_pages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                    <button
                        onClick={() => fetchAlbums(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Previous
                    </button>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                            Page {pagination.page} of {pagination.total_pages}
                        </span>
                    </div>

                    <button
                        onClick={() => fetchAlbums(currentPage + 1)}
                        disabled={currentPage === pagination.total_pages}
                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {showDeleteConfirm && albumToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Album</h3>
                        <p className="text-gray-600 mb-4">
                            Are you sure you want to delete <strong>{albumToDelete.title}</strong>?
                            This action cannot be undone and will permanently delete all {albumToDelete.total_photos} photo{albumToDelete.total_photos !== 1 ? 's' : ''}.
                        </p>

                        <div className="flex justify-end gap-3">
                            <button
                                onClick={handleDeleteCancel}
                                disabled={deletingAlbumId !== null}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={deletingAlbumId !== null}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {deletingAlbumId !== null ? 'Deleting...' : 'Delete Album'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AlbumList;
