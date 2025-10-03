// This file contains unit tests generated with AI assistance but curated, validated and refined by me.
import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("requireSignIn", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should call next() when token is valid", async () => {
    req.headers.authorization = "valid.jwt.token";
    JWT.verify.mockReturnValue({ id: "123" });

    await requireSignIn(req, res, next);

    expect(JWT.verify).toHaveBeenCalledWith("valid.jwt.token", process.env.JWT_SECRET);
    expect(req.user).toEqual({ id: "123" });
    expect(next).toHaveBeenCalled();
  });

  it("should not call next() when token is invalid and log the error", async () => {
    req.headers.authorization = "invalid.jwt.token";
    JWT.verify.mockImplementation(() => {
      throw new Error("invalid token");
    });
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });


    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(new Error("invalid token"));

    logSpy.mockRestore();
  });

  it("should handle missing token gracefully and log the error", async () => {
    req.headers.authorization = undefined;
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => { });

    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.any(Error));

    logSpy.mockRestore();
  });

  it("should return 401 when authorization header is missing", async () => {
    await requireSignIn(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unauthorized Access" })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 when token is expired", async () => {
    req.headers.authorization = "expired.token";
    JWT.verify.mockImplementation(() => {
      throw new Error("jwt expired");
    });

    await requireSignIn(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unauthorized Access" })
    );
  });

  it("should return 401 when token signature is invalid", async () => {
    req.headers.authorization = "invalid.signature";
    JWT.verify.mockImplementation(() => {
      throw new Error("invalid signature");
    });

    await requireSignIn(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unauthorized Access" })
    );
  });

  it("should return 401 for empty string token", async () => {
    req.headers.authorization = "";
    JWT.verify.mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    await requireSignIn(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unauthorized Access" })
    );
  });
});

describe("isAdmin", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { _id: "123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it("should call next() if user.role === 1", async () => {
    userModel.findById.mockResolvedValue({ role: 1 });

    await isAdmin(req, res, next);

    expect(userModel.findById).toHaveBeenCalledWith("123");
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });


  it("should return 403 if user.role !== 1", async () => {
    userModel.findById.mockResolvedValue({ role: 0 });

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Forbidden",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 404 when user not found", async () => {
    userModel.findById.mockResolvedValue(null);

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "User not found" })
    );
  });

  it("should return 401 when user in request is undefined", async () => {
    req.user = undefined;

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Unauthorized Access" })
    );
  });

  it("should return 401 when role is missing", async () => {
    userModel.findById.mockResolvedValue({});

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Forbidden" })
    );
  });

  it("should return 403 when role is string '1'", async () => {
    userModel.findById.mockResolvedValue({ role: "1" });

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Forbidden",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 500 when an unexpected error occurs", async () => {
    jest.spyOn(userModel, "findById").mockImplementation(() => {
      throw new Error("DB failure");
    });

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Something went wrong",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
