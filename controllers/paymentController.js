import orderModel from "../models/orderModel.js";
import braintree from "braintree";
import dotenv from "dotenv";

dotenv.config();

//payment gateway
var gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

//payment gateway api token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, function (error, response) {
      if (error) {
        res.status(500).send(error);
      } else {
        res.send(response);
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
};

//payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart } = req.body;
    if (!Array.isArray(cart) || cart.length === 0) {
      res.status(400).json({ error: "Cart is required" });
      return;
    }
    if (!nonce) {
      res.status(400).json({ error: "Payment nonce is required" });
      return;
    }

    // Validate and compute total
    const total = cart
      .reduce((sum, item, i) => {
        if (typeof item?.price !== "number") {
          res
            .status(400)
            .json({ error: `Invalid price at index ${i}: ${item?.price}` });
          return;
        }
        const price = Number(item?.price);
        if (!Number.isFinite(price) || price < 0) {
          res
            .status(400)
            .json({ error: `Invalid price at index ${i}: ${price}` });
          return;
        }
        return sum + price;
      }, 0)
      .toFixed(2);

    if (total <= 0) {
      res.status(400).json({ error: "Total amount must be greater than 0" });
      return;
    }

    // Process transaction (wrap in Promise)
    const result = await new Promise((resolve, reject) => {
      gateway.transaction.sale(
        {
          amount: total,
          paymentMethodNonce: nonce,
          options: { submitForSettlement: true },
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
    });

    // Handle result
    if (result?.success) {
      const order = await new orderModel({
        products: cart,
        payment: result,
        buyer: req.user._id,
      }).save();
      res.json({ ok: true, orderId: order._id });
      return;
    }
    res.status(500).json({ error: result.message || "Payment failed" });
    return;
  } catch (error) {
    console.error("Payment controller error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
    return;
  }
};
