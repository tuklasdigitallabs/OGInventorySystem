import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json"
    }
  },
  roots: ["<rootDir>/test/e2e"],
  testRegex: ".*\\.e2e-spec\\.ts$",
  moduleFileExtensions: ["ts", "js", "json"]
};

export default config;

