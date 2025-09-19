// Mock all external dependencies first, before any imports
jest.mock("../models/productModel.js");
jest.mock("../models/categoryModel.js");
jest.mock("fs");
jest.mock("slugify");
jest.mock("dotenv");

// Now import everything after mocks are set up
import {
  createProductController,
  getProductController,
  getSingleProductController,
  productPhotoController,
  deleteProductController,
  updateProductController,
  productFiltersController,
  productCountController,
  productListController,
  searchProductController,
  relatedProductController,
  productCategoryController,
} from "./productController.js";

import productModel from "../models/productModel.js";
import categoryModel from "../models/categoryModel.js";
import fs from "fs";
import slugify from "slugify";

// Mock response helper
const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.set = jest.fn().mockReturnValue(res);
  return res;
};

// Test data
const mockProduct = {
  _id: "507f1f77bcf86cd799439011",
  name: "iPhone 13",
  slug: "iphone-13",
  description: "Latest Apple smartphone",
  price: 999,
  category: {
    _id: "507f1f77bcf86cd799439012",
    name: "Electronics",
    slug: "electronics",
  },
  quantity: 50,
  photo: {
    data: Buffer.from("fake-image-data"),
    contentType: "image/jpeg",
  },
  shipping: true,
};

const mockProducts = [
  { ...mockProduct },
  {
    _id: "507f1f77bcf86cd799439013",
    name: "Samsung Galaxy",
    slug: "samsung-galaxy",
    description: "Android smartphone",
    price: 799,
    category: mockProduct.category,
    quantity: 30,
  },
];

