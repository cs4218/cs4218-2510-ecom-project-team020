jest.mock("dotenv", () => ({
  __esModule: true,
  default: { config: jest.fn() },
}));

jest.mock("fs", () => ({
  __esModule: true,
  default: { readFileSync: jest.fn(() => Buffer.from("image-bytes")) },
}));
import fs from "fs";

jest.mock("slugify", () => ({
  __esModule: true,
  default: jest.fn(
    (s) => `slug-${String(s).toLowerCase().replace(/\s+/g, "-")}`,
  ),
}));
import slugify from "slugify";

// braintree (default import style with new braintree.BraintreeGateway)
const mockClientTokenGenerate = jest.fn();
const mockTransactionSale = jest.fn();
jest.mock("braintree", () => ({
  __esModule: true,
  default: {
    BraintreeGateway: jest.fn().mockImplementation(() => ({
      clientToken: { generate: (...args) => mockClientTokenGenerate(...args) },
      transaction: { sale: (...args) => mockTransactionSale(...args) },
    })),
    Environment: { Sandbox: "Sandbox" },
  },
}));

const mockProductFind = jest.fn();
const mockProductFindOne = jest.fn();
const mockProductFindById = jest.fn();
const mockProductFindByIdAndDelete = jest.fn();
const mockProductFindByIdAndUpdate = jest.fn();
const mockProductEstimatedDocCount = jest.fn();

jest.mock("../models/productModel.js", () => ({
  __esModule: true,
  default: class Product {
    constructor(doc) {
      Object.assign(this, doc);
      this.photo = this.photo || {};
      this.save = jest.fn().mockResolvedValue(this);
    }
    static find(q) {
      return mockProductFind(q);
    }
    static findOne(q) {
      return mockProductFindOne(q);
    }
    static findById(id) {
      return mockProductFindById(id);
    }
    static findByIdAndDelete(id) {
      return mockProductFindByIdAndDelete(id);
    }
    static findByIdAndUpdate(id, update, opts) {
      return mockProductFindByIdAndUpdate(id, update, opts);
    }
    static estimatedDocumentCount() {
      return mockProductEstimatedDocCount();
    }
  },
}));

const mockCategoryFindOne = jest.fn();
jest.mock("../models/categoryModel.js", () => ({
  __esModule: true,
  default: { findOne: (...args) => mockCategoryFindOne(...args) },
}));

const mockOrderSave = jest.fn();
jest.mock("../models/orderModel.js", () => ({
  __esModule: true,
  default: class Order {
    constructor(doc) {
      Object.assign(this, doc);
    }
    save() {
      return mockOrderSave(this);
    }
  },
}));

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
  braintreeTokenController,
  brainTreePaymentController,
} from "../controllers/productController.js";

/* ===============
   Test Helpers
   =============== */
const makeQueryChain = (final) => ({
  populate: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnValue(final),
  skip: jest.fn().mockReturnThis(),
});

