

const Stats = () => {
    return (
        <div className="flex justify-between items-end mb-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">My Projects</h1>
                <p className="text-gray-500 text-sm">Manage your albums, clients, and deliveries.</p>
            </div>
            <div className="flex space-x-8">
                <div className="text-center">
                    <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">TOTAL</span>
                    <span className="text-xl font-bold text-gray-900">24</span>
                </div>
                <div className="text-center">
                    <span className="block text-xs uppercase tracking-wide text-gray-500 mb-1">PUBLISHED</span>
                    <span className="text-xl font-bold text-gray-900">18</span>
                </div>
            </div>
        </div>
    );
};

export default Stats;
