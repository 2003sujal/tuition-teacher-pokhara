/**
 * Create (or reset) the initial administrator.
 *
 *   npm run seed:admin            → creates the admin if none exists with ADMIN_EMAIL
 *   npm run seed:admin -- --reset → also resets that admin's password
 *
 * Reads MONGODB_URI, ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD and ADMIN_NAME from
 * .env.local / .env. Credentials are never hardcoded.
 */
import { config } from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const { MONGODB_URI, ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD, ADMIN_NAME } = process.env;
  const reset = process.argv.includes("--reset");

  if (!MONGODB_URI) throw new Error("MONGODB_URI is not set");
  if (!ADMIN_EMAIL) throw new Error("ADMIN_EMAIL is not set");
  if (!ADMIN_INITIAL_PASSWORD || ADMIN_INITIAL_PASSWORD.length < 10) {
    throw new Error("ADMIN_INITIAL_PASSWORD must be set and at least 10 characters long");
  }

  await mongoose.connect(MONGODB_URI);
  const { Admin } = await import("../src/models/Admin");
  const { Tutor } = await import("../src/models/Tutor");
  const { Settings } = await import("../src/models/Settings");

  // Make sure indexes exist (unique applicationId, email, etc.).
  await Promise.all([Admin.syncIndexes(), Tutor.syncIndexes(), Settings.syncIndexes()]);

  const email = ADMIN_EMAIL.trim().toLowerCase();
  const existing = await Admin.findOne({ email });

  if (existing && !reset) {
    console.log(`✔ Admin ${email} already exists. Use --reset to reset the password.`);
  } else if (existing) {
    existing.passwordHash = await bcrypt.hash(ADMIN_INITIAL_PASSWORD, 12);
    existing.sessionVersion = (existing.sessionVersion ?? 0) + 1;
    await existing.save();
    console.log(`✔ Password reset for ${email}. All existing sessions were signed out.`);
  } else {
    await Admin.create({
      name: ADMIN_NAME?.trim() || "Administrator",
      email,
      passwordHash: await bcrypt.hash(ADMIN_INITIAL_PASSWORD, 12),
    });
    console.log(`✔ Admin ${email} created.`);
  }

  await Settings.updateOne({ key: "global" }, { $setOnInsert: { key: "global" } }, { upsert: true });
  console.log("→ Remove ADMIN_INITIAL_PASSWORD from your environment and change the password from Settings after first login.");
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("✖", err instanceof Error ? err.message : err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
