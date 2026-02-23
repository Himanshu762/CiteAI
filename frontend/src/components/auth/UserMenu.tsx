import React, { useState, useRef, useEffect } from 'react';
import { Settings, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface UserMenuProps {
    afterSignOutUrl?: string;
}

export const UserMenu: React.FC<UserMenuProps> = ({ afterSignOutUrl = '/' }) => {
    const { user, signOut } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSignOut = async () => {
        await signOut();
        window.location.href = afterSignOutUrl;
    };

    const getInitials = () => {
        if (user?.displayName) {
            return user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (user?.email) {
            return user.email[0].toUpperCase();
        }
        return 'U';
    };

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium text-sm">
                    {user?.photoURL ? (
                        <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                        getInitials()
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden z-50">
                    <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                                {user?.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    getInitials()
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                    {user?.displayName || 'User'}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {user?.email}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2">
                        <Link
                            to="/settings"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 w-full px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                        </Link>
                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-3 w-full px-3 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Sign out</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
