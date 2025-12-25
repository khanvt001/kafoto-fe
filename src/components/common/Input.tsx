import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: ReactNode;
}

const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
    return (
        <div className={label ? "" : "mb-0"}>
            {label && <label className="block text-sm font-medium mb-2">{label}</label>}
            <div className="relative">
                <input
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent ${className}`}
                    {...props}
                />
                {icon && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Input;
