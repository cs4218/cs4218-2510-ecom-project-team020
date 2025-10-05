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
        // Classification: Output-based (verifies HTTP response), Communication-based (verifies database interaction)
        // Technique: Equivalence Partitioning (valid category creation scenario)
        it("returns 201 success when creating a new category", async () => {
            const mockCategory = { _id: "1", name: "Electronics", slug: "electronics" };
            categoryModel.findOne.mockResolvedValueOnce(null); // No existing category
            _saveMock.mockResolvedValueOnce(mockCategory);

            const req = { body: { name: "Electronics" } };
            const res = mockRes();

            await createCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
            expect(_saveMock).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "New category created",
                category: mockCategory,
            });
        });

        // Classification: Output-based (verifies HTTP error response)
        // Technique: Boundary Value Analysis (empty/missing required field)
        it("returns 400 error when name is missing", async () => {
            const req = { body: {} };
            const res = mockRes();

            await createCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                message: "Name is required"
            });
        });

        // Classification: Output-based (verifies HTTP conflict response), Communication-based (verifies database query)
        // Technique: Equivalence Partitioning (duplicate category scenario)
        it("returns 409 error when category already exists", async () => {
            const existingCategory = { _id: "1", name: "Electronics", slug: "electronics" };
            categoryModel.findOne.mockResolvedValueOnce(existingCategory);

            const req = { body: { name: "Electronics" } };
            const res = mockRes();

            await createCategoryController(req, res);

            expect(categoryModel.findOne).toHaveBeenCalledWith({ name: "Electronics" });
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Category Already Exists",
            });
        });

        // Classification: Output-based (verifies HTTP error response), Communication-based (verifies error handling)
        // Technique: Equivalence Partitioning (database error scenario)
        it("returns 500 error when database error occurs", async () => {
            categoryModel.findOne.mockRejectedValueOnce(new Error("Database error"));

            const req = { body: { name: "Electronics" } };
            const res = mockRes();

            await createCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.send).toHaveBeenCalledWith(
                expect.objectContaining({
                    success: false,
                    message: "Error in Category",
                })
            );
        });
    });

    describe("Updating a category using updateCategoryController", () => {
        // Classification: Output-based (verifies HTTP response), Communication-based (verifies database update)
        // Technique: Equivalence Partitioning (valid category update scenario)
        it("returns 200 success when updating an existing category", async () => {
            const updatedCategory = { _id: "1", name: "Updated Electronics", slug: "updated-electronics" };
            categoryModel.findByIdAndUpdate.mockResolvedValueOnce(updatedCategory);

            const req = { 
                body: { name: "Updated Electronics" },
                params: { id: "1" }
            };
            const res = mockRes();

            await updateCategoryController(req, res);

            expect(categoryModel.findByIdAndUpdate).toHaveBeenCalledWith(
                "1",
                { name: "Updated Electronics", slug: "Updated-Electronics" },
                { new: true }
            );
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category Updated Successfully",
                category: updatedCategory,
            });
        });

        // Classification: Output-based (verifies HTTP error response)
        // Technique: Boundary Value Analysis (empty/missing required field)
        it("returns 400 error when name is missing", async () => {
            const req = { 
                body: {},
                params: { id: "1" }
            };
            const res = mockRes();

            await updateCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.send).toHaveBeenCalledWith({
                message: "Name is required"
            });
        });

        // Classification: Output-based (verifies HTTP not found response), Communication-based (verifies database query)
        // Technique: Equivalence Partitioning (non-existent category scenario)
        it("returns 404 error when category is not found", async () => {
            categoryModel.findByIdAndUpdate.mockResolvedValueOnce(null);

            const req = { 
                body: { name: "Updated Electronics" },
                params: { id: "nonexistent" }
            };
            const res = mockRes();

            await updateCategoryController(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Category not found",
            });
        });

        // Classification: Output-based (verifies HTTP error response), Communication-based (verifies error handling)
        // Technique: Equivalence Partitioning (database error scenario)
        it("returns 500 error when database error occurs", async () => {
            categoryModel.findByIdAndUpdate.mockRejectedValueOnce(new Error("Database error"));

            const req = { 
                body: { name: "Updated Electronics" },
                params: { id: "1" }
            };
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
        // Classification: Output-based (verifies HTTP response), Communication-based (verifies database query)
        // Technique: Equivalence Partitioning (successful data retrieval scenario)
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

        // Classification: Output-based (verifies HTTP error response), Communication-based (verifies error handling)
        // Technique: Equivalence Partitioning (database error scenario)
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
        // Classification: Output-based (verifies HTTP response), Communication-based (verifies database query)
        // Technique: Equivalence Partitioning (successful single item retrieval scenario)
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

        // Classification: Output-based (verifies HTTP error response), Communication-based (verifies error handling)
        // Technique: Equivalence Partitioning (database error scenario)
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
        // Classification: Output-based (verifies HTTP response), Communication-based (verifies database deletion)
        // Technique: Equivalence Partitioning (successful deletion scenario)
        it("returns 200 success when deleting an existing category", async () => {
            const deletedCategory = { _id: "1", name: "Electronics", slug: "electronics" };
            categoryModel.findByIdAndDelete.mockResolvedValueOnce(deletedCategory);

            const req = { params: { id: "1" } };
            const res = mockRes();

            await deleteCategoryController(req, res);

            expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("1");
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.send).toHaveBeenCalledWith({
                success: true,
                message: "Category Deleted Successfully",
            });
        });

        // Classification: Output-based (verifies HTTP not found response), Communication-based (verifies database query)
        // Technique: Equivalence Partitioning (non-existent category scenario)
        it("returns 404 error when category is not found", async () => {
            categoryModel.findByIdAndDelete.mockResolvedValueOnce(null);

            const req = { params: { id: "nonexistent" } };
            const res = mockRes();

            await deleteCategoryController(req, res);

            expect(categoryModel.findByIdAndDelete).toHaveBeenCalledWith("nonexistent");
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.send).toHaveBeenCalledWith({
                success: false,
                message: "Category not found",
            });
        });

        // Classification: Output-based (verifies HTTP error response), Communication-based (verifies error handling)
        // Technique: Equivalence Partitioning (database error scenario)
        it("returns 500 error when database error occurs", async () => {
            categoryModel.findByIdAndDelete.mockRejectedValueOnce(new Error("Database error"));

            const req = { params: { id: "1" } };
            const res = mockRes();

            await deleteCategoryController(req, res);

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
