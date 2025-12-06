import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Sun, Moon } from 'lucide-react';
import { getAsset, handlesuccess, handleerror } from '../../../utils/assets';
import { BACKEND_API_URL } from '../../../utils/assets';

function PortalSignUp() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        enrolment_number: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLightMode, setIsLightMode] = useState(false);

    useEffect(() => {
        // Check for saved theme preference in localStorage
        const savedTheme = localStorage.getItem('theme');
        const isLight = savedTheme === 'light';
        setIsLightMode(isLight);
        document.documentElement.setAttribute('data-theme', isLight ? 'light' : 'dark');
    }, []);

    const handleLogin = async () => {
        const enrol = (formData.enrolment_number || '').trim();
        const pwd = (formData.password || '').trim();

        // Basic required check
        if (!enrol || !pwd) {
            const msg = 'Please enter your enrolment number and password';
            setError(msg);
            handleerror(msg);
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await axios.post(
                `${BACKEND_API_URL}/school-portal/auth/login`,
                {
                    enrolment_number: formData.enrolment_number,
                    password: formData.password
                },
                {
                    headers: {
                        'accept': 'application/json',
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.status === 200) {
                const data = response.data;
                console.log('Login success:', data);

                if (data && data.token) {
                    localStorage.setItem('token', data.token);
                }

                try {
                    localStorage.setItem('enrolment_number', formData.enrolment_number);
                } catch (e) {
                    console.error('Failed to persist enrolment_number:', e);
                }

                handlesuccess(data?.message || 'Login successfully');

                setTimeout(() => {
                    const isProfileComplete = data?.profile_complete === true;

                    if (!isProfileComplete) {
                        navigate('/StudentPortel/PortalDetails');
                    } else {
                        navigate('/StudentPortel/home');
                    }
                }, 2000);
            }
        } catch (error) {
            const message =
                error.response?.data?.detail ||
                error.response?.data?.message ||
                error?.message ||
                'Login failed. Please try again.';

            console.error('Login error:', error);
            setError(message);
            handleerror(message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className={`min-h-screen ${isLightMode ? 'bg-white' : 'bg-black'} flex items-center justify-center p-4 transition-colors duration-300`}>
            <div className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl px-2 sm:px-0">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-block">
                        <div className={`flex flex-col items-center ${isLightMode ? 'text-black' : 'text-white'}`}>
                            <img
                                src={getAsset(isLightMode ? 'inailogo_light' : 'inailogo_dark')}
                                alt="INAI Logo"
                                className="w-40 md:w-48 h-auto mb-4"
                            />

                        </div>
                    </div>
                </div>

                {/* Login Card */}
                {/* <div className="bg-zinc-900 rounded-lg p-8 shadow-2xl"> */}
                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className={`${isLightMode ? 'text-black' : 'text-white'} text-xl font-semibold mb-2`}>
                        Student Portal
                    </h2>
                    <p className={`${isLightMode ? 'text-gray-600' : 'text-gray-400'} text-sm`}>
                        Enter your credentials to Rediscover your account
                    </p>
                </div>

                {/* Form */}
                <div className={`${isLightMode ? 'bg-white border-gray-200' : 'bg-zinc-900 border-zinc-800'} rounded-2xl p-6 sm:p-8 shadow-2xl border`}>
                    <div className="space-y-6 w-full">

                        {/* Sign In Your Account Header */}
                        <div>
                            <h3 className={`${isLightMode ? 'text-black' : 'text-white'} text-[25px] font-medium mb-1 -mt-2.5`}>
                                Sign In Your Account
                            </h3>
                            <p className={`${isLightMode ? 'text-gray-600' : 'text-white'} text-xs`}>
                                Access your account to explore INAI Metaverse
                            </p>
                        </div>

                        {/* Enrolment Number Field */}
                        <div>
                            <label className="block text-white text-xs mb-2">
                                Enrolment Number
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    name="enrolment_number"
                                    value={formData.enrolment_number}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className={`w-full ${isLightMode ? 'bg-gray-100 text-black border border-gray-300 focus:border-blue-500' : 'bg-zinc-800 text-white border border-zinc-700 focus:border-zinc-600'} rounded-lg px-4 py-3 text-sm focus:outline-none transition-colors`}
                                    placeholder="Enter Enrolment Number"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-white text-xs mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyDown={handleKeyDown}
                                    className={`w-full ${isLightMode ? 'bg-gray-100 text-black border border-gray-300 focus:border-blue-500' : 'bg-zinc-800 text-white border border-zinc-700 focus:border-zinc-600'} rounded-lg px-4 py-3 pr-12 text-sm focus:outline-none transition-colors`}
                                    placeholder="Enter Password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Login Button */}
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className={`w-full py-3 font-medium rounded-full disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-[16px] cursor-pointer ${
                                isLightMode 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600' 
                                    : 'bg-white text-black hover:bg-gray-100 border border-gray-300'
                            }`}
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>


                    </div>
                </div>
                {/* </div> */}
            </div>
        </div>
    );
}

export default PortalSignUp;