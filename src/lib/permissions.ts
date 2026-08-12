export type UserRole = "Master" | "Ambassador" | "Champion" | "Core" | "admin" | "user";

export interface FeaturePermissions {
  home: boolean;
  utilisation: boolean;
  profitability: boolean;
  clientPortfolio: boolean;
  resourcePlanner: boolean;
  feeCalculator: boolean;
  operationsHub: boolean;
  settings: boolean;
}

export const DEFAULT_ROLE_PERMISSIONS: Record<string, FeaturePermissions> = {
  Master: {
    home: true,
    utilisation: true,
    profitability: true,
    clientPortfolio: true,
    resourcePlanner: true,
    feeCalculator: true,
    operationsHub: true,
    settings: true,
  },
  Ambassador: {
    home: true,
    utilisation: true,
    profitability: true,
    clientPortfolio: true,
    resourcePlanner: false, // Flagged as still in active development
    feeCalculator: true,
    operationsHub: false, // Flagged as still in active development
    settings: true,
  },
  Champion: {
    home: true,
    utilisation: true,
    profitability: true,
    clientPortfolio: false,
    resourcePlanner: false,
    feeCalculator: true,
    operationsHub: false,
    settings: false,
  },
  Core: {
    home: true,
    utilisation: true,
    profitability: true,
    clientPortfolio: false,
    resourcePlanner: false,
    feeCalculator: true,
    operationsHub: false,
    settings: false,
  }
};
