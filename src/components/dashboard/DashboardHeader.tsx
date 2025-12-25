

const DashboardHeader = () => {
    return (
        <header className="sticky top-0 z-50 flex justify-between items-center px-8 py-4 bg-white border-b border-gray-100">
            <div className="flex items-center space-x-2">
                <div className="bg-black text-white p-1 rounded-full">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 6C13.66 6 15 7.34 15 9C15 10.66 13.66 12 12 12C10.34 12 9 10.66 9 9C9 7.34 10.34 6 12 6ZM12 17.2C9.5 17.2 7.29 15.92 6 14C7.29 12.08 9.5 10.8 12 10.8C14.5 10.8 16.71 12.08 18 14C16.71 15.92 14.5 17.2 12 17.2Z" fill="white" />
                    </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">Kafoto</span>
            </div>

            <div className="flex items-center space-x-6">
                <button className="text-gray-500 hover:text-gray-700 relative">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.36 5.36 13.5 4.68V4C13.5 3.17 12.83 2 12 2C11.17 2 10.5 3.17 10.5 4V4.68C7.63 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="currentColor" />
                    </svg>
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                        <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="white" />
                    </svg>
                    Create Album
                </button>
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden cursor-pointer">
                    <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="Avatar" className="w-full h-full object-cover" />
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
