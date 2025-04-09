"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "next-themes";
import { Funnel_Display } from "next/font/google";
import countryList from "react-select-country-list";
import Navbar from "@/components/global/navbar";
import { ChevronDown, Save, Loader2 } from "lucide-react";
import { getAuth, onAuthStateChanged, updateProfile, User } from "firebase/auth";
import app from "@/firebase/firebaseconfig";
import { useRouter } from "next/navigation";
import axios from "axios";
import { BASE_URL } from "@/lib/constant";
import Image from "next/image";
import { toast } from 'sonner';

const funnel_display = Funnel_Display({
    subsets: ["latin"],
    weight: "400",
});

interface CountryOption {
    label: string;
    value: string;
}

interface FormData {
    fullName: string;
    gender: string;
    country: string;
    address: string;
}

const languages: string[] = [
    "English", "Spanish", "French", "German", "Chinese", "Japanese", "Korean",
    "Russian", "Arabic", "Hindi", "Portuguese", "Bengali", "Italian", "Dutch",
    "Turkish", "Polish", "Ukrainian", "Persian", "Swedish", "Vietnamese", "Thai",
    "Czech", "Greek", "Finnish", "Romanian", "Hungarian", "Hebrew", "Danish",
    "Norwegian", "Indonesian", "Malay", "Filipino", "Swahili"
];

const genders: string[] = ["Male", "Female", "Non-binary", "Prefer not to say"];

