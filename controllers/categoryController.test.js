import {
    // createCategoryController,
    // updateCategoryController,
    getCategoriesController,
    singleCategoryController,
    // deleteCategoryController,
} from "../controllers/categoryController.js";
import categoryModel, { _saveMock } from "../models/categoryModel.js";
// import slugify from "slugify";

jest.mock("../models/categoryModel.js", () => {
    const saveMock = jest.fn();
    const Model = jest.fn(() => ({ save: saveMock })); // used by: new categoryModel(...).save()
    Model.findOne = jest.fn();
    Model.find = jest.fn();
    Model.findByIdAndUpdate = jest.fn();
    Model.findByIdAndDelete = jest.fn();
    return { __esModule: true, default: Model, _saveMock: saveMock };
});

// helper fx for res
const mockRes = () => {
    const res = {};
    res.status = jest.fn(() => res);
    res.send = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
};

describe("Category controllers", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // Gerald's Admin Actions
    // describe("Creating a new category using createCategoryController", () => {
    // });

    // describe("Updating a category using updateCategoryController", () => {
    // });

    describe("Getting a list of all categories using getCategoriesController", () => {
        it("returns 200 success and returns all categories", async () => {
            const docs = [{ _id: "1", name: "A" }, { _id: "2", name: "B" }];
            categoryModel.find.mockResolvedValueOnce(docs);

            const req = {};
            const res = mockRes();

            await getCategoriesController(req, res);

            expect(categoryModel.find).toHaveBeenCalledWith({});
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "All categories retrieved successfully",
                categories: docs,
            });
        });

        it("returns 500 error if error in retrieving all categories", async () => {
            categoryModel.find.mockRejectedValueOnce(new Error("error"));
            const req = {};
            const res = mockRes();
            await getCategoriesController(req, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error while retrieving all categories",
                })
            );
        });
    });

    describe("Getting a single category by slug using singleCategoryController", () => {
        it("returns 200 success and returns one category by slug", async () => {
            const doc = { _id: "1", name: "A", slug: "a" };
            categoryModel.findOne.mockResolvedValueOnce(doc);

            const req = { params: { slug: "a" } };
            const res = mockRes();

            await singleCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ slug: "a" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category retrieved successfully",
                category: doc,
            });
        });

        it("returns 500 error if error in retrieving categor", async () => {
            categoryModel.findOne.mockRejectedValueOnce(new Error("x"));
            const res = mockRes();
            await singleCategoryController({ params: { slug: "a" } }, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error while retrieving category",
                })
            );
        });
    });

    // Gerald's Admin Actions
    // describe("Deleting a category by ID using deleteCategoryController", () => {
});
