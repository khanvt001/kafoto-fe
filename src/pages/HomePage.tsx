import DashboardHeader from '../components/dashboard/DashboardHeader';
import AlbumList from '../components/album/AlbumList';
import Footer from '../components/layout/Footer';

const HomePage = () => {
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
            <DashboardHeader />

            <main className="flex-grow px-8 py-12">
                <div className="max-w-7xl mx-auto">
                    <AlbumList />
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default HomePage;
