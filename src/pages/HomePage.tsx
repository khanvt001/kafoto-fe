import DashboardHeader from '../components/dashboard/DashboardHeader';
import FilterBar from '../components/dashboard/FilterBar';
import ProjectCard, { type Project } from '../components/dashboard/ProjectCard';
import Stats from '../components/dashboard/Stats';
import Footer from '../components/layout/Footer';

const HomePage = () => {
    // Mock Data
    const projects: Project[] = [
        {
            id: 1,
            title: 'Wedding: Anh & Chi',
            client: 'Anh & Chi',
            date: 'Oct 24, 2023',
            image: 'https://images.unsplash.com/photo-1511285560982-1351cdeb9821?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            status: 'Published',
            photosCount: 150,
            viewsCount: 1200,
        },
        {
            id: 2,
            title: 'Fashion: Fall 2024',
            client: 'Fashion Co',
            date: 'Nov 02, 2023',
            image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            status: 'Draft',
            photosCount: 45,
        },
        {
            id: 3,
            title: 'Portrait: CEO Series',
            client: 'Tech Corp',
            date: 'Sep 15, 2023',
            image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            status: 'Published',
            photosCount: 12,
            viewsCount: 84,
        },
        {
            id: 4,
            title: "Event: TechConf '23",
            client: 'TechConf',
            date: 'Aug 10, 2023',
            image: 'https://images.unsplash.com/photo-1540575467063-178a50937178?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            status: 'Archived',
            photosCount: 420,
        },
        {
            id: 5,
            title: 'Family: The Smiths',
            client: 'The Smiths',
            date: 'Dec 01, 2023',
            image: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            status: 'Published',
            photosCount: 85,
            viewsCount: 302,
        },
        {
            id: 6,
            title: 'Product: Minimal Watch',
            client: 'Watch Co',
            date: 'Jan 12, 2024',
            image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
            status: 'Draft',
            photosCount: 10,
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900 flex flex-col">
            <DashboardHeader />

            <main className="flex-grow px-8 py-12">
                <div className="max-w-7xl mx-auto">
                    <Stats />
                    <FilterBar />

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {projects.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}

                        {/* Create New Album Placehodler */}
                        <div className="bg-transparent rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-6 hover:border-gray-400 transition-colors cursor-pointer h-full min-h-[300px]">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M19 13H13V19H11V13H5V11H11V5H13V11H19V13Z" fill="#6B7280" />
                                </svg>
                            </div>
                            <span className="font-medium text-gray-900">Create New Album</span>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <button className="text-gray-500 hover:text-gray-700 text-sm font-medium flex items-center justify-center mx-auto">
                            Load More Projects
                            <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default HomePage;