describe("ProductController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.log during tests to reduce noise
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.log after each test
    if (console.log.mockRestore) {
      console.log.mockRestore();
    }
  });

  describe("searchProductController", () => {
    it("should return products matching name (case-insensitive)", async () => {
      const req = { params: { keyword: "iPhone" } };
      const res = mockResponse();

      const mockChain = {
        select: jest.fn().mockResolvedValue([mockProduct]),
      };
      productModel.find = jest.fn().mockReturnValue(mockChain);

      await searchProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "iPhone", $options: "i" } },
          { description: { $regex: "iPhone", $options: "i" } },
        ],
      });
      expect(mockChain.select).toHaveBeenCalledWith("-photo");
      expect(res.json).toHaveBeenCalledWith([mockProduct]);
    });

    it("should return products matching description", async () => {
      const req = { params: { keyword: "smartphone" } };
      const res = mockResponse();

      const mockChain = {
        select: jest.fn().mockResolvedValue(mockProducts),
      };
      productModel.find = jest.fn().mockReturnValue(mockChain);

      await searchProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "smartphone", $options: "i" } },
          { description: { $regex: "smartphone", $options: "i" } },
        ],
      });
      expect(res.json).toHaveBeenCalledWith(mockProducts);
    });

    it("should return empty array when no matches found", async () => {
      const req = { params: { keyword: "nonexistent" } };
      const res = mockResponse();

      const mockChain = {
        select: jest.fn().mockResolvedValue([]),
      };
      productModel.find = jest.fn().mockReturnValue(mockChain);

      await searchProductController(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it("should handle special characters in search term", async () => {
      const req = { params: { keyword: "iPhone+" } };
      const res = mockResponse();

      const mockChain = {
        select: jest.fn().mockResolvedValue([]),
      };
      productModel.find = jest.fn().mockReturnValue(mockChain);

      await searchProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        $or: [
          { name: { $regex: "iPhone+", $options: "i" } },
          { description: { $regex: "iPhone+", $options: "i" } },
        ],
      });
    });

    it("should handle database errors gracefully", async () => {
      const req = { params: { keyword: "test" } };
      const res = mockResponse();

      productModel.find = jest.fn().mockImplementation(() => {
        throw new Error("Database error");
      });

      await searchProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error In Search Product API",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("getSingleProductController", () => {
    it("should return product with populated category for valid slug", async () => {
      const req = { params: { slug: "iphone-13" } };
      const res = mockResponse();

      const populateMock = jest.fn().mockResolvedValue(mockProduct);
      const selectMock = jest.fn().mockReturnValue({ populate: populateMock });

      productModel.findOne = jest.fn().mockReturnValue({ select: selectMock });

      await getSingleProductController(req, res);

      expect(productModel.findOne).toHaveBeenCalledWith({ slug: "iphone-13" });
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(populateMock).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Single Product Fetched",
          product: mockProduct,
        })
      );
    });

    it("should handle product not found", async () => {
      const req = { params: { slug: "nonexistent-product" } };
      const res = mockResponse();

      const populateMock = jest.fn().mockResolvedValue(null);
      const selectMock = jest.fn().mockReturnValue({ populate: populateMock });

      productModel.findOne = jest.fn().mockReturnValue({ select: selectMock });

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Single Product Fetched",
          product: null,
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const req = { params: { slug: "test-product" } };
      const res = mockResponse();

      productModel.findOne = jest.fn().mockImplementation(() => {
        throw new Error("DB Error");
      });

      await getSingleProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting single product",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("relatedProductController", () => {
    it("should return related products from same category", async () => {
      const req = {
        params: {
          pid: "507f1f77bcf86cd799439011",
          cid: "507f1f77bcf86cd799439012",
        },
      };
      const res = mockResponse();

      const relatedProducts = [
        { _id: "123", name: "Product 1", category: mockProduct.category },
        { _id: "456", name: "Product 2", category: mockProduct.category },
      ];

      const populateMock = jest.fn().mockResolvedValue(relatedProducts);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });

      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await relatedProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: "507f1f77bcf86cd799439012",
        _id: { $ne: "507f1f77bcf86cd799439011" },
      });
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(limitMock).toHaveBeenCalledWith(3);
      expect(populateMock).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          products: relatedProducts,
        })
      );
    });

    it("should return empty array when no related products found", async () => {
      const req = {
        params: {
          pid: "507f1f77bcf86cd799439011",
          cid: "507f1f77bcf86cd799439012",
        },
      };
      const res = mockResponse();

      const populateMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ populate: populateMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });

      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await relatedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          products: [],
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const req = { params: { pid: "123", cid: "456" } };
      const res = mockResponse();

      productModel.find = jest.fn().mockImplementation(() => {
        throw new Error("DB Error");
      });

      await relatedProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "error while getting related product",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("productPhotoController", () => {
    it("should serve photo with correct content-type header", async () => {
      const req = { params: { pid: "507f1f77bcf86cd799439011" } };
      const res = mockResponse();

      const photoData = Buffer.from("fake-image-data");
      const selectMock = jest.fn().mockResolvedValue({
        photo: {
          data: photoData,
          contentType: "image/jpeg",
        },
      });

      productModel.findById = jest.fn().mockReturnValue({ select: selectMock });

      await productPhotoController(req, res);

      expect(productModel.findById).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(selectMock).toHaveBeenCalledWith("photo");
      expect(res.set).toHaveBeenCalledWith("Content-type", "image/jpeg");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(photoData);
    });

    it("should handle product without photo", async () => {
      const req = { params: { pid: "507f1f77bcf86cd799439011" } };
      const res = mockResponse();

      const selectMock = jest.fn().mockResolvedValue({
        photo: {},
      });

      productModel.findById = jest.fn().mockReturnValue({ select: selectMock });

      await productPhotoController(req, res);

      expect(res.set).not.toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalledWith(200);
      expect(res.send).not.toHaveBeenCalled();
    });

    it("should handle missing product", async () => {
      const req = { params: { pid: "507f1f77bcf86cd799439011" } };
      const res = mockResponse();

      const selectMock = jest.fn().mockResolvedValue(null);
      productModel.findById = jest.fn().mockReturnValue({ select: selectMock });

      await productPhotoController(req, res);

      // The function will throw an error when trying to access null.photo
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting photo",
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const req = { params: { pid: "123" } };
      const res = mockResponse();

      productModel.findById = jest.fn().mockImplementation(() => {
        throw new Error("DB Error");
      });

      await productPhotoController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while getting photo",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("getProductController", () => {
    it("should return all products excluding photos", async () => {
      const req = {};
      const res = mockResponse();

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });

      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await getProductController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(populateMock).toHaveBeenCalledWith("category");
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(limitMock).toHaveBeenCalledWith(12);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          countTotal: mockProducts.length,
          message: "ALlProducts ",
          products: mockProducts,
        })
      );
    });

    it("should handle empty product collection", async () => {
      const req = {};
      const res = mockResponse();

      const sortMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const selectMock = jest.fn().mockReturnValue({ limit: limitMock });
      const populateMock = jest.fn().mockReturnValue({ select: selectMock });

      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          countTotal: 0,
          message: "ALlProducts ",
          products: [],
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const req = {};
      const res = mockResponse();

      productModel.find = jest.fn().mockImplementation(() => {
        throw new Error("DB Error");
      });

      await getProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in getting products",
          error: "DB Error",
        })
      );
    });
  });

  describe("productListController", () => {
    it("should return paginated products for page 1", async () => {
      const req = { params: { page: 1 } };
      const res = mockResponse();

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ skip: skipMock });

      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await productListController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(skipMock).toHaveBeenCalledWith(0); // (1 - 1) * 6 = 0
      expect(limitMock).toHaveBeenCalledWith(6);
      expect(sortMock).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          products: mockProducts,
        })
      );
    });

    it("should return paginated products for page 2", async () => {
      const req = { params: { page: 2 } };
      const res = mockResponse();

      const sortMock = jest.fn().mockResolvedValue([]);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ skip: skipMock });

      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await productListController(req, res);

      expect(skipMock).toHaveBeenCalledWith(6); // (2 - 1) * 6 = 6
      expect(limitMock).toHaveBeenCalledWith(6);
    });

    it("should use page 1 as default when page param is missing", async () => {
      const req = { params: {} };
      const res = mockResponse();

      const sortMock = jest.fn().mockResolvedValue(mockProducts);
      const limitMock = jest.fn().mockReturnValue({ sort: sortMock });
      const skipMock = jest.fn().mockReturnValue({ limit: limitMock });
      const selectMock = jest.fn().mockReturnValue({ skip: skipMock });

      productModel.find = jest.fn().mockReturnValue({ select: selectMock });

      await productListController(req, res);

      expect(skipMock).toHaveBeenCalledWith(0); // Default page 1
    });

    it("should handle database errors gracefully", async () => {
      const req = { params: { page: 1 } };
      const res = mockResponse();

      productModel.find = jest.fn().mockImplementation(() => {
        throw new Error("DB Error");
      });

      await productListController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "error in per page ctrl",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("productCountController", () => {
    it("should return correct total count of products", async () => {
      const req = {};
      const res = mockResponse();

      const estimatedDocumentCountMock = jest.fn().mockResolvedValue(42);
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: estimatedDocumentCountMock,
      });

      await productCountController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(estimatedDocumentCountMock).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          total: 42,
        })
      );
    });

    it("should handle empty product collection (return 0)", async () => {
      const req = {};
      const res = mockResponse();

      const estimatedDocumentCountMock = jest.fn().mockResolvedValue(0);
      productModel.find = jest.fn().mockReturnValue({
        estimatedDocumentCount: estimatedDocumentCountMock,
      });

      await productCountController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          total: 0,
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const req = {};
      const res = mockResponse();

      productModel.find = jest.fn().mockImplementation(() => {
        throw new Error("DB Error");
      });

      await productCountController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Error in product count",
          error: expect.any(Error),
          success: false,
        })
      );
    });
  });

  describe("productFiltersController", () => {
    it("should filter by price range when provided", async () => {
      const req = {
        body: {
          checked: [],
          radio: [100, 500],
        },
      };
      const res = mockResponse();

      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        price: { $gte: 100, $lte: 500 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          products: mockProducts,
        })
      );
    });

    it("should filter by category when provided", async () => {
      const req = {
        body: {
          checked: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
          radio: [],
        },
      };
      const res = mockResponse();

      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: ["507f1f77bcf86cd799439012", "507f1f77bcf86cd799439013"],
      });
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should filter by both price and category", async () => {
      const req = {
        body: {
          checked: ["507f1f77bcf86cd799439012"],
          radio: [500, 1000],
        },
      };
      const res = mockResponse();

      productModel.find.mockResolvedValue([mockProduct]);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({
        category: ["507f1f77bcf86cd799439012"],
        price: { $gte: 500, $lte: 1000 },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          products: [mockProduct],
        })
      );
    });

    it("should return all products when no filters provided", async () => {
      const req = {
        body: {
          checked: [],
          radio: [],
        },
      };
      const res = mockResponse();

      productModel.find.mockResolvedValue(mockProducts);

      await productFiltersController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("should handle database errors gracefully", async () => {
      const req = {
        body: {
          checked: [],
          radio: [100, 500],
        },
      };
      const res = mockResponse();

      productModel.find.mockRejectedValue(new Error("DB Error"));

      await productFiltersController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error WHile Filtering Products",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("createProductController", () => {
    it("should return error if name is missing", async () => {
      const req = {
        fields: {
          description: "Test description",
          price: 100,
          category: "123",
          quantity: 10,
        },
        files: {},
      };
      const res = mockResponse();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
    });

    it("should return error if description is missing", async () => {
      const req = {
        fields: {
          name: "Test Product",
          price: 100,
          category: "123",
          quantity: 10,
        },
        files: {},
      };
      const res = mockResponse();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "Description is Required",
      });
    });

    it("should return error if price is missing", async () => {
      const req = {
        fields: {
          name: "Test Product",
          description: "Test description",
          category: "123",
          quantity: 10,
        },
        files: {},
      };
      const res = mockResponse();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Price is Required" });
    });

    it("should return error if category is missing", async () => {
      const req = {
        fields: {
          name: "Test Product",
          description: "Test description",
          price: 100,
          quantity: 10,
        },
        files: {},
      };
      const res = mockResponse();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Category is Required" });
    });

    it("should return error if quantity is missing", async () => {
      const req = {
        fields: {
          name: "Test Product",
          description: "Test description",
          price: 100,
          category: "123",
        },
        files: {},
      };
      const res = mockResponse();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Quantity is Required" });
    });

    it("should return error if photo size exceeds 1MB", async () => {
      const req = {
        fields: {
          name: "Test Product",
          description: "Test description",
          price: 100,
          category: "123",
          quantity: 10,
        },
        files: {
          photo: {
            size: 1000001,
            path: "/tmp/test.jpg",
            type: "image/jpeg",
          },
        },
      };
      const res = mockResponse();

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "photo is Required and should be less then 1mb",
      });
    });

    it("should create product successfully with photo", async () => {
      const req = {
        fields: {
          name: "Test Product",
          description: "Test description",
          price: 100,
          category: "123",
          quantity: 10,
          shipping: true,
        },
        files: {
          photo: {
            size: 500000,
            path: "/tmp/test.jpg",
            type: "image/jpeg",
          },
        },
      };
      const res = mockResponse();

      slugify.mockReturnValue("test-product");
      fs.readFileSync.mockReturnValue(Buffer.from("fake-image-data"));

      const mockSave = jest.fn().mockResolvedValue({
        ...req.fields,
        slug: "test-product",
        photo: {
          data: Buffer.from("fake-image-data"),
          contentType: "image/jpeg",
        },
      });

      productModel.mockImplementation(() => ({
        save: mockSave,
        photo: {},
      }));

      await createProductController(req, res);

      expect(slugify).toHaveBeenCalledWith("Test Product");
      expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/test.jpg");
      expect(mockSave).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Created Successfully",
        })
      );
    });

    it("should create product successfully without photo", async () => {
      const req = {
        fields: {
          name: "Test Product",
          description: "Test description",
          price: 100,
          category: "123",
          quantity: 10,
        },
        files: {},
      };
      const res = mockResponse();

      slugify.mockReturnValue("test-product");

      const mockSave = jest.fn().mockResolvedValue({
        ...req.fields,
        slug: "test-product",
      });

      productModel.mockImplementation(() => ({
        save: mockSave,
      }));

      await createProductController(req, res);

      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Created Successfully",
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const req = {
        fields: {
          name: "Test Product",
          description: "Test description",
          price: 100,
          category: "123",
          quantity: 10,
        },
        files: {},
      };
      const res = mockResponse();

      slugify.mockReturnValue("test-product");
      productModel.mockImplementation(() => ({
        save: jest.fn().mockRejectedValue(new Error("DB Error")),
      }));

      await createProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in creating product",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("updateProductController", () => {
    it("should update product successfully with all fields", async () => {
      const req = {
        params: { pid: "507f1f77bcf86cd799439011" },
        fields: {
          name: "Updated Product",
          description: "Updated description",
          price: 200,
          category: "123",
          quantity: 20,
          shipping: false,
        },
        files: {
          photo: {
            size: 500000,
            path: "/tmp/updated.jpg",
            type: "image/jpeg",
          },
        },
      };
      const res = mockResponse();

      slugify.mockReturnValue("updated-product");
      fs.readFileSync.mockReturnValue(Buffer.from("updated-image-data"));

      const mockUpdatedProduct = {
        ...req.fields,
        slug: "updated-product",
        save: jest.fn().mockResolvedValue(true),
        photo: {},
      };

      productModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedProduct);

      await updateProductController(req, res);

      expect(productModel.findByIdAndUpdate).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011",
        expect.objectContaining({
          ...req.fields,
          slug: "updated-product",
        }),
        { new: true }
      );
      expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/updated.jpg");
      expect(mockUpdatedProduct.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Updated Successfully",
        })
      );
    });

    it("should update product successfully without photo", async () => {
      const req = {
        params: { pid: "507f1f77bcf86cd799439011" },
        fields: {
          name: "Updated Product",
          description: "Updated description",
          price: 200,
          category: "123",
          quantity: 20,
        },
        files: {},
      };
      const res = mockResponse();

      slugify.mockReturnValue("updated-product");

      const mockUpdatedProduct = {
        ...req.fields,
        slug: "updated-product",
        save: jest.fn().mockResolvedValue(true),
      };

      productModel.findByIdAndUpdate.mockResolvedValue(mockUpdatedProduct);

      await updateProductController(req, res);

      expect(fs.readFileSync).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it("should return error if name is missing", async () => {
      const req = {
        params: { pid: "507f1f77bcf86cd799439011" },
        fields: {
          description: "Updated description",
          price: 200,
          category: "123",
          quantity: 20,
        },
        files: {},
      };
      const res = mockResponse();

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({ error: "Name is Required" });
      expect(productModel.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    it("should return error if photo size exceeds 1MB", async () => {
      const req = {
        params: { pid: "507f1f77bcf86cd799439011" },
        fields: {
          name: "Updated Product",
          description: "Updated description",
          price: 200,
          category: "123",
          quantity: 20,
        },
        files: {
          photo: {
            size: 1000001,
            path: "/tmp/large.jpg",
            type: "image/jpeg",
          },
        },
      };
      const res = mockResponse();

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith({
        error: "photo is Required and should be less then 1mb",
      });
    });

    it("should handle database errors gracefully", async () => {
      const req = {
        params: { pid: "507f1f77bcf86cd799439011" },
        fields: {
          name: "Updated Product",
          description: "Updated description",
          price: 200,
          category: "123",
          quantity: 20,
        },
        files: {},
      };
      const res = mockResponse();

      slugify.mockReturnValue("updated-product");
      productModel.findByIdAndUpdate.mockRejectedValue(new Error("DB Error"));

      await updateProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error in Update product",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("deleteProductController", () => {
    it("should delete product successfully", async () => {
      const req = { params: { pid: "507f1f77bcf86cd799439011" } };
      const res = mockResponse();

      const selectMock = jest.fn().mockResolvedValue(true);
      productModel.findByIdAndDelete = jest
        .fn()
        .mockReturnValue({ select: selectMock });

      await deleteProductController(req, res);

      expect(productModel.findByIdAndDelete).toHaveBeenCalledWith(
        "507f1f77bcf86cd799439011"
      );
      expect(selectMock).toHaveBeenCalledWith("-photo");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Deleted successfully",
        })
      );
    });

    it("should handle deletion of non-existent product", async () => {
      const req = { params: { pid: "507f1f77bcf86cd799439011" } };
      const res = mockResponse();

      const selectMock = jest.fn().mockResolvedValue(null);
      productModel.findByIdAndDelete = jest
        .fn()
        .mockReturnValue({ select: selectMock });

      await deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Product Deleted successfully",
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const req = { params: { pid: "507f1f77bcf86cd799439011" } };
      const res = mockResponse();

      productModel.findByIdAndDelete = jest.fn().mockImplementation(() => {
        throw new Error("DB Error");
      });

      await deleteProductController(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error while deleting product",
          error: expect.any(Error),
        })
      );
    });
  });

  describe("productCategoryController", () => {
    it("should return products by category successfully", async () => {
      const req = { params: { slug: "electronics" } };
      const res = mockResponse();

      const mockCategory = {
        _id: "507f1f77bcf86cd799439012",
        name: "Electronics",
        slug: "electronics",
      };

      categoryModel.findOne.mockResolvedValue(mockCategory);

      const populateMock = jest.fn().mockResolvedValue(mockProducts);
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await productCategoryController(req, res);

      expect(categoryModel.findOne).toHaveBeenCalledWith({
        slug: "electronics",
      });
      expect(productModel.find).toHaveBeenCalledWith({
        category: mockCategory,
      });
      expect(populateMock).toHaveBeenCalledWith("category");
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          category: mockCategory,
          products: mockProducts,
        })
      );
    });

    it("should handle category not found", async () => {
      const req = { params: { slug: "nonexistent" } };
      const res = mockResponse();

      categoryModel.findOne.mockResolvedValue(null);

      const populateMock = jest.fn().mockResolvedValue([]);
      productModel.find = jest.fn().mockReturnValue({ populate: populateMock });

      await productCategoryController(req, res);

      expect(productModel.find).toHaveBeenCalledWith({ category: null });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          category: null,
          products: [],
        })
      );
    });

    it("should handle database errors gracefully", async () => {
      const req = { params: { slug: "electronics" } };
      const res = mockResponse();

      categoryModel.findOne.mockRejectedValue(new Error("DB Error"));

      await productCategoryController(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Error While Getting products",
          error: expect.any(Error),
        })
      );
    });
  });
});
