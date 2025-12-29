import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { albumService } from '../services/album';
import type { Album } from '../services/album';
import DashboardHeader from '../components/dashboard/DashboardHeader';
import Footer from '../components/layout/Footer';

const AlbumDetailPage = () => {
    const { albumId } = useParams<{ albumId: string }>();
    const navigate = useNavigate();
    const [album, setAlbum] = useState<Album | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

    useEffect(() => {
        const fetchAlbumDetail = async () => {
            if (!albumId) {
                setError('Album ID is missing');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const albumData = await albumService.getAlbumDetail(parseInt(albumId));
                setAlbum(albumData);
            } catch (err) {
                console.error('Error fetching album detail:', err);
                setError(err instanceof Error ? err.message : 'Failed to load album');
            } finally {
                setLoading(false);
            }
        };

        fetchAlbumDetail();
    }, [albumId]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
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

    const openLightbox = (index: number) => {
        setSelectedPhoto(index);
    };

    const closeLightbox = () => {
        setSelectedPhoto(null);
    };

    const navigateLightbox = (direction: 'prev' | 'next') => {
        if (selectedPhoto === null || !album) return;

        if (direction === 'prev') {
            setSelectedPhoto(selectedPhoto > 0 ? selectedPhoto - 1 : album.photos.length - 1);
        } else {
            setSelectedPhoto(selectedPhoto < album.photos.length - 1 ? selectedPhoto + 1 : 0);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
                <DashboardHeader />
                <main className="flex-grow px-8 py-12 flex items-center justify-center">
                    <div className="animate-spin">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !album) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
                <DashboardHeader />
                <main className="flex-grow px-8 py-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <p className="text-red-600 mb-4">{error || 'Album not found'}</p>
                            <button
                                onClick={() => navigate('/')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                            >
                                Back to Albums
                            </button>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
            <DashboardHeader />

            <main className="flex-grow px-8 py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate('/')}
                        className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                            <path d="M20 11H7.83L13.42 5.41L12 4L4 12L12 20L13.41 18.59L7.83 13H20V11Z" fill="currentColor" />
                        </svg>
                        Back to Albums
                    </button>

                    {/* Album Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{album.title}</h1>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                            <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" />
                                        </svg>
                                        {album.total_photos} photo{album.total_photos !== 1 ? 's' : ''}
                                    </span>
                                    <span className="flex items-center">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                                            <path d="M11.99 2C6.47 2 2 6.48 2 12C2 17.52 6.47 22 11.99 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 11.99 2ZM12 20C7.58 20 4 16.42 4 12C4 7.58 7.58 4 12 4C16.42 4 20 7.58 20 12C20 16.42 16.42 20 12 20ZM12.5 7H11V13L16.25 16.15L17 14.92L12.5 12.25V7Z" fill="currentColor" />
                                        </svg>
                                        Created {formatDate(album.created_at)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center space-x-2">
                                        <span className="text-sm text-gray-600">Share Code:</span>
                                        <span className="text-lg font-mono font-bold text-gray-900">{album.code}</span>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(album.code)}
                                        className="text-blue-600 hover:text-blue-700 ml-4"
                                        title="Copy code"
                                    >
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" fill="currentColor" />
                                        </svg>
                                    </button>
                                </div>
                                <button
                                    onClick={() => copyToClipboard(`${window.location.origin}/albums/${album.code}`)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Copy Share Link
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Photo Gallery */}
                    {album.photos.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                            <svg className="mx-auto mb-4 text-gray-400" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos in this album</h3>
                        </div>
                    ) : (
                        <Masonry
                            breakpointCols={{
                                default: 4,
                                1280: 4,
                                1024: 3,
                                768: 2,
                                640: 1
                            }}
                            className="flex -ml-4 w-auto"
                            columnClassName="pl-4 bg-clip-padding"
                        >
                            {album.photos.map((photo, index) => (
                                <div
                                    key={photo.id}
                                    className="mb-4"
                                    onClick={() => openLightbox(index)}
                                >
                                    <div className="bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow group relative">
                                        <img
                                            src={photo.resized_minio_url}
                                            alt={photo.original_file_name}
                                            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                            <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                <path d="M10 7V13M7 10H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Masonry>
                    )}
                </div>
            </main>

            {/* Lightbox */}
            {selectedPhoto !== null && album.photos[selectedPhoto] && (
                <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
                    <button
                        onClick={closeLightbox}
                        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor" />
                        </svg>
                    </button>

                    <button
                        onClick={() => navigateLightbox('prev')}
                        className="absolute left-4 text-white hover:text-gray-300 transition-colors"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15.41 7.41L14 6L8 12L14 18L15.41 16.59L10.83 12L15.41 7.41Z" fill="currentColor" />
                        </svg>
                    </button>

                    <button
                        onClick={() => navigateLightbox('next')}
                        className="absolute right-4 text-white hover:text-gray-300 transition-colors"
                    >
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M10 6L8.59 7.41L13.17 12L8.59 16.59L10 18L16 12L10 6Z" fill="currentColor" />
                        </svg>
                    </button>

                    <div className="max-w-7xl max-h-[90vh] mx-4">
                        <img
                            src={album.photos[selectedPhoto].original_minio_url}
                            alt={album.photos[selectedPhoto].original_file_name}
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                        <div className="text-white text-center mt-4">
                            <p className="text-sm">{album.photos[selectedPhoto].original_file_name}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {selectedPhoto + 1} / {album.photos.length}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default AlbumDetailPage;
