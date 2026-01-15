import React from 'react';

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">
                    LoyaltyLoop
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                    Sign in to your dashboard
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-[480px]">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
