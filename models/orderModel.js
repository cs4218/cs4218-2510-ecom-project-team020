import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    products: [
      {
        type: mongoose.ObjectId,
        ref: "Products",
        required: true,
      },
    ],
    payment: {
      type: Object,
      required: true,
    },
    buyer: {
      type: mongoose.ObjectId,
      ref: "users",
      required: true,
    },
    status: {
      type: String,
      default: "Not Processed",
      enum: ["Not Processed", "Processing", "Shipped", "Delivered", "Cancelled"],
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);