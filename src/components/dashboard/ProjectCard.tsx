import React from 'react';

export interface Project {
    id: number;
    title: string;
    client: string; // Not used in design explicitly but good for Search
    date: string;
    image: string;
    status: 'Published' | 'Draft' | 'Archived';
    photosCount: number;
    viewsCount?: number;
}

interface ProjectCardProps {
    project: Project;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
    const statusColors = {
        'Published': 'bg-green-100 text-green-800',
        'Draft': 'bg-black text-white',
        'Archived': 'bg-gray-200 text-gray-600',
    };

    return (
        <div className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            <div className="relative h-48 bg-gray-200">
                <img src={project.image} alt={project.title} className="w-full h-full object-cover" />
                <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center ${statusColors[project.status]}`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${project.status === 'Published' ? 'bg-green-500' : project.status === 'Draft' ? 'bg-white' : 'bg-gray-500'}`}></span>
                        {project.status}
                    </span>
                </div>
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-1">
                    <h3 className="font-bold text-lg text-gray-900 truncate pr-2">{project.title}</h3>
                    <button className="text-gray-400 hover:text-gray-600">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 8C13.1 8 14 7.1 14 6C14 4.9 13.1 4 12 4C10.9 4 10 4.9 10 6C10 7.1 10.9 8 12 8ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 16C10.9 16 10 16.9 10 18C10 19.1 10.9 20 12 20C13.1 20 14 19.1 14 18C14 16.9 13.1 16 12 16Z" fill="currentColor" />
                        </svg>
                    </button>
                </div>
                <p className="text-gray-500 text-sm mb-4">{project.date}</p>

                <div className="flex items-center text-xs text-gray-500 space-x-4">
                    <div className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {project.photosCount}
                    </div>
                    {project.viewsCount !== undefined && (
                        <div className="flex items-center">
                            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            {project.viewsCount >= 1000 ? `${(project.viewsCount / 1000).toFixed(1)}k` : project.viewsCount}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProjectCard;
