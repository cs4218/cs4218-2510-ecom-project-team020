import express from "express";
import request from "supertest";

// Mock middlewares 
jest.mock("../middlewares/authMiddleware.js", () => ({
  __esModule: true,
  requireSignIn: (req, _res, next) => {
    req._calls ??= [];
    req._calls.push("requireSignIn");
    next();
  },
  isAdmin: (req, _res, next) => {
    req._calls ??= [];
    req._calls.push("isAdmin");
    next();
  },
}));

// Mock controllers to return a simple JSON which we test assert on 
jest.mock("../controllers/categoryController.js", () => ({
  __esModule: true,
  createCategoryController: (req, res) =>
    res.status(200).json({ hit: "create", calls: req._calls ?? [] }),
  updateCategoryController: (req, res) =>
    res.status(200).json({ hit: "update", calls: req._calls ?? [] }),
  getCategoriesController: (req, res) =>
    res.status(200).json({ hit: "list", calls: req._calls ?? [] }),
  singleCategoryController: (req, res) =>
    res.status(200).json({ hit: "single", calls: req._calls ?? [] }),
  deleteCategoryController: (req, res) =>
    res.status(200).json({ hit: "delete", calls: req._calls ?? [] }),
}));

// Import the router AFTER mocks
import router from "../routes/categoryRoutes.js";

const app = express();
app.use(express.json());
app.use("/", router);

describe("categoryRoutes wiring", () => {
  
  test("POST /create-category runs auth middlewares then controller", async () => {
    const res = await request(app).post("/create-category").send({ name: "Electronics" });
    expect(res.status).toBe(200);
    expect(res.body.hit).toBe("create");
    expect(res.body.calls).toEqual(["requireSignIn", "isAdmin"]);
  });

  test("PUT /update-category/:id runs auth middlewares then controller", async () => {
    const res = await request(app).put("/update-category/123").send({ name: "Updated Electronics" });
    expect(res.status).toBe(200);
    expect(res.body.hit).toBe("update");
    expect(res.body.calls).toEqual(["requireSignIn", "isAdmin"]);
  });

  test("GET /get-category has no auth middlewares", async () => {
    const res = await request(app).get("/get-category");
    expect(res.status).toBe(200);
    expect(res.body.hit).toBe("list");
    expect(res.body.calls).toEqual([]); // none ran
  });

  test("GET /single-category/:slug has no auth middlewares", async () => {
    const res = await request(app).get("/single-category/foo");
    expect(res.status).toBe(200);
    expect(res.body.hit).toBe("single");
    expect(res.body.calls).toEqual([]);
  });

  test("DELETE /delete-category/:id runs auth middlewares then controller", async () => {
    const res = await request(app).delete("/delete-category/123");
    expect(res.status).toBe(200);
    expect(res.body.hit).toBe("delete");
    expect(res.body.calls).toEqual(["requireSignIn", "isAdmin"]);
  });
});
