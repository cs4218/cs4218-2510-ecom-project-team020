import JWT from "jsonwebtoken";
import userModel from "../models/userModel.js";
import { requireSignIn, isAdmin } from "../middlewares/authMiddleware.js";

jest.mock("jsonwebtoken");
jest.mock("../models/userModel.js");

describe("requireSignIn", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
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
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});


    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(new Error("invalid token"));

    logSpy.mockRestore();
  });

  it("should handle missing token gracefully and log the error", async () => {
    req.headers.authorization = undefined;
    const logSpy = jest.spyOn(console, "log").mockImplementation(() => {});

    await requireSignIn(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(logSpy).toHaveBeenCalledWith(expect.any(Error));

    logSpy.mockRestore();
  });
});

describe("isAdmin", () => {
  let req, res, next;

  beforeEach(() => {
    req = { user : { _id: "123" } };
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

  it("should return 401 if user.role !== 1", async () => {
    userModel.findById.mockResolvedValue({ role: 0 });

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "UnAuthorized Access",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("should handle errors gracefully and return 401", async () => {
    userModel.findById.mockRejectedValue(new Error("DB error"));

    await isAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.send).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: "Error in admin middleware",
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});