const mockReqRes = (overrides = {}) => {
  const req = {
    params: {},
    body: {},
    fields: {},
    files: {},
    user: {},
    ...overrides,
  };
  const res = {
    status: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    set: jest.fn(),
  };
  return { req, res };
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("createProductController", () => {
  it("400 when name missing (validation)", async () => {
    const { req, res } = mockReqRes({
      fields: {
        description: "d",
        price: 1,
        category: "c",
        quantity: 1,
        shipping: true,
      },
    });
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Name is required" }),
    );
  });

  it("201 creates product with photo and slug", async () => {
    const { req, res } = mockReqRes({
      fields: {
        name: "Awesome Item",
        description: "d",
        price: 9.99,
        category: "cat1",
        quantity: 3,
        shipping: true,
      },
      files: { photo: { path: "/tmp/img", mimetype: "image/png", size: 1234 } },
    });
    await createProductController(req, res);
    expect(slugify).toHaveBeenCalledWith("Awesome Item", {
      lower: true,
      strict: true,
    });
    expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/img");
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.objectContaining({
          slug: "slug-awesome-item",
          photo: expect.objectContaining({
            data: expect.any(Buffer),
            contentType: "image/png",
          }),
        }),
      }),
    );
  });

  it("201 creates product without photo", async () => {
    const { req, res } = mockReqRes({
      fields: {
        name: "NoPhoto",
        description: "d",
        price: 5,
        category: "c",
        quantity: 1,
      },
    });
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        products: expect.objectContaining({ slug: "slug-nophoto" }),
      }),
    );
  });

  it("400 when photo size > 1MB", async () => {
    const { req, res } = mockReqRes({
      fields: {
        name: "BigPic",
        description: "d",
        price: 9.99,
        category: "c",
        quantity: 1,
      },
      files: { photo: { path: "/tmp/big", size: 1_000_001 } },
    });
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Photo is required and should be less than 1MB",
      }),
    );
  });

  it("sets photo.contentType from `type` when no mimetype", async () => {
    const { req, res } = mockReqRes({
      fields: {
        name: "X",
        description: "d",
        price: 1,
        category: "c",
        quantity: 1,
      },
      files: { photo: { path: "/tmp/p.png", size: 12, type: "image/png" } },
    });
    await createProductController(req, res);
    const payload = res.send.mock.calls[0][0];
    expect(payload.products.photo.contentType).toBe("image/png");
  });

  it("sets default photo.contentType when mimetype and type are missing", async () => {
    const { req, res } = mockReqRes({
      fields: {
        name: "DefaultCT",
        description: "d",
        price: 1,
        category: "c",
        quantity: 1,
      },
      files: { photo: { path: "/tmp/no-ct", size: 123 } },
    });
    await createProductController(req, res);
    const { products } = res.send.mock.calls[0][0];
    expect(products.photo.contentType).toBe("application/octet-stream");
  });

  it("400 when fields is undefined (destructure path)", async () => {
    const { req, res } = mockReqRes({ fields: undefined, files: {} });
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Name is required" }),
    );
  });

  it("400 when description missing", async () => {
    const { req, res } = mockReqRes({
      fields: { name: "N", price: 1, category: "C", quantity: 1 },
    });
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Description is required" }),
    );
  });

  it("400 when price missing", async () => {
    const { req, res } = mockReqRes({
      fields: { name: "N", description: "D", category: "C", quantity: 1 },
    });
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Price is required" }),
    );
  });

  it("400 when category missing", async () => {
    const { req, res } = mockReqRes({
      fields: { name: "N", description: "D", price: 1, quantity: 1 },
    });
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Category is required" }),
    );
  });

  it("400 when quantity missing", async () => {
    const { req, res } = mockReqRes({
      fields: { name: "N", description: "D", price: 1, category: "C" },
    });
    await createProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Quantity is required" }),
    );
  });
});

