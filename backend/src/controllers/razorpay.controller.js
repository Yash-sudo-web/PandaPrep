import Razorpay from 'razorpay';
import crypto from 'crypto';
import { UserModel } from "../models/user.model.js";
import { PaymentLogModel } from "../models/payment-logs.model.js";

import dotenv from 'dotenv';
dotenv.config();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createOrderController = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        const paymentAmount = amount * 100;

        const timestamp = Date.now().toString().slice(-10);
        const truncatedUserId = userId.toString().slice(0, 20);
        const receipt = `rcpt_${truncatedUserId}_${timestamp}`.slice(0, 40);

        const options = {
            amount: paymentAmount,
            currency: "INR",
            receipt: receipt,
        };

        const order = await razorpay.orders.create(options);

        const paymentLog = new PaymentLogModel({
            userId,
            razorpayOrderId: order.id,
            amount: amount,
            status: "Pending",
        });

        await paymentLog.save();

        res.json({ success: true, order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
}

export const verifyPaymentController = async (req, res) => {
    try {
        const { userId, order_id, payment_id, signature } = req.body;

        const paymentLog = await PaymentLogModel.findOne({ razorpayOrderId: order_id });
        if (!paymentLog) return res.status(400).json({ success: false, error: "Invalid Order ID" });

        const generatedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(order_id + "|" + payment_id)
            .digest("hex");

        if (generatedSignature !== signature) {
            paymentLog.status = "Failed";
            await paymentLog.save();
            return res.status(400).json({ success: false, error: "Payment Verification Failed" });
        }

        paymentLog.status = "Success";
        paymentLog.razorpayPaymentId = payment_id;
        paymentLog.razorpaySignature = signature;
        await paymentLog.save();

        const user = await UserModel.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: "User not found" });

        const creditsMap = {
            800: 100,
            2000: 500,
            3500: 1000,
        };

        user.subscription.credits += creditsMap[paymentLog.amount] || 0;
        user.subscription.plan = "paid";
        await user.save();

        res.json({ success: true, message: "Payment verified, credits added", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Server Error" });
    }
}