import fs from "fs";
import slugify from "slugify";
import braintree from "braintree";
import dotenv from "dotenv";
import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import orderModel from "../models/orderModel.js";

dotenv.config();

// Payment gateway
const gateway = new braintree.BraintreeGateway({
  environment: braintree.Environment.Sandbox,
  merchantId: process.env.BRAINTREE_MERCHANT_ID,
  publicKey: process.env.BRAINTREE_PUBLIC_KEY,
  privateKey: process.env.BRAINTREE_PRIVATE_KEY,
});

// Create
export const createProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } = req.fields || {};
    const photo = req.files?.photo;

    switch (true) {
      case !name:
        return res.status(400).send({ success: false, error: "Name is required" });
      case !description:
        return res.status(400).send({ success: false, error: "Description is required" });
      case !price:
        return res.status(400).send({ success: false, error: "Price is required" });
      case !category:
        return res.status(400).send({ success: false, error: "Category is required" });
      case !quantity:
        return res.status(400).send({ success: false, error: "Quantity is required" });
      case !!(photo && photo.size > 1_000_000):
        return res
          .status(400)
          .send({ success: false, error: "Photo is required and should be less than 1MB" });
      default:
    }

    const products = new productModel({
      ...req.fields,
      slug: slugify(name, { lower: true, strict: true }),
    });

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.mimetype || photo.type || "application/octet-stream";
    }

    await products.save();

    res.status(201).send({
      success: true,
      message: "Product created successfully",
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error creating product",
      error: error.message,
    });
  }
};

// Read all (paginated preview)
export const getProductController = async (req, res) => {
  try {
    const products = await productModel
      .find({})
      .populate("category")
      .select("-photo")
      .limit(12)
      .sort({ createdAt: -1 });

    res.status(200).send({
      success: true,
      countTotal: products.length,
      message: "All products",
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error getting products",
      error: error.message,
    });
  }
};

// Read single
export const getSingleProductController = async (req, res) => {
  try {
    const product = await productModel
      .findOne({ slug: req.params.slug })
      .select("-photo")
      .populate("category");

    if (!product) {
      return res.status(404).send({
        success: false,
        message: "Product not found",
      });
    }

    res.status(200).send({
      success: true,
      message: "Single product fetched",
      product,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error getting single product",
      error: error.message,
    });
  }
};

// Photo
export const productPhotoController = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.pid).select("photo");
    if (product?.photo?.data) {
      res.set("Content-Type", product.photo.contentType || "application/octet-stream");
      return res.status(200).send(product.photo.data);
    }
    return res.status(404).send({ success: false, message: "Photo not found" });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error getting photo",
      error: error.message,
    });
  }
};

// Delete
export const deleteProductController = async (req, res) => {
  try {
    const deleted = await productModel.findByIdAndDelete(req.params.pid);
    if (!deleted) {
      return res.status(404).send({ success: false, message: "Product not found" });
    }
    res.status(200).send({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error deleting product",
      error: error.message,
    });
  }
};

// Update
export const updateProductController = async (req, res) => {
  try {
    const { name, description, price, category, quantity, shipping } = req.fields || {};
    const photo = req.files?.photo;

    switch (true) {
      case !name:
        return res.status(400).send({ success: false, error: "Name is required" });
      case !description:
        return res.status(400).send({ success: false, error: "Description is required" });
      case !price:
        return res.status(400).send({ success: false, error: "Price is required" });
      case !category:
        return res.status(400).send({ success: false, error: "Category is required" });
      case !quantity:
        return res.status(400).send({ success: false, error: "Quantity is required" });
      case !!(photo && photo.size > 1_000_000):
        return res
          .status(400)
          .send({ success: false, error: "Photo should be less than 1MB" });
      default:
    }

    const products = await productModel.findByIdAndUpdate(
      req.params.pid,
      { ...req.fields, slug: slugify(name, { lower: true, strict: true }) },
      { new: true }
    );

    if (!products) {
      return res.status(404).send({ success: false, message: "Product not found" });
    }

    if (photo) {
      products.photo.data = fs.readFileSync(photo.path);
      products.photo.contentType = photo.mimetype || photo.type || "application/octet-stream";
    }

    await products.save();

    res.status(200).send({
      success: true,
      message: "Product updated successfully",
      products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error updating product",
      error: error.message,
    });
  }
};

