module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  setupFiles: ["<rootDir>/src/tests/env.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/tests/setup.ts"],
};
