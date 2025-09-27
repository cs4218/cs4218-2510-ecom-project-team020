import {
    createCategoryController,
    updateCategoryController,
    getCategoriesController,
    singleCategoryController,
    deleteCategoryController,
} from "../controllers/categoryController.js";
import categoryModel, { _saveMock } from "../models/categoryModel.js";
import slugify from "slugify";

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

    describe("Creating a new category using createCategoryController", () => {

        it("returns 201 success, creating a new category instance", async () => {
            categoryModel.findOne.mockResolvedValueOnce(null);

            const savedDoc = {
                _id: "1",
                name: "New Books",
                slug: slugify("New Books"),
                __v: 0,
            };
            _saveMock.mockResolvedValueOnce(savedDoc);

            const req = { body: { name: "New Books" } };
            const res = mockRes();

            await createCategoryController(req, res);

            expect(categoryModel).toHaveBeenCalledWith({
                name: "New Books",
                slug: slugify("New Books"),
            });
            expect(_saveMock).toHaveBeenCalledTimes(1);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "New category created",
                category: savedDoc,
            });
        });

        it("returns 200 success when category already exists", async () => {
            categoryModel.findOne.mockResolvedValueOnce({ _id: "x", name: "Book" });

            const req = { body: { name: "Book" } };
            const res = mockRes();

            await createCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Book" });
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category already exists",
            });
            expect(categoryModel).not.toHaveBeenCalled(); // should not call save if already exists
        });

        it("returns 400 error when name missing", async () => {
            const req = { body: {} };
            const res = mockRes();

            await createCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({ message: "Name is required" });
            expect(categoryModel.findOne).not.toHaveBeenCalled();
            expect(categoryModel).not.toHaveBeenCalled();
        });

        it("returns 500 error if error in creating category", async () => {
            categoryModel.findOne.mockRejectedValueOnce(new Error("error"));

            const req = { body: { name: "Err" } };
            const res = mockRes();

            await createCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error in creating category",
                })
            );
        });
    });

    describe("Updating a category using updateCategoryController", () => {
        it("returns 200 success and updates with slugified name", async () => {
            const req = { params: { id: "abc123" }, body: { name: "My New Name" } };
            const res = mockRes();

            const updated = {
                _id: "abc123",
                name: "My New Name",
                slug: slugify("My New Name"),
            };
            categoryModel.findByIdAndUpdate.mockResolvedValueOnce(updated);

            await updateCategoryController(req, res);

            expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
                "abc123",
                { name: "My New Name", slug: slugify("My New Name") },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category updated successfully",
                category: updated,
            });
        });

        it("returns 500 error if error in updating category", async () => {
            categoryModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("error"));
            const req = { params: { id: "abc123" }, body: { name: "X" } };
            const res = mockRes();

            await updateCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error while updating category",
                })
            );
        });
    });

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

    describe("Deleting a category by ID using deleteCategoryController", () => {
        it("returns 200 success and deletes category by ID", async () => {
            categoryModel.findByIdAndDelete.mockResolvedValueOnce({ acknowledged: true });

            const req = { params: { id: "category" } };
            const res = mockRes();

            await deleteCategoryController(req, res);

            expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("category");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category deleted successfully",
            });
        });

        it("returns 500 error if error in deleting category", async () => {
            categoryModel.findByIdAndDelete.mockRejectedValueOnce(new Error("oops"));
            const res = mockRes();
            await deleteCategoryController({ params: { id: "category" } }, res);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error while deleting category",
                })
            );
        });
    });
});
