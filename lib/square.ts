/**
 * Square Payment Client — SINGLETON
 * Every file that needs Square imports from here. No other file creates a Square client.
 */
import { SquareClient, SquareEnvironment } from "square";

const isConfigured = !!(
  process.env.SQUARE_ACCESS_TOKEN &&
  process.env.SQUARE_APPLICATION_ID &&
  process.env.SQUARE_LOCATION_ID
);

if (!isConfigured) {
  console.warn("Square not configured — running in demo payment mode");
}

const squareClient = isConfigured
  ? new SquareClient({
      token: process.env.SQUARE_ACCESS_TOKEN!,
      environment:
        process.env.SQUARE_ENVIRONMENT === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    })
  : null;

export { squareClient, isConfigured };
export const SQUARE_LOCATION_ID = process.env.SQUARE_LOCATION_ID || "";
