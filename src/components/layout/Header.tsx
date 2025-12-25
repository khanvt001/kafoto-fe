

const Header = () => {
    return (
        <header className="flex justify-between items-center px-8 py-4 border-b border-gray-100">
            <div className="flex items-center space-x-2">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 22H22L12 2Z" fill="black" />
                </svg>
                <span className="text-xl font-bold">Kafoto</span>
            </div>
            <button className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors">
                Trợ giúp
            </button>
        </header>
    );
};

export default Header;
