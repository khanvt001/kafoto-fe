import { useState, useEffect } from 'react';

interface CreateAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ProgressState {
    current: number;
    total: number;
    status: string;
    albumCode?: string;
    albumId?: number;
    eventType: string;
    processed: number;
    failed: number;
    isProcessing: boolean;
    isCompleted: boolean;
    error?: string;
}

const CreateAlbumModal = ({ isOpen, onClose }: CreateAlbumModalProps) => {
    const [folderUrl, setFolderUrl] = useState('');
    const [title, setTitle] = useState('');
    const [maxWidth, setMaxWidth] = useState(400);
    const [urlError, setUrlError] = useState('');
    const [progress, setProgress] = useState<ProgressState>({
        current: 0,
        total: 0,
        status: '',
        eventType: '',
        processed: 0,
        failed: 0,
        isProcessing: false,
        isCompleted: false,
    });

    const resetProgress = () => {
        setProgress({
            current: 0,
            total: 0,
            status: '',
            eventType: '',
            processed: 0,
            failed: 0,
            isProcessing: false,
            isCompleted: false,
        });
    };

    const validateAndCleanGoogleDriveUrl = (url: string): { isValid: boolean; cleanedUrl: string; error: string } => {
        if (!url.trim()) {
            return { isValid: false, cleanedUrl: '', error: '' };
        }

        // Remove ?usp=sharing or any query parameters
        const cleanedUrl = url.split('?')[0];

        // Regex for Google Drive folder URL
        // Matches: https://drive.google.com/drive/folders/{FOLDER_ID}
        // Also matches: https://drive.google.com/drive/u/0/folders/{FOLDER_ID}
        const googleDriveFolderRegex = /^https:\/\/drive\.google\.com\/drive\/(u\/\d+\/)?folders\/[\w-]+$/;

        if (!googleDriveFolderRegex.test(cleanedUrl)) {
            return {
                isValid: false,
                cleanedUrl,
                error: 'Invalid Google Drive folder URL. Expected format: https://drive.google.com/drive/folders/...'
            };
        }

        return { isValid: true, cleanedUrl, error: '' };
    };

    const handleUrlChange = (value: string) => {
        setFolderUrl(value);

        if (value.trim()) {
            const { isValid, cleanedUrl, error } = validateAndCleanGoogleDriveUrl(value);

            if (!isValid && value.trim().length > 0) {
                setUrlError(error);
            } else {
                setUrlError('');
                // Auto-clean the URL if it contains query parameters
                if (cleanedUrl !== value && isValid) {
                    setFolderUrl(cleanedUrl);
                }
            }
        } else {
            setUrlError('');
        }
    };

    const handleClose = () => {
        if (!progress.isProcessing) {
            setFolderUrl('');
            setTitle('');
            setMaxWidth(400);
            setUrlError('');
            resetProgress();
            onClose();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!folderUrl || !title) return;

        // Validate URL before submitting
        const { isValid, cleanedUrl, error } = validateAndCleanGoogleDriveUrl(folderUrl);
        if (!isValid) {
            setUrlError(error);
            return;
        }

        resetProgress();
        setProgress(prev => ({ ...prev, isProcessing: true }));

        try {
            const accessToken = localStorage.getItem('accessToken');
            const response = await fetch('http://127.0.0.1:8000/api/v1/albums/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`,
                },
                body: JSON.stringify({
                    folder_url: cleanedUrl,
                    title: title,
                    max_width: maxWidth,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();

            if (!reader) {
                throw new Error('Response body is not readable');
            }

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));
                            handleProgressEvent(data);
                        } catch (error) {
                            console.error('Failed to parse event data:', error);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error creating album:', error);
            setProgress(prev => ({
                ...prev,
                isProcessing: false,
                error: error instanceof Error ? error.message : 'Failed to create album',
            }));
        }
    };

    const handleProgressEvent = (data: Record<string, unknown>) => {
        const eventType = data.type as string;
        const message = data.message as string;

        setProgress(prev => ({
            ...prev,
            eventType,
            status: message,
            current: (data.current as number) || prev.current,
            total: (data.total as number) || prev.total,
            albumCode: (data.code as string) || prev.albumCode,
            albumId: (data.album_id as number) || prev.albumId,
            processed: (data.processed as number) || prev.processed,
            failed: (data.failed as number) || prev.failed,
        }));

        if (eventType === 'completed') {
            setProgress(prev => ({
                ...prev,
                isProcessing: false,
                isCompleted: true,
            }));
        } else if (eventType === 'fatal_error') {
            setProgress(prev => ({
                ...prev,
                isProcessing: false,
                error: data.error as string,
            }));
        }
    };

    const percentage = progress.total > 0
        ? Math.round((progress.current / progress.total) * 100)
        : 0;

    useEffect(() => {
        if (!isOpen) {
            resetProgress();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Create New Album</h2>
                    {!progress.isProcessing && (
                        <button
                            onClick={handleClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor" />
                            </svg>
                        </button>
                    )}
                </div>

                <div className="px-6 py-4">
                    {!progress.isProcessing && !progress.isCompleted ? (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="folderUrl" className="block text-sm font-medium text-gray-700 mb-1">
                                    Google Drive Folder URL *
                                </label>
                                <input
                                    type="text"
                                    id="folderUrl"
                                    value={folderUrl}
                                    onChange={(e) => handleUrlChange(e.target.value)}
                                    placeholder="https://drive.google.com/drive/folders/..."
                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                        urlError ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    required
                                />
                                {urlError ? (
                                    <p className="text-xs text-red-600 mt-1">
                                        {urlError}
                                    </p>
                                ) : (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Paste the URL of your Google Drive folder containing images
                                    </p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                    Album Title *
                                </label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g., Wedding - Sarah & John"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                    maxLength={200}
                                />
                            </div>

                            <div>
                                <label htmlFor="maxWidth" className="block text-sm font-medium text-gray-700 mb-1">
                                    Maximum Width (px)
                                </label>
                                <input
                                    type="number"
                                    id="maxWidth"
                                    value={maxWidth}
                                    onChange={(e) => setMaxWidth(parseInt(e.target.value))}
                                    min={100}
                                    max={2000}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Images will be resized to this width while maintaining aspect ratio
                                </p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!!urlError}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                    Create Album
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="space-y-6 py-4">
                            {/* Progress Bar */}
                            {progress.total > 0 && (
                                <div>
                                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                                        <span>Progress</span>
                                        <span>{progress.current} / {progress.total}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                        <div
                                            className="bg-blue-600 h-4 transition-all duration-300 flex items-center justify-center text-xs text-white font-medium"
                                            style={{ width: `${percentage}%` }}
                                        >
                                            {percentage > 10 && `${percentage}%`}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Status Message */}
                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-start">
                                    {progress.isProcessing && (
                                        <div className="animate-spin mr-3 mt-0.5">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M12 2V6M12 18V22M6 12H2M22 12H18M19.07 4.93L16.24 7.76M7.76 16.24L4.93 19.07M19.07 19.07L16.24 16.24M7.76 7.76L4.93 4.93" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                            </svg>
                                        </div>
                                    )}
                                    {progress.isCompleted && (
                                        <div className="text-green-600 mr-3">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z" fill="currentColor" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900 font-medium">{progress.status}</p>
                                        {progress.error && (
                                            <p className="text-sm text-red-600 mt-1">{progress.error}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            {(progress.processed > 0 || progress.failed > 0) && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-green-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Processed</p>
                                        <p className="text-2xl font-bold text-green-600">{progress.processed}</p>
                                    </div>
                                    <div className="bg-red-50 rounded-lg p-4">
                                        <p className="text-sm text-gray-600">Failed</p>
                                        <p className="text-2xl font-bold text-red-600">{progress.failed}</p>
                                    </div>
                                </div>
                            )}

                            {/* Album Code */}
                            {progress.isCompleted && progress.albumCode && (
                                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Album Created Successfully!</h3>
                                    <p className="text-sm text-gray-600 mb-3">Share this code with your clients:</p>
                                    <div className="bg-white rounded-lg p-4 border-2 border-blue-300">
                                        <p className="text-3xl font-mono font-bold text-center text-blue-600 tracking-wider">
                                            {progress.albumCode}
                                        </p>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 text-center">
                                        Clients can use this code to view and download their photos
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            {progress.isCompleted && (
                                <div className="flex justify-end gap-3 pt-4">
                                    <button
                                        onClick={handleClose}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Done
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CreateAlbumModal;
