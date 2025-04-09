import mongoose from "mongoose";

const PaymentLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    razorpayOrderId: { type: String, required: true },
    razorpayPaymentId: String,
    razorpaySignature: String,
    amount: Number,
    status: { type: String, enum: ["Pending", "Success", "Failed"], default: "Pending" },
    createdAt: { type: Date, default: Date.now },
});

export const PaymentLogModel = mongoose.model("PaymentLog", PaymentLogSchema);
