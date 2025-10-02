import mongoose from "mongoose";
import connectDB from "./db.js";

// Mock mongoose
jest.mock("mongoose", () => ({
  connect: jest.fn(),
}));

// Mock colors library - it extends String prototype when imported
jest.mock("colors", () => {
  // Mock the colors library by extending String prototype immediately
  Object.defineProperty(String.prototype, "bgMagenta", {
    get: function () {
      const self = this;
      return {
        get white() {
          return self.toString();
        },
      };
    },
    configurable: true,
  });

  Object.defineProperty(String.prototype, "bgRed", {
    get: function () {
      const self = this;
      return {
        get white() {
          return self.toString();
        },
      };
    },
    configurable: true,
  });

  return {};
});

const mockConsoleLog = jest.fn();
const mockConsoleError = jest.fn();

describe("Database Connection - Unit Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog.mockClear();
    mockConsoleError.mockClear();

    // Mock console methods
    jest.spyOn(console, "log").mockImplementation(mockConsoleLog);

    // Mock environment variable
    process.env.MONGO_URL = "mongodb://localhost:27017/test";
  });

  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();

    // Clean up environment
    delete process.env.MONGO_URL;
  });

  // Output-Based Testing
  describe("Successful Connection", () => {
    it("should connect to MongoDB successfully", async () => {
      const mockConnection = {
        connection: {
          host: "localhost:27017",
        },
      };

      mongoose.connect.mockResolvedValueOnce(mockConnection);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(
        "mongodb://localhost:27017/test"
      );
      expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });

    it("should log success message with correct host information", async () => {
      const mockConnection = {
        connection: {
          host: "localhost:27017",
        },
      };

      mongoose.connect.mockResolvedValueOnce(mockConnection);

      await connectDB();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Connected To Mongodb Database localhost:27017"
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle different host configurations", async () => {
      const testHosts = [
        "localhost:27017",
        "mongodb.example.com:27017",
        "cluster0.mongodb.net",
        "127.0.0.1:27017",
      ];

      for (const host of testHosts) {
        jest.clearAllMocks();
        mockConsoleLog.mockClear();

        const mockConnection = {
          connection: { host },
        };

        mongoose.connect.mockResolvedValueOnce(mockConnection);

        await connectDB();

        expect(mockConsoleLog).toHaveBeenCalledWith(
          `Connected To Mongodb Database ${host}`
        );
      }
    });
  });

  // State-Based Testing
  describe("Connection State Management", () => {
    it("should use environment variable for connection URL", async () => {
      const testUrl = "mongodb://test-server:27017/testdb";
      process.env.MONGO_URL = testUrl;

      const mockConnection = {
        connection: { host: "test-server:27017" },
      };

      mongoose.connect.mockResolvedValueOnce(mockConnection);

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(testUrl);
    });

    it("should handle undefined MONGO_URL environment variable", async () => {
      delete process.env.MONGO_URL;

      mongoose.connect.mockResolvedValueOnce({
        connection: { host: "localhost" },
      });

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(undefined);
    });
  });

  // Error Handling Testing
  describe("Connection Error Handling", () => {
    it("should handle connection errors gracefully", async () => {
      const mockError = new Error("Connection failed");
      mongoose.connect.mockRejectedValueOnce(mockError);

      await connectDB();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Error in Mongodb Error: Connection failed"
      );
      expect(mockConsoleLog).toHaveBeenCalledTimes(1);
    });

    it("should handle network timeout errors", async () => {
      const timeoutError = new Error("connection timed out");
      mongoose.connect.mockRejectedValueOnce(timeoutError);

      await connectDB();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Error in Mongodb Error: connection timed out"
      );
    });

    it("should handle authentication errors", async () => {
      const authError = new Error("Authentication failed");
      mongoose.connect.mockRejectedValueOnce(authError);

      await connectDB();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Error in Mongodb Error: Authentication failed"
      );
    });

    it("should handle malformed URL errors", async () => {
      const urlError = new Error("Invalid connection string");
      mongoose.connect.mockRejectedValueOnce(urlError);

      await connectDB();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Error in Mongodb Error: Invalid connection string"
      );
    });
  });

  // Equivalence Partitioning
  describe("Input Validation", () => {
    describe("Valid Connection URLs", () => {
      const validUrls = [
        "mongodb://localhost:27017/testdb",
        "mongodb://user:pass@localhost:27017/db",
        "mongodb+srv://cluster.mongodb.net/db",
        "mongodb://127.0.0.1:27017/app",
      ];

      validUrls.forEach((url) => {
        it(`should handle valid URL: ${url}`, async () => {
          process.env.MONGO_URL = url;

          mongoose.connect.mockResolvedValueOnce({
            connection: { host: "test-host" },
          });

          await connectDB();

          expect(mongoose.connect).toHaveBeenCalledWith(url);
        });
      });
    });

    describe("Invalid Connection Scenarios", () => {
      const invalidScenarios = [
        {
          url: "",
          description: "empty string",
          errorMsg: "Connection string is required",
        },
        {
          url: "invalid-url",
          description: "malformed URL",
          errorMsg: "Invalid connection string format",
        },
        {
          url: "http://localhost:27017",
          description: "wrong protocol",
          errorMsg: "Protocol must be mongodb or mongodb+srv",
        },
      ];

      invalidScenarios.forEach(({ url, description, errorMsg }) => {
        it(`should handle ${description}`, async () => {
          process.env.MONGO_URL = url;

          const mockError = new Error(errorMsg);
          mongoose.connect.mockRejectedValueOnce(mockError);

          await connectDB();

          expect(mongoose.connect).toHaveBeenCalledWith(url);
          // The actual code logs: `Error in Mongodb ${error}` where error includes "Error: " prefix
          expect(mockConsoleLog).toHaveBeenCalledWith(
            `Error in Mongodb Error: ${errorMsg}`
          );
        });
      });
    });
  });

  // Boundary Value Analysis
  describe("Connection Timeout Scenarios", () => {
    it("should handle immediate connection success", async () => {
      const mockConnection = {
        connection: { host: "fast-server" },
      };

      // Simulate immediate resolution
      mongoose.connect.mockResolvedValueOnce(mockConnection);

      const startTime = Date.now();
      await connectDB();
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100); // Should be very fast
      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Connected To Mongodb Database fast-server"
      );
    });

    it("should handle delayed connection success", async () => {
      const mockConnection = {
        connection: { host: "slow-server" },
      };

      // Simulate delayed resolution
      mongoose.connect.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve(mockConnection), 100)
          )
      );

      await connectDB();

      expect(mockConsoleLog).toHaveBeenCalledWith(
        "Connected To Mongodb Database slow-server"
      );
    });
  });

  // Function Behavior Testing
  describe("Function Characteristics", () => {
    it("should be an async function", () => {
      expect(connectDB.constructor.name).toBe("AsyncFunction");
    });

    it("should not return a value", async () => {
      mongoose.connect.mockResolvedValueOnce({
        connection: { host: "test" },
      });

      const result = await connectDB();
      expect(result).toBeUndefined();
    });

    it("should be callable multiple times", async () => {
      const mockConnection = {
        connection: { host: "multi-call-test" },
      };

      mongoose.connect.mockResolvedValue(mockConnection);

      await connectDB();
      await connectDB();
      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledTimes(3);
      expect(mockConsoleLog).toHaveBeenCalledTimes(3);
    });
  });

  // Environment Configuration Testing
  describe("Environment Configuration", () => {
    it("should work in different NODE_ENV settings", async () => {
      const originalEnv = process.env.NODE_ENV;
      const environments = ["development", "production", "test"];

      for (const env of environments) {
        process.env.NODE_ENV = env;
        jest.clearAllMocks();
        mockConsoleLog.mockClear();

        mongoose.connect.mockResolvedValueOnce({
          connection: { host: `${env}-server` },
        });

        await connectDB();

        expect(mongoose.connect).toHaveBeenCalled();
        expect(mockConsoleLog).toHaveBeenCalledWith(
          `Connected To Mongodb Database ${env}-server`
        );
      }

      process.env.NODE_ENV = originalEnv;
    });

    it("should handle missing environment variables gracefully", async () => {
      const originalMongoUrl = process.env.MONGO_URL;
      delete process.env.MONGO_URL;

      mongoose.connect.mockResolvedValueOnce({
        connection: { host: "default-host" },
      });

      await connectDB();

      expect(mongoose.connect).toHaveBeenCalledWith(undefined);

      process.env.MONGO_URL = originalMongoUrl;
    });
  });
});
