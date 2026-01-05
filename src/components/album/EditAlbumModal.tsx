import { useState, useEffect } from 'react';

interface EditAlbumModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (updates: { title?: string; password?: string | null }) => Promise<void>;
    currentTitle: string;
    hasPassword: boolean;
}

const EditAlbumModal = ({ isOpen, onClose, onSave, currentTitle, hasPassword }: EditAlbumModalProps) => {
    const [title, setTitle] = useState(currentTitle);
    const [password, setPassword] = useState('');
    const [updatePassword, setUpdatePassword] = useState(false);
    const [removePassword, setRemovePassword] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTitle(currentTitle);
            setPassword('');
            setUpdatePassword(false);
            setRemovePassword(false);
        }
    }, [isOpen, currentTitle]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const updates: { title?: string; password?: string | null } = {};

        if (title !== currentTitle) {
            updates.title = title;
        }

        if (removePassword) {
            updates.password = null;
        } else if (updatePassword && password) {
            updates.password = password;
        }

        if (Object.keys(updates).length === 0) {
            onClose();
            return;
        }

        try {
            setSaving(true);
            await onSave(updates);
            onClose();
        } catch (error) {
            console.error('Error updating album:', error);
            alert(error instanceof Error ? error.message : 'Failed to update album');
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordModeChange = (mode: 'none' | 'update' | 'remove') => {
        if (mode === 'none') {
            setUpdatePassword(false);
            setRemovePassword(false);
            setPassword('');
        } else if (mode === 'update') {
            setUpdatePassword(true);
            setRemovePassword(false);
            setPassword('');
        } else if (mode === 'remove') {
            setUpdatePassword(false);
            setRemovePassword(true);
            setPassword('');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Edit Album</h2>
                    {!saving && (
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z" fill="currentColor" />
                            </svg>
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                            Album Title
                        </label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                            maxLength={200}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Album Password
                        </label>

                        <div className="space-y-2">
                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="passwordMode"
                                    checked={!updatePassword && !removePassword}
                                    onChange={() => handlePasswordModeChange('none')}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">
                                    Keep current password {hasPassword ? '(Protected)' : '(No password)'}
                                </span>
                            </label>

                            <label className="flex items-center">
                                <input
                                    type="radio"
                                    name="passwordMode"
                                    checked={updatePassword}
                                    onChange={() => handlePasswordModeChange('update')}
                                    className="mr-2"
                                />
                                <span className="text-sm text-gray-700">
                                    {hasPassword ? 'Change password' : 'Set password'}
                                </span>
                            </label>

                            {hasPassword && (
                                <label className="flex items-center">
                                    <input
                                        type="radio"
                                        name="passwordMode"
                                        checked={removePassword}
                                        onChange={() => handlePasswordModeChange('remove')}
                                        className="mr-2"
                                    />
                                    <span className="text-sm text-gray-700">Remove password</span>
                                </label>
                            )}
                        </div>

                        {updatePassword && (
                            <div className="mt-3">
                                <input
                                    type="text"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter new password"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required={updatePassword}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAlbumModal;
