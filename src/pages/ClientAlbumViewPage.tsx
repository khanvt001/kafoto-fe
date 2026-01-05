import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Masonry from 'react-masonry-css';
import { albumService } from '../services/album';
import type { Album, Photo, PaginationMeta } from '../services/album';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import LazyImage from '../components/common/LazyImage';

const API_URL = 'http://127.0.0.1:8000/api/v1';

interface VerifyPasswordResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    album_code: string;
}

const ClientAlbumViewPage = () => {
    const { code } = useParams<{ code: string }>();
    const [album, setAlbum] = useState<Album | null>(null);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [photosMeta, setPhotosMeta] = useState<PaginationMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingPhotos, setLoadingPhotos] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [needsPassword, setNeedsPassword] = useState(true);
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [verifying, setVerifying] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
    const [currentAccessToken, setCurrentAccessToken] = useState<string | null>(null);

    // Infinite scroll
    const observerTarget = useRef<HTMLDivElement>(null);

    // Selection and download states
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
    const [downloading, setDownloading] = useState(false);

    // Get the localStorage key for this album's token
    const getTokenKey = (albumCode: string) => `client_access_token_${albumCode}`;

    // Get saved token from localStorage
    const getSavedToken = (albumCode: string): string | null => {
        return localStorage.getItem(getTokenKey(albumCode));
    };

    // Save token to localStorage
    const saveToken = (albumCode: string, token: string) => {
        localStorage.setItem(getTokenKey(albumCode), token);
    };

    // Clear token from localStorage
    const clearToken = (albumCode: string) => {
        localStorage.removeItem(getTokenKey(albumCode));
    };

    useEffect(() => {
        if (code) {
            // Try to use saved token first
            const savedToken = getSavedToken(code);
            if (savedToken) {
                fetchAlbum(savedToken);
            } else {
                fetchAlbum();
            }
        }
    }, [code]);

    const fetchAlbum = async (token?: string) => {
        if (!code) return;

        try {
            setLoading(true);
            setError(null);

            // Fetch album details
            const albumData = await albumService.getAlbumByCode(code, token);
            setAlbum(albumData);

            // Check if password is required and we don't have a token
            if (albumData.is_password_protected && !token) {
                setNeedsPassword(true);
                setLoading(false);
                return;
            }

            // Fetch first page of photos
            if (!token) {
                throw new Error('Access token required for photos');
            }

            try {
                const photosData = await albumService.getAlbumPhotosByCode(code, token, 1, 30);
                setPhotos(photosData.items);
                setPhotosMeta(photosData.meta);
                setNeedsPassword(false);

                // Save the current access token for downloads
                setCurrentAccessToken(token);
            } catch (photoErr) {
                // If photos fetch fails with 401, token is invalid
                if (photoErr instanceof Error && photoErr.message.includes('401')) {
                    if (token) {
                        clearToken(code);
                    }
                    setNeedsPassword(true);
                } else {
                    throw photoErr;
                }
            }
        } catch (err) {
            console.error('Error fetching album:', err);
            setError(err instanceof Error ? err.message : 'Failed to load album');
        } finally {
            setLoading(false);
        }
    };

    const loadMorePhotos = useCallback(async () => {
        if (!code || !currentAccessToken || !photosMeta || loadingPhotos) return;
        if (photosMeta.page >= photosMeta.total_pages) return;

        try {
            setLoadingPhotos(true);
            const nextPage = photosMeta.page + 1;
            const photosData = await albumService.getAlbumPhotosByCode(code, currentAccessToken, nextPage, 30);
            setPhotos(prev => [...prev, ...photosData.items]);
            setPhotosMeta(photosData.meta);
        } catch (err) {
            console.error('Error loading more photos:', err);
            alert(err instanceof Error ? err.message : 'Failed to load more photos');
        } finally {
            setLoadingPhotos(false);
        }
    }, [code, currentAccessToken, photosMeta, loadingPhotos]);

    // Infinite scroll observer
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && !loadingPhotos) {
                    loadMorePhotos();
                }
            },
            { threshold: 0.1 }
        );

        const currentTarget = observerTarget.current;
        if (currentTarget) {
            observer.observe(currentTarget);
        }

        return () => {
            if (currentTarget) {
                observer.unobserve(currentTarget);
            }
        };
    }, [loadMorePhotos, loadingPhotos]);

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!code || !password) return;

        try {
            setVerifying(true);
            setPasswordError('');

            const response = await fetch(`${API_URL}/albums/verify-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    code: code,
                    password: password,
                }),
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    setPasswordError('Incorrect password. Please try again.');
                } else {
                    throw new Error('Failed to verify password');
                }
                return;
            }

            const data: VerifyPasswordResponse = await response.json();

            // Save the token to localStorage
            saveToken(code, data.access_token);

            // Save to current state for downloads
            setCurrentAccessToken(data.access_token);

            // Fetch album with the access token
            await fetchAlbum(data.access_token);
        } catch (err) {
            console.error('Error verifying password:', err);
            setPasswordError(err instanceof Error ? err.message : 'Failed to verify password');
        } finally {
            setVerifying(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(date);
    };

    const openLightbox = (index: number) => {
        setSelectedPhoto(index);
    };

    const closeLightbox = () => {
        setSelectedPhoto(null);
    };

    const navigateLightbox = (direction: 'prev' | 'next') => {
        if (selectedPhoto === null) return;

        if (direction === 'prev') {
            setSelectedPhoto(selectedPhoto > 0 ? selectedPhoto - 1 : photos.length - 1);
        } else {
            setSelectedPhoto(selectedPhoto < photos.length - 1 ? selectedPhoto + 1 : 0);
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedPhotos(new Set());
    };

    const togglePhotoSelection = (photoId: number) => {
        const newSelected = new Set(selectedPhotos);
        if (newSelected.has(photoId)) {
            newSelected.delete(photoId);
        } else {
            newSelected.add(photoId);
        }
        setSelectedPhotos(newSelected);
    };

    const selectAllPhotos = () => {
        const allPhotoIds = new Set(photos.map(p => p.id));
        setSelectedPhotos(allPhotoIds);
    };

    const deselectAllPhotos = () => {
        setSelectedPhotos(new Set());
    };

    const handlePhotoClick = (index: number, photoId: number) => {
        if (isSelectionMode) {
            togglePhotoSelection(photoId);
        } else {
            openLightbox(index);
        }
    };

    const downloadBlob = (blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    };

    const handleDownloadSingle = async (photoId: number, filename: string) => {
        if (!code || !currentAccessToken) return;

        try {
            setDownloading(true);
            const blob = await albumService.downloadSinglePhoto(code, photoId, currentAccessToken);
            downloadBlob(blob, filename);
        } catch (err) {
            console.error('Error downloading photo:', err);
            alert(err instanceof Error ? err.message : 'Failed to download photo');
        } finally {
            setDownloading(false);
        }
    };

    const handleDownloadSelected = async () => {
        if (!code || !currentAccessToken || selectedPhotos.size === 0 || !album) return;

        try {
            setDownloading(true);
            const photoIds = Array.from(selectedPhotos);

            // If only 1 photo selected, use single photo download API
            if (photoIds.length === 1) {
                const photoId = photoIds[0];
                const photo = photos.find(p => p.id === photoId);
                if (photo) {
                    const blob = await albumService.downloadSinglePhoto(code, photoId, currentAccessToken);
                    downloadBlob(blob, photo.original_file_name);
                }
            } else {
                // Multiple photos - use ZIP download API
                const blob = await albumService.downloadMultiplePhotos(code, photoIds, currentAccessToken);
                const filename = `${album.title || 'photos'}_${photoIds.length}_photos.zip`;
                downloadBlob(blob, filename);
            }

            // Exit selection mode after download
            setIsSelectionMode(false);
            setSelectedPhotos(new Set());
        } catch (err) {
            console.error('Error downloading photos:', err);
            alert(err instanceof Error ? err.message : 'Failed to download photos');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
                <Header />
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

    if (needsPassword) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
                <Header />
                <main className="flex-grow px-8 py-12 flex items-center justify-center">
                    <div className="w-full max-w-md">
                        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
                            <div className="text-center mb-6">
                                <svg className="mx-auto mb-4 text-blue-600" width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18 8H17V6C17 3.24 14.76 1 12 1C9.24 1 7 3.24 7 6V8H6C4.9 8 4 8.9 4 10V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V10C20 8.9 19.1 8 18 8ZM12 17C10.9 17 10 16.1 10 15C10 13.9 10.9 13 12 13C13.1 13 14 13.9 14 15C14 16.1 13.1 17 12 17ZM15.1 8H8.9V6C8.9 4.29 10.29 2.9 12 2.9C13.71 2.9 15.1 4.29 15.1 6V8Z" fill="currentColor" />
                                </svg>
                                <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Protected Album</h2>
                                <p className="text-gray-600">Please enter the password to view this album</p>
                                {code && (
                                    <p className="text-sm text-gray-500 mt-2">Album Code: <span className="font-mono font-semibold">{code}</span></p>
                                )}
                            </div>

                            <form onSubmit={handlePasswordSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter album password"
                                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                            passwordError ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        required
                                        autoFocus
                                    />
                                    {passwordError && (
                                        <p className="text-sm text-red-600 mt-1">{passwordError}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={verifying}
                                    className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                                >
                                    {verifying ? 'Verifying...' : 'View Album'}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !album) {
        return (
            <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
                <Header />
                <main className="flex-grow px-8 py-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                            <p className="text-red-600 mb-4">{error || 'Album not found'}</p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
            <Header />

            <main className="flex-grow px-8 py-12">
                <div className="max-w-7xl mx-auto">
                    {/* Album Header */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <div className="text-center">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">{album.title}</h1>
                            <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-600 mb-4">
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
                                    {formatDate(album.created_at)}
                                </span>
                            </div>
                            <button
                                onClick={toggleSelectionMode}
                                className={`px-6 py-2 text-sm rounded-lg transition-colors font-medium ${
                                    isSelectionMode
                                        ? 'bg-red-600 text-white hover:bg-red-700'
                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                            >
                                {isSelectionMode ? 'Cancel Selection' : 'Select Photos to Download'}
                            </button>
                        </div>
                    </div>

                    {/* Selection Mode Action Bar */}
                    {isSelectionMode && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-900">
                                        {selectedPhotos.size} photo{selectedPhotos.size !== 1 ? 's' : ''} selected
                                    </span>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={selectAllPhotos}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Select All
                                        </button>
                                        <span className="text-gray-400">|</span>
                                        <button
                                            onClick={deselectAllPhotos}
                                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                        >
                                            Deselect All
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={handleDownloadSelected}
                                    disabled={selectedPhotos.size === 0 || downloading}
                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="currentColor" />
                                    </svg>
                                    {downloading ? 'Downloading...' : 'Download Selected'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Photo Gallery */}
                    {photos.length === 0 ? (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                            <svg className="mx-auto mb-4 text-gray-400" width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z" fill="currentColor" />
                            </svg>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No photos in this album</h3>
                        </div>
                    ) : (
                        <>
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
                                {photos.map((photo, index) => {
                                const isSelected = selectedPhotos.has(photo.id);
                                return (
                                    <div
                                        key={photo.id}
                                        className="mb-4"
                                        onClick={() => handlePhotoClick(index, photo.id)}
                                    >
                                        <div className={`bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-all group relative ${
                                            isSelected ? 'ring-4 ring-blue-500' : ''
                                        }`}>
                                            <LazyImage
                                                src={photo.resized_minio_url}
                                                alt={photo.original_file_name}
                                                className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                                            />
                                            {isSelectionMode ? (
                                                <div className="absolute top-2 right-2">
                                                    <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                                                        isSelected
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'bg-white border-gray-400'
                                                    }`}>
                                                        {isSelected && (
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="white" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
                                                    <svg className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                        <path d="M10 7V13M7 10H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </Masonry>

                        {/* Infinite Scroll Trigger & Loading Indicator */}
                        {photosMeta && photosMeta.page < photosMeta.total_pages && (
                            <div ref={observerTarget} className="flex justify-center mt-8 py-4">
                                {loadingPhotos && (
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <div className="animate-spin">
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                        <span>Loading more photos...</span>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* All Photos Loaded */}
                        {photosMeta && photosMeta.page >= photosMeta.total_pages && photos.length > 0 && (
                            <div className="flex justify-center mt-8 py-4 text-gray-500 text-sm">
                                All {photosMeta.total} photos loaded
                            </div>
                        )}
                    </>
                    )}
                </div>
            </main>

            {/* Lightbox */}
            {selectedPhoto !== null && photos[selectedPhoto] && (
                <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center">
                    <div className="absolute top-4 right-4 flex gap-2">
                        <button
                            onClick={() => handleDownloadSingle(photos[selectedPhoto].id, photos[selectedPhoto].original_file_name)}
                            disabled={downloading}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 9H15V3H9V9H5L12 16L19 9ZM5 18V20H19V18H5Z" fill="currentColor" />
                            </svg>
                            {downloading ? 'Downloading...' : 'Download'}
                        </button>
                        <button
                            onClick={closeLightbox}
                            className="text-white hover:text-gray-300 transition-colors"
                        >
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor" />
                            </svg>
                        </button>
                    </div>

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
                            src={photos[selectedPhoto].original_minio_url}
                            alt={photos[selectedPhoto].original_file_name}
                            className="max-w-full max-h-[90vh] object-contain"
                        />
                        <div className="text-white text-center mt-4">
                            <p className="text-sm">{photos[selectedPhoto].original_file_name}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {selectedPhoto + 1} / {photos.length}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
};

export default ClientAlbumViewPage;
