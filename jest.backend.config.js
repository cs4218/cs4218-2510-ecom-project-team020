module.exports = {
  // display name
  displayName: "backend",

  // when testing backend
  testEnvironment: "node",

  // which test to run
  testMatch: [
    "<rootDir>/controllers/*.test.js",
    "<rootDir>/middlewares/*.test.js",
    "<rootDir>/helpers/*.test.js",
    "<rootDir>/routes/*.test.js",
    "<rootDir>/models/*.test.js",
    "<rootDir>/config/*.test.js",
    "<rootDir>/controllers/*.int.test.js",
    "<rootDir>/middlewares/*.int.test.js",
    "<rootDir>/helpers/*.int.test.js",
    "<rootDir>/routes/*.int.test.js",
    "<rootDir>/models/*.int.test.js",
    "<rootDir>/config/*.int.test.js",
  ],

  // jest code coverage
  collectCoverage: true,
  collectCoverageFrom: [
    "<rootDir>/controllers/**",
    "<rootDir>/helpers/**",
    "<rootDir>/middlewares/**",
    "<rootDir>/models/**",
    "<rootDir>/routes/**",
    "<rootDir>/config/**",
  ],
  coverageThreshold: {
    global: {
      lines: 100,
      functions: 100,
    },
  },
};
