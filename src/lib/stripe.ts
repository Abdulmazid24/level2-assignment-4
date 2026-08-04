import Stripe from "stripe";
import config from "../config";
import { AppError } from "../utils/app-error";

let instance: Stripe | null = null;

// Constructed lazily: Stripe throws when handed an empty key, and doing that at
// import time takes the whole API down (auth, cars, bookings) over a payments-only
// setting. Now only the payment routes fail when STRIPE_SECRET_KEY is missing.
export function getStripe(): Stripe {
    if (!config.STRIPE_SECRET_KEY) {
        throw new AppError(503, "Payments are not configured on this server");
    }

    instance ??= new Stripe(config.STRIPE_SECRET_KEY);

    return instance;
}