describe("getProductController", () => {
  it("200 returns list and countTotal", async () => {
    const data = [{ _id: "a" }, { _id: "b" }];
    mockProductFind.mockReturnValue(makeQueryChain(data));
    const { req, res } = mockReqRes();
    await getProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ countTotal: 2, products: data }),
    );
  });

  it("500 on thrown error", async () => {
    mockProductFind.mockImplementation(() => {
      throw new Error("find fail");
    });
    const { req, res } = mockReqRes();
    await getProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("getSingleProductController", () => {
  it("404 when not found", async () => {
    mockProductFindOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnValue(null),
    });
    const { req, res } = mockReqRes({ params: { slug: "missing" } });
    await getSingleProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("200 returns product", async () => {
    const product = { _id: "p1" };
    mockProductFindOne.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      populate: jest.fn().mockReturnValue(product),
    });
    const { req, res } = mockReqRes({ params: { slug: "p1" } });
    await getSingleProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ product }));
  });

  it("500 on thrown error", async () => {
    mockProductFindOne.mockImplementation(() => {
      throw new Error("boom");
    });
    const { req, res } = mockReqRes({ params: { slug: "s" } });
    await getSingleProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("productPhotoController", () => {
  it("200 sends photo when present", async () => {
    mockProductFindById.mockReturnValue({
      select: jest
        .fn()
        .mockResolvedValue({
          photo: { data: Buffer.from("x"), contentType: "image/jpeg" },
        }),
    });
    const { req, res } = mockReqRes({ params: { pid: "p1" } });
    await productPhotoController(req, res);
    expect(res.set).toHaveBeenCalledWith("Content-Type", "image/jpeg");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("200 uses default content-type when missing", async () => {
    mockProductFindById.mockReturnValue({
      select: jest
        .fn()
        .mockResolvedValue({ photo: { data: Buffer.from("x") } }),
    });
    const { req, res } = mockReqRes({ params: { pid: "p1" } });
    await productPhotoController(req, res);
    expect(res.set).toHaveBeenCalledWith(
      "Content-Type",
      "application/octet-stream",
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("404 when photo not found", async () => {
    mockProductFindById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ photo: {} }),
    });
    const { req, res } = mockReqRes({ params: { pid: "p1" } });
    await productPhotoController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("500 on thrown error", async () => {
    mockProductFindById.mockImplementation(() => {
      throw new Error("fail");
    });
    const { req, res } = mockReqRes({ params: { pid: "x" } });
    await productPhotoController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

/* =================
   deleteProductController
   ================= */
describe("deleteProductController", () => {
  it("404 when not found", async () => {
    mockProductFindByIdAndDelete.mockResolvedValue(null);
    const { req, res } = mockReqRes({ params: { pid: "x" } });
    await deleteProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("200 on delete success", async () => {
    mockProductFindByIdAndDelete.mockResolvedValue({ _id: "p1" });
    const { req, res } = mockReqRes({ params: { pid: "p1" } });
    await deleteProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Product deleted successfully" }),
    );
  });

  it("500 on thrown error", async () => {
    mockProductFindByIdAndDelete.mockImplementation(() => {
      throw new Error("del fail");
    });
    const { req, res } = mockReqRes({ params: { pid: "x" } });
    await deleteProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("updateProductController", () => {
  const base = {
    description: "d",
    price: 1,
    category: "c",
    quantity: 1,
    shipping: false,
  };

  it("404 when product not found", async () => {
    mockProductFindByIdAndUpdate.mockResolvedValue(null);
    const { req, res } = mockReqRes({
      params: { pid: "zzz" },
      fields: { ...base, name: "N" },
    });
    await updateProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("200 updates product and saves photo (with explicit type)", async () => {
    const updated = { _id: "p1", photo: {}, save: jest.fn() };
    mockProductFindByIdAndUpdate.mockResolvedValue(updated);
    const { req, res } = mockReqRes({
      params: { pid: "p1" },
      fields: { ...base, name: "New Name" },
      files: { photo: { path: "/tmp/p.webp", type: "image/webp", size: 345 } },
    });
    await updateProductController(req, res);
    expect(slugify).toHaveBeenCalledWith("New Name", {
      lower: true,
      strict: true,
    });
    expect(fs.readFileSync).toHaveBeenCalledWith("/tmp/p.webp");
    expect(updated.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("200 sets default photo contentType when none provided", async () => {
    const updated = { _id: "p2", photo: {}, save: jest.fn() };
    mockProductFindByIdAndUpdate.mockResolvedValue(updated);
    const { req, res } = mockReqRes({
      params: { pid: "p2" },
      fields: { ...base, name: "N" },
      files: { photo: { path: "/tmp/np", size: 10 } }, // no mimetype/type
    });
    await updateProductController(req, res);
    expect(updated.photo.contentType).toBe("application/octet-stream");
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("200 updates without new photo", async () => {
    const updated = { _id: "pX", photo: {}, save: jest.fn() };
    mockProductFindByIdAndUpdate.mockResolvedValue(updated);
    const { req, res } = mockReqRes({
      params: { pid: "pX" },
      fields: {
        name: "X",
        description: "Y",
        price: 1,
        category: "Z",
        quantity: 2,
      },
      files: {},
    });
    await updateProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("validation failures (400)", async () => {
    const must400 = async (fields) => {
      const { req, res } = mockReqRes({ params: { pid: "p" }, fields });
      await updateProductController(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    };
    await must400({ ...base, name: undefined });
    await must400({ ...base, name: "N", description: undefined });
    await must400({ ...base, name: "N", price: undefined });
    await must400({ ...base, name: "N", category: undefined });
    await must400({ ...base, name: "N", quantity: undefined });
  });

  it("400 when photo > 1MB", async () => {
    const { req, res } = mockReqRes({
      params: { pid: "p" },
      fields: { ...base, name: "N" },
      files: { photo: { size: 1_000_001, path: "/tmp/big" } },
    });
    await updateProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("500 when fs throws during update", async () => {
    const spy = jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("read fail");
    });
    const updated = { _id: "p", photo: {}, save: jest.fn() };
    mockProductFindByIdAndUpdate.mockResolvedValue(updated);
    const { req, res } = mockReqRes({
      params: { pid: "p" },
      fields: { ...base, name: "N" },
      files: { photo: { size: 10, path: "/tmp/p" } },
    });
    await updateProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });

  it("400 when fields is undefined (destructure path)", async () => {
    const { req, res } = mockReqRes({
      params: { pid: "p1" },
      fields: undefined,
      files: {},
    });
    await updateProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Name is required" }),
    );
  });

  it("sets photo.contentType from `type` when no mimetype", async () => {
    const updated = { _id: "p1", photo: {}, save: jest.fn() };
    mockProductFindByIdAndUpdate.mockResolvedValue(updated);
    const { req, res } = mockReqRes({
      params: { pid: "p1" },
      fields: {
        name: "X",
        description: "d",
        price: 1,
        category: "c",
        quantity: 1,
      },
      files: { photo: { path: "/tmp/p.webp", size: 99, type: "image/webp" } },
    });
    await updateProductController(req, res);
    expect(updated.photo.contentType).toBe("image/webp");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("productFiltersController", () => {
  it("builds args with $in and price range", async () => {
    const result = [{ _id: "x" }];
    mockProductFind.mockReturnValue({
      select: jest.fn().mockResolvedValue(result),
    });
    const { req, res } = mockReqRes({
      body: { checked: ["c1", "c2"], radio: [10, 50] },
    });
    await productFiltersController(req, res);
    expect(mockProductFind).toHaveBeenCalledWith({
      category: { $in: ["c1", "c2"] },
      price: { $gte: 10, $lte: 50 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, products: result });
  });

  it("only checked builds $in", async () => {
    mockProductFind.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ id: 1 }]),
    });
    const { req, res } = mockReqRes({
      body: { checked: ["c1", "c2"], radio: [] },
    });
    await productFiltersController(req, res);
    expect(mockProductFind).toHaveBeenCalledWith({
      category: { $in: ["c1", "c2"] },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("only radio builds price range", async () => {
    mockProductFind.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ id: 2 }]),
    });
    const { req, res } = mockReqRes({ body: { checked: [], radio: [5, 25] } });
    await productFiltersController(req, res);
    expect(mockProductFind).toHaveBeenCalledWith({
      price: { $gte: 5, $lte: 25 },
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("empty or undefined body produces {} query", async () => {
    mockProductFind.mockReturnValue({
      select: jest.fn().mockResolvedValue([{ id: 1 }]),
    });

    // empty object
    let pack = mockReqRes({ body: {} });
    await productFiltersController(pack.req, pack.res);
    expect(mockProductFind).toHaveBeenCalledWith({});
    expect(pack.res.status).toHaveBeenCalledWith(200);

    // undefined body (covers destructure with || {})
    pack = mockReqRes({ body: undefined });
    await productFiltersController(pack.req, pack.res);
    expect(mockProductFind).toHaveBeenLastCalledWith({});
    expect(pack.res.status).toHaveBeenCalledWith(200);
  });

  it("500 when productModel.find throws (outer catch path)", async () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockProductFind.mockImplementation(() => {
      throw new Error("filters boom");
    });
    const { req, res } = mockReqRes({
      body: { checked: ["c1"], radio: [1, 2] },
    });
    await productFiltersController(req, res);
    expect(spy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    spy.mockRestore();
  });
});

describe("productCountController", () => {
  it("200 with total", async () => {
    mockProductEstimatedDocCount.mockResolvedValue(42);
    const { req, res } = mockReqRes();
    await productCountController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, total: 42 });
  });

  it("500 on error", async () => {
    mockProductEstimatedDocCount.mockImplementation(() => {
      throw new Error("cnt fail");
    });
    const { req, res } = mockReqRes();
    await productCountController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("productListController", () => {
  const makeListChain = (data) => ({
    select: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    sort: jest.fn().mockResolvedValue(data),
  });

  it("200 returns paginated list and calls skip correctly", async () => {
    const data = [{ id: 1 }];
    const ch = makeListChain(data);
    mockProductFind.mockReturnValue(ch);
    const { req, res } = mockReqRes({ params: { page: "3" } });
    await productListController(req, res);
    expect(ch.skip).toHaveBeenCalledWith(12);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, products: data });
  });

  it("page NaN falls back to 1; <=0 coerces to 1", async () => {
    const data = [{ id: 1 }];
    let ch = makeListChain(data);
    mockProductFind.mockReturnValue(ch);
    await productListController(
      ...Object.values(mockReqRes({ params: { page: "abc" } })),
    );
    expect(ch.skip).toHaveBeenCalledWith(0);

    ch = makeListChain(data);
    mockProductFind.mockReturnValue(ch);
    await productListController(
      ...Object.values(mockReqRes({ params: { page: "0" } })),
    );
    expect(ch.skip).toHaveBeenCalledWith(0);

    ch = makeListChain(data);
    mockProductFind.mockReturnValue(ch);
    await productListController(
      ...Object.values(mockReqRes({ params: { page: "-3" } })),
    );
    expect(ch.skip).toHaveBeenCalledWith(0);
  });

  it("500 when query chain rejects (catch path)", async () => {
    const ch = {
      select: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      sort: jest.fn().mockRejectedValue(new Error("list fail")),
    };
    mockProductFind.mockReturnValue(ch);
    const { req, res } = mockReqRes({ params: { page: "2" } });
    await productListController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Error in per-page controller" }),
    );
  });
});

describe("searchProductController", () => {
  it("200 returns results", async () => {
    const data = [{ id: "a" }];
    mockProductFind.mockReturnValue({
      select: jest.fn().mockResolvedValue(data),
    });
    const { req, res } = mockReqRes({ params: { keyword: "lap" } });
    await searchProductController(req, res);
    expect(mockProductFind).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "lap", $options: "i" } },
        { description: { $regex: "lap", $options: "i" } },
      ],
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, results: data });
  });

  it("uses default empty keyword when params.keyword missing", async () => {
    const data = [{ id: "x" }];
    mockProductFind.mockReturnValue({
      select: jest.fn().mockResolvedValue(data),
    });
    const { req, res } = mockReqRes({ params: {} });
    await searchProductController(req, res);
    expect(mockProductFind).toHaveBeenCalledWith({
      $or: [
        { name: { $regex: "", $options: "i" } },
        { description: { $regex: "", $options: "i" } },
      ],
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("500 on thrown error", async () => {
    mockProductFind.mockImplementation(() => {
      throw new Error("search fail");
    });
    const { req, res } = mockReqRes({ params: { keyword: "x" } });
    await searchProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("relatedProductController", () => {
  it("200 returns related products", async () => {
    const data = [{ id: "r1" }];
    const ch = makeQueryChain(data);
    ch.limit = jest.fn().mockReturnThis();
    ch.populate = jest.fn().mockReturnValue(data);
    mockProductFind.mockReturnValue(ch);

    const { req, res } = mockReqRes({ params: { pid: "p1", cid: "c1" } });
    await relatedProductController(req, res);
    expect(mockProductFind).toHaveBeenCalledWith({
      category: "c1",
      _id: { $ne: "p1" },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, products: data });
  });

  it("200 returns empty list", async () => {
    const ch = makeQueryChain([]);
    ch.limit = jest.fn().mockReturnThis();
    ch.populate = jest.fn().mockReturnValue([]);
    mockProductFind.mockReturnValue(ch);

    const { req, res } = mockReqRes({ params: { pid: "p1", cid: "c1" } });
    await relatedProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ success: true, products: [] });
  });

  it("500 on error", async () => {
    mockProductFind.mockImplementation(() => {
      throw new Error("rel fail");
    });
    const { req, res } = mockReqRes({ params: { pid: "p", cid: "c" } });
    await relatedProductController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("productCategoryController", () => {
  it("404 when category not found", async () => {
    mockCategoryFindOne.mockResolvedValue(null);
    const { req, res } = mockReqRes({ params: { slug: "nope" } });
    await productCategoryController(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("200 returns category and products", async () => {
    mockCategoryFindOne.mockResolvedValue({ _id: "c1", slug: "cat-1" });
    mockProductFind.mockReturnValue({
      populate: jest.fn().mockResolvedValue([{ id: "p1" }]),
    });
    const { req, res } = mockReqRes({ params: { slug: "cat-1" } });
    await productCategoryController(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({
      success: true,
      category: { _id: "c1", slug: "cat-1" },
      products: [{ id: "p1" }],
    });
  });

  it("500 on error", async () => {
    mockCategoryFindOne.mockImplementation(() => {
      throw new Error("cat fail");
    });
    const { req, res } = mockReqRes({ params: { slug: "slug" } });
    await productCategoryController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe("braintreeTokenController", () => {
  it("200 sends token response", async () => {
    mockClientTokenGenerate.mockImplementation((_opts, cb) =>
      cb(null, { clientToken: "tok" }),
    );
    const { req, res } = mockReqRes();
    await braintreeTokenController(req, res);
    expect(mockClientTokenGenerate).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalledWith({ clientToken: "tok" });
  });

  it("500 on async error", async () => {
    mockClientTokenGenerate.mockImplementation((_opts, cb) =>
      cb(new Error("boom")),
    );
    const { req, res } = mockReqRes();
    await braintreeTokenController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("500 when generate throws synchronously (outer catch)", async () => {
    const original = mockClientTokenGenerate.mockImplementation;
    mockClientTokenGenerate.mockImplementation(() => {
      throw new Error("sync token fail");
    });
    const { req, res } = mockReqRes();
    await braintreeTokenController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    mockClientTokenGenerate.mockImplementation = original;
  });
});

/* =================
   brainTreePaymentController
   ================= */
describe("brainTreePaymentController", () => {
  it("400 when cart empty", async () => {
    const { req, res } = mockReqRes({ body: { nonce: "n", cart: [] } });
    await brainTreePaymentController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("200 and saves order on success; computes total with mixed price types", async () => {
    mockOrderSave.mockResolvedValue({ _id: "o1" });
    mockTransactionSale.mockImplementation((payload, cb) =>
      cb(null, { success: true, id: "txn1" }),
    );
    const { req, res } = mockReqRes({
      body: { nonce: "n123", cart: [{}, { price: "3" }, { price: 2 }] }, // total = 5.00
      user: { _id: "u1" },
    });
    await brainTreePaymentController(req, res);
    const callPayload = mockTransactionSale.mock.calls[0][0];
    expect(callPayload.amount).toBe("5.00");
    expect(mockOrderSave).toHaveBeenCalledWith(
      expect.objectContaining({ buyer: "u1" }),
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("500 when processor reports failure (result.success=false)", async () => {
    mockTransactionSale.mockImplementation((_payload, cb) =>
      cb(null, { success: false, msg: "declined" }),
    );
    const { req, res } = mockReqRes({
      body: { nonce: "n", cart: [{ price: 10 }] },
    });
    await brainTreePaymentController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("500 when order save fails", async () => {
    mockTransactionSale.mockImplementation((_p, cb) =>
      cb(null, { success: true, id: "txn" }),
    );
    mockOrderSave.mockRejectedValue(new Error("save fail"));
    const { req, res } = mockReqRes({
      body: { nonce: "n", cart: [{ price: 1 }] },
      user: { _id: "u" },
    });
    await brainTreePaymentController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("500 when sale throws synchronously (outer catch)", async () => {
    const original = mockTransactionSale.mockImplementation;
    mockTransactionSale.mockImplementation(() => {
      throw new Error("outer fail");
    });
    const { req, res } = mockReqRes({
      body: { nonce: "n", cart: [{ price: 1 }] },
    });
    await brainTreePaymentController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    mockTransactionSale.mockImplementation = original;
  });

  it("500 when gateway returns an error object (cb first arg)", async () => {
    mockTransactionSale.mockImplementation((_payload, cb) =>
      cb(new Error("gw err"), null),
    );
    const { req, res } = mockReqRes({
      body: { nonce: "n", cart: [{ price: 3 }, { price: 2 }] },
      user: { _id: "u123" },
    });
    await brainTreePaymentController(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: "Payment failed" }),
    );
  });

  it("400 when body is undefined (destructure path)", async () => {
    const { req, res } = mockReqRes({ body: undefined });
    await brainTreePaymentController(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe("module init: braintree gateway", () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV };
    process.env.BRAINTREE_MERCHANT_ID = "m123";
    process.env.BRAINTREE_PUBLIC_KEY = "pk_abc";
    process.env.BRAINTREE_PRIVATE_KEY = "sk_def";
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it("constructs BraintreeGateway with env vars", async () => {
    const BraintreeGateway = jest.fn().mockImplementation(() => ({
      clientToken: { generate: jest.fn() },
      transaction: { sale: jest.fn() },
    }));

    jest.doMock("dotenv", () => ({
      __esModule: true,
      default: { config: jest.fn() },
    }));
    jest.doMock("braintree", () => ({
      __esModule: true,
      default: { BraintreeGateway, Environment: { Sandbox: "Sandbox" } },
    }));
    jest.doMock("../models/productModel.js", () => ({
      __esModule: true,
      default: class Product {},
    }));
    jest.doMock("../models/categoryModel.js", () => ({
      __esModule: true,
      default: {},
    }));
    jest.doMock("../models/orderModel.js", () => ({
      __esModule: true,
      default: class Order {},
    }));

    await jest.isolateModulesAsync(async () => {
      await import("../controllers/productController.js");
    });

    expect(BraintreeGateway).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: "Sandbox",
        merchantId: "m123",
        publicKey: "pk_abc",
        privateKey: "sk_def",
      }),
    );
  });

  it("createProductController logs and 500s when fs.readFileSync throws", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});
    const readSpy = jest.spyOn(fs, "readFileSync").mockImplementation(() => {
      throw new Error("boom fs");
    });

    const { req, res } = (() => {
      const req = {
        params: {},
        body: {},
        fields: {
          name: "X",
          description: "d",
          price: 1,
          category: "c",
          quantity: 1,
        },
        files: { photo: { path: "/tmp/p", size: 100 } },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        set: jest.fn(),
      };
      return { req, res };
    })();

    const { createProductController: createAgain } = await import(
      "../controllers/productController.js"
    );
    await createAgain(req, res);

    expect(consoleSpy).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);

    readSpy.mockRestore();
    consoleSpy.mockRestore();
  });
});
