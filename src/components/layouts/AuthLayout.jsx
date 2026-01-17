import React from 'react';

const AuthLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
                <img src={`${import.meta.env.BASE_URL}logo.png`} alt="LoyaltyLoop Logo" className="w-16 h-16 mb-4 drop-shadow-md mix-blend-multiply object-contain" />
                <h2 className="text-center text-3xl font-black tracking-tight text-slate-900">
                    LoyaltyLoop
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600 font-medium">
                    商家控制台登入 / Sign in to dashboard
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