const Profile = () => {
    const auth = getAuth(app);
    const router = useRouter();
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);


    const countries: CountryOption[] = useMemo(() => countryList().getData(), []);

    const [formData, setFormData] = useState<FormData>({
        fullName: "",
        gender: "",
        country: "",
        address: "",
    });

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [idToken, setIdToken] = useState<string | null>(null);
    const [showDropdown, setShowDropdown] = useState({
        gender: false,
        country: false,
        language: false,
    });
    const [user, setUser] = useState<User | null>(null);

    const isDarkMode = mounted && resolvedTheme === "dark";

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (!user) {
            router.push("/auth");
          } else {
            const token = await user.getIdToken();
            setIdToken(token);
          }
        });
        return () => unsubscribe();
      }, [auth, router]);

    const handleGetUser = async () => {
        try {
     
          const response = await axios.get(`${BASE_URL}/user/get`, {
            headers: {
              Authorization: `Bearer ${idToken}`,
              
            },
          });
          console.log(response.data);
          setUser(response.data);
          setFormData({
            fullName: response.data.fullName || "",
            gender: response.data.gender || "",
            country: response.data.country || "",
            address: response.data.address || "",
        });
        } catch (error: any) {
          console.error("Internal Server Error:", error);
        }
      };

      useEffect(() => {
        if (idToken) {
          handleGetUser();
        }
      }, [idToken]);

    

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleDropdownSelect = (field: keyof FormData, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        setShowDropdown(prev => ({
            ...prev,
            [field]: false
        }));
    };

    const toggleDropdown = (dropdown: string) => {
        setShowDropdown(prev => ({
            ...prev,
            [dropdown]: !prev[dropdown as keyof typeof prev]
        }));
    };

    const saveProfile = async () => {
        if (!user) return;

        setSaving(true);
        try {
            if (user && formData.fullName !== user.displayName) {
                await updateProfile(user, {
                    displayName: formData.fullName
                });
            }

            await axios.post(`${BASE_URL}/user/update`, {
                email: user.email,
                ...formData
            });

            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Error saving profile:", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-neutral-950 text-green-600' : 'bg-white text-gray-900'} ${funnel_display.className}`}>
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="ml-2">Loading profile...</span>
            </div>
        );
    }
    console.log(user);
    return (

        
  
        <div className={`min-h-screen ${isDarkMode ? 'bg-neutral-950 text-green-600' : 'bg-white text-gray-900'} ${funnel_display.className}`}>
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="relative ">
                    <div className={`h-40 sm:h-56 rounded-lg overflow-hidden `}>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-end absolute bottom-0 left-0 transform translate-y-1/2 sm:translate-y-1/3 px-4 sm:px-8 w-full">
                        <div className="relative ">
                            <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-4  ${isDarkMode ? 'border-neutral-950' : 'border-white'}`}>
                                {user?.photoURL ? (
                                    <Image
                                        src={user.photoURL}
                                        alt="Profile"
                                        width={96}
                                        height={96}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-2xl font-bold ${isDarkMode ? 'bg-green-800' : 'bg-green-600'} text-white`}>
                                        {formData.fullName?.charAt(0) || user?.displayName?.charAt(0) || "U"}
                                        
                                    </div>

                                )}
                            </div>
                        </div>

                        <div className="mt-4 sm:mt-0 sm:ml-4 flex-grow">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center w-full">
                                <div>
                                    <h1 className="text-xl sm:text-2xl font-bold">{formData.fullName || user?.displayName || "User"}</h1>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                                </div>
                                <button
                                    onClick={saveProfile}
                                    disabled={saving}
                                    className={`mt-2 sm:mt-0 px-6 py-2 rounded-md flex items-center ${isDarkMode ? 'bg-green-700 hover:bg-green-800' : 'bg-green-600 hover:bg-green-700'
                                        } text-white transition-colors`}
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 size={18} className="mr-2 animate-spin" />
                                            <span>Saving...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} className="mr-2" />
                                            <span>Save Changes</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>


                <div className="mt-16 sm:mt-20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium mb-2">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName || user?.displayName || ""}
                                readOnly
                                placeholder="Your Full Name"
                                className={`w-full p-3 rounded-md cursor-not-allowed ${isDarkMode
                                    ? 'bg-neutral-900 border border-neutral-800 text-green-600'
                                    : 'bg-gray-100 border border-gray-300 text-gray-500'
                                    } focus:outline-none transition-colors`}
                            />

                        </div>

                        <div className="relative">
                            <label className="block text-sm font-medium mb-2">Gender</label>
                            <div
                                onClick={() => toggleDropdown('gender')}
                                className={`w-full p-3 rounded-md flex justify-between items-center cursor-pointer ${isDarkMode
                                    ? 'bg-neutral-900 border border-neutral-800'
                                    : 'bg-white border border-gray-300'
                                    }`}
                            >
                                <span className={formData.gender ? "" : "text-gray-500"}>
                                    {formData.gender || "Select Gender"}
                                </span>
                                <ChevronDown size={18} className="text-gray-500" />
                            </div>


                            {showDropdown.gender && (
                                <div className={`absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md shadow-lg ${isDarkMode ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"
                                    }`}>
                                    {genders.map((option) => (
                                        <div
                                            key={option}
                                            onClick={() => handleDropdownSelect('gender', option)}
                                            className={`px-4 py-2 cursor-pointer ${isDarkMode
                                                ? "hover:bg-neutral-800"
                                                : "hover:bg-gray-100"
                                                } ${formData.gender === option ? (isDarkMode ? "bg-neutral-800" : "bg-gray-100") : ""}`}
                                        >
                                            {option}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>


                        <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative">
                                <label className="block text-sm font-medium mb-2">Country</label>
                                <div
                                    onClick={() => toggleDropdown('country')}
                                    className={`w-full p-3 rounded-md flex justify-between items-center cursor-pointer ${isDarkMode
                                        ? 'bg-neutral-900 border border-neutral-800'
                                        : 'bg-white border border-gray-300'
                                        }`}
                                >
                                    <span className={formData.country ? "" : "text-gray-500"}>
                                        {formData.country || "Select Country"}
                                    </span>
                                    <ChevronDown size={18} className="text-gray-500" />
                                </div>

                                {showDropdown.country && (
                                    <div className={`absolute z-10 mt-1 w-full max-h-60 overflow-auto rounded-md shadow-lg ${isDarkMode ? "bg-neutral-900 border border-neutral-800" : "bg-white border border-gray-200"
                                        }`}>
                                        {countries.map((country: CountryOption) => (
                                            <div
                                                key={country.value}
                                                onClick={() => handleDropdownSelect('country', country.label)}
                                                className={`px-4 py-2 cursor-pointer ${isDarkMode
                                                    ? "hover:bg-neutral-800"
                                                    : "hover:bg-gray-100"
                                                    } ${formData.country === country.label ? (isDarkMode ? "bg-neutral-800" : "bg-gray-100") : ""}`}
                                            >
                                                {country.label}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium mb-2">Billing Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address || ""}
                                    onChange={handleInputChange}
                                    placeholder="Enter your billing address"
                                    className={`w-full p-3 rounded-md ${isDarkMode
                                        ? 'bg-neutral-900 border border-neutral-800 text-green-600'
                                        : 'bg-white border border-gray-300 text-gray-900'
                                        } focus:outline-none transition-colors`}
                                />
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;