// Filters
export const productFiltersController = async (req, res) => {
  try {
    const { checked = [], radio = [] } = req.body || {};
    const args = {};
    if (checked.length > 0) args.category = { $in: checked };
    if (radio.length === 2) args.price = { $gte: radio[0], $lte: radio[1] };

    const products = await productModel.find(args).select("-photo");
    res.status(200).send({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while filtering products",
      error: error.message,
    });
  }
};

// Count
export const productCountController = async (req, res) => {
  try {
    const total = await productModel.estimatedDocumentCount();
    res.status(200).send({ success: true, total });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in product count",
      error: error.message,
    });
  }
};

// List by page
export const productListController = async (req, res) => {
  try {
    const perPage = 6;
    const page = Math.max(parseInt(req.params.page, 10) || 1, 1);

    const products = await productModel
      .find({})
      .select("-photo")
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ createdAt: -1 });

    res.status(200).send({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in per-page controller",
      error: error.message,
    });
  }
};

// Search
export const searchProductController = async (req, res) => {
  try {
    const { keyword = "" } = req.params;
    const results = await productModel
      .find({
        $or: [
          { name: { $regex: keyword, $options: "i" } },
          { description: { $regex: keyword, $options: "i" } },
        ],
      })
      .select("-photo");

    res.status(200).send({ success: true, results });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error in search product API",
      error: error.message,
    });
  }
};

// Related
export const relatedProductController = async (req, res) => {
  try {
    const { pid, cid } = req.params;
    const products = await productModel
      .find({ category: cid, _id: { $ne: pid } })
      .select("-photo")
      .limit(3)
      .populate("category");

    res.status(200).send({ success: true, products });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while getting related products",
      error: error.message,
    });
  }
};

// By category
export const productCategoryController = async (req, res) => {
  try {
    const category = await categoryModel.findOne({ slug: req.params.slug });
    if (!category) {
      return res.status(404).send({ success: false, message: "Category not found" });
    }

    const products = await productModel.find({ category }).populate("category");
    res.status(200).send({ success: true, category, products });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while getting products by category",
      error: error.message,
    });
  }
};

// Braintree: client token
export const braintreeTokenController = async (req, res) => {
  try {
    gateway.clientToken.generate({}, (err, response) => {
      if (err) return res.status(500).send({ success: false, message: "Token error", error: err });
      return res.status(200).send(response);
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Token error", error: error.message });
  }
};

// Braintree: payment
export const brainTreePaymentController = async (req, res) => {
  try {
    const { nonce, cart = [] } = req.body || {};
    if (!Array.isArray(cart) || cart.length === 0) {
      return res.status(400).send({ success: false, message: "Cart is empty" });
    }

    const total = cart.reduce((sum, item) => sum + Number(item.price || 0), 0);

    gateway.transaction.sale(
      {
        amount: total.toFixed(2),
        paymentMethodNonce: nonce,
        options: { submitForSettlement: true },
      },
      async (error, result) => {
        if (error || !result?.success) {
          return res
            .status(500)
            .send({ success: false, message: "Payment failed", error: error || result });
        }

        try {
          await new orderModel({
            products: cart,
            payment: result,
            buyer: req.user?._id,
          }).save();

          return res.status(200).send({ success: true, ok: true });
        } catch (saveErr) {
          console.error(saveErr);
          return res
            .status(500)
            .send({ success: false, message: "Order save failed", error: saveErr.message });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send({ success: false, message: "Payment error", error: error.message });
  }
};
