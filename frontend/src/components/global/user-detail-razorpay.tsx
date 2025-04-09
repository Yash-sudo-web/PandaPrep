"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Funnel_Display } from "next/font/google";
import axios from "axios";
import { Toaster, toast } from "sonner";


const funnel_display = Funnel_Display({
    subsets: ["latin"],
    weight: "400",
});

export interface CustomerDetailsDialogProps {
    idToken: string;
    userId: string;
    BASE_URL: string;
}

export interface Plan {
    title: string;
    cost: number;
    credits: number;
    price?: string;
    features?: string[];
    limitations?: string[];
}

export interface CustomerDetailsDialogRef {
    openDialog: (plan: Plan) => void;
}

const CustomerDetailsDialog = React.forwardRef<CustomerDetailsDialogRef, CustomerDetailsDialogProps>(
    ({ idToken, userId, BASE_URL }, ref) => {
        const [open, setOpen] = React.useState(false);
        const [currentPlan, setCurrentPlan] = React.useState<Plan | null>(null);
        const [customerDetails, setCustomerDetails] = React.useState({
            name: "",
            email: "",
            contact: "",
        });

        const [errors, setErrors] = useState({
            name: '',
            email: '',
            contact: ''
        });

        const [formValid, setFormValid] = useState(false);

        const validateName = (name:string) => {
            return name.trim().length >= 2;
        };

        const validateEmail = (email:string) => {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return emailRegex.test(email);
        };

        const validateContact = (contact:any) => {
            const contactRegex = /^\d{10}$/;
            return contactRegex.test(contact);
        };

        // Validate entire form
        useEffect(() => {
            const isValid = 
                validateName(customerDetails.name) && 
                validateEmail(customerDetails.email) && 
                validateContact(customerDetails.contact);
            setFormValid(isValid);
        }, [customerDetails]);

        const { theme, resolvedTheme } = useTheme();
        const [mounted, setMounted] = useState(false);

        useEffect(() => {
            setMounted(true);
        }, []);

        const isDarkMode = mounted && resolvedTheme === "dark";

        // Function to open dialog with specific plan
        const openDialog = (plan: Plan) => {
            setCurrentPlan(plan);
            setOpen(true);
            // Reset form state when dialog opens
            setCustomerDetails({
                name: "",
                email: "",
                contact: "",
            });
            setErrors({
                name: '',
                email: '',
                contact: ''
            });
        };

        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            setCustomerDetails((prev) => ({
                ...prev,
                [name]: value,
            }));
            
            // Clear error when user starts typing
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            const { name, value } = e.target;
            
            // Validate fields on blur
            if (name === 'name') {
                if (!value.trim()) {
                    setErrors(prev => ({ ...prev, name: 'Name is required' }));
                } else if (!validateName(value)) {
                    setErrors(prev => ({ ...prev, name: 'Name must be at least 2 characters' }));
                }
            }
            
            if (name === 'email') {
                if (!value.trim()) {
                    setErrors(prev => ({ ...prev, email: 'Email is required' }));
                } else if (!validateEmail(value)) {
                    setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
                }
            }
            
            if (name === 'contact') {
                if (!value.trim()) {
                    setErrors(prev => ({ ...prev, contact: 'Contact number is required' }));
                } else if (!validateContact(value)) {
                    setErrors(prev => ({ ...prev, contact: 'Please enter a valid 10-digit contact number' }));
                }
            }
        };

        const validateForm = () => {
            const newErrors = {
                name: !customerDetails.name.trim() ? 'Name is required' : 
                      !validateName(customerDetails.name) ? 'Name must be at least 2 characters' : '',
                email: !customerDetails.email.trim() ? 'Email is required' : 
                       !validateEmail(customerDetails.email) ? 'Please enter a valid email address' : '',
                contact: !customerDetails.contact.trim() ? 'Contact number is required' : 
                         !validateContact(customerDetails.contact) ? 'Please enter a valid 10-digit contact number' : ''
            };
            
            setErrors(newErrors);
            
            // Check if there are any errors
            return !Object.values(newErrors).some(error => error);
        };

        const handleProceed = async () => {
            if (!currentPlan) return;

            // Validate form before proceeding
            if (!validateForm()) {
                toast.error("Please correct the errors in the form");
                return;
            }

            setOpen(false);

            if (!idToken || !userId) {
                console.error("Auth token or user ID not available");
                return;
            }

            try {
                const { data } = await axios.post(
                    `${BASE_URL}/payment/create-order`,
                    {
                        userId: userId,
                        amount: currentPlan.cost,
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${idToken}`,
                        },
                    }
                );

                const { order } = data;
                if (!order) throw new Error("Order creation failed");

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                    amount: order.amount * 100,
                    currency: "INR",
                    name: "PandaPrep",
                    description: `${currentPlan.title} Plan - ${currentPlan.credits} Credits`,
                    order_id: order.id,
                    method: {
                        netbanking: true,
                        card: true,
                        wallet: true,
                        upi: true,
                        paylater: true,
                        emi: true,
                    },
                    config: {
                        display: {
                            blocks: {
                                upi: {
                                    name: "Pay using UPI",
                                    instruments: [{ method: "upi" }],
                                },
                                cards: {
                                    name: "Pay using Card",
                                    instruments: [{ method: "card" }],
                                },
                                wallets: {
                                    name: "Pay using Wallets",
                                    instruments: [{ method: "wallet" }],
                                },
                            },
                            sequence: ["upi", "cards", "wallets"],
                            preferences: {
                                show_default_blocks: true,
                            },
                        },
                        recommended: {
                            method: ["upi", "card"],
                            description: "Recommended payment options"
                        }
                    },
                    handler: async (response: any) => {
                        try {
                            const verifyRes = await axios.post(
                                `${BASE_URL}/payment/verify-order`,
                                {
                                    userId: userId,
                                    order_id: order.id,
                                    payment_id: response.razorpay_payment_id,
                                    signature: response.razorpay_signature,
                                },
                                {
                                    headers: {
                                        Authorization: `Bearer ${idToken}`,
                                    },
                                }
                            );

                            if (verifyRes.data.success) {
                                toast.success("Payment Successful! Credits Updated.");
                            } else {
                                toast.error("Payment verification failed.");
                            }
                        } catch (error) {
                            toast.error("An error occurred during payment verification.");
                        }
                    },
                    prefill: customerDetails,
                    theme: { color:"#2E7D32" },
                    modal: {
                        ondismiss: () => {
                            toast.warning("Payment process timed out. Please try again.");
                        },
                    },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            } catch (error) {
                console.error("Payment error:", error);
                toast.error("Payment initiation failed. Please try again.");
            }
        };

        React.useImperativeHandle(ref, () => ({
            openDialog,
        }));


        const themeClasses = {
            dialog: isDarkMode ? "border border-green-600 bg-neutral-900" : "border-3 border-green-200 bg-white",
            title: isDarkMode ? "text-green-600" : "text-green-600",
            description: isDarkMode ? "text-slate-300" : "text-slate-600",
            label: isDarkMode ? "text-green-600" : "text-green-600",
            button: isDarkMode
                ? "bg-green-800 text-white hover:text-green-600 hover:bg-white cursor-pointer"
                : "bg-green-700 border border-green-600 hover:bg-green-200 hover:text-black text-white cursor-pointer",
            error: "text-red-500 text-xs mt-1",
            inputError: "border-red-500",
        };

        return (
            <>
                <Toaster richColors position="top-right" closeButton={true} />
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogContent
                        className={`sm:max-w-md ${themeClasses.dialog} ${funnel_display.className}`}
                    >
                        <DialogHeader>
                            <DialogTitle className={`${themeClasses.title} text-xl font-semibold ${funnel_display.className}`}>
                                Customer Information
                            </DialogTitle>
                            <DialogDescription className={`${themeClasses.description} ${funnel_display.className}`}>
                                Please provide your details for the payment process.
                            </DialogDescription>
                        </DialogHeader>
                        <div className={`grid gap-4 py-4 ${funnel_display.className}`}>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="name" className={` ${themeClasses.label} ${funnel_display.className}`}>
                                    Name
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="name"
                                        name="name"
                                        value={customerDetails.name}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Enter your name"
                                        className={`w-full ${funnel_display.className} ${errors.name ? themeClasses.inputError : ''}`}
                                    />
                                    {errors.name && <p className={themeClasses.error}>{errors.name}</p>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="email" className={` ${themeClasses.label} ${funnel_display.className}`}>
                                    Email
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={customerDetails.email}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Enter your email"
                                        className={`w-full ${funnel_display.className} ${errors.email ? themeClasses.inputError : ''}`}
                                    />
                                    {errors.email && <p className={themeClasses.error}>{errors.email}</p>}
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="contact" className={`${themeClasses.label} ${funnel_display.className}`}>
                                    Contact
                                </Label>
                                <div className="col-span-3">
                                    <Input
                                        id="contact"
                                        name="contact"
                                        value={customerDetails.contact}
                                        onChange={handleChange}
                                        onBlur={handleBlur}
                                        placeholder="Enter your contact number"
                                        className={`w-full ${funnel_display.className} ${errors.contact ? themeClasses.inputError : ''}`}
                                    />
                                    {errors.contact && <p className={themeClasses.error}>{errors.contact}</p>}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button 
                                type="button" 
                                onClick={handleProceed} 
                                className={`${themeClasses.button} ${funnel_display.className}`}
                                disabled={!formValid}
                            >
                                Proceed to Payment
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        );
    }
);

CustomerDetailsDialog.displayName = "CustomerDetailsDialog";

export default CustomerDetailsDialog;