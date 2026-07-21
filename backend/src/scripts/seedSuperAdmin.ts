// src/scripts/seedSuperAdmin.ts
//
// One-time bootstrap script: creates the first super_admin account.
// The public /auth/register endpoint deliberately excludes the
// super_admin role (anyone could otherwise self-register as platform
// owner), so this script is the only way to create the very first
// admin account. After that, the super_admin can create further users
// of any role from the Users Management page.
//
// Usage:
//   cd backend
//   npm run seed:admin -- --email admin@example.com --password "StrongPass123" --firstName Ada --lastName Lovelace
//
// Or set env vars SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD / SEED_ADMIN_FIRST_NAME / SEED_ADMIN_LAST_NAME
// and run: npm run seed:admin

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { UserModel } from "../infrastructure/database/models/User.model";
import { defaultPermissions } from "../domain/entities/User.entity";
import { config } from "../config/app.config";

function parseArgs(): Record<string, string> {
  const args: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith("--")) {
        args[key] = value;
        i++;
      }
    }
  }
  return args;
}

async function main() {
  const args = parseArgs();

  const email = (args.email || process.env.SEED_ADMIN_EMAIL || "").toLowerCase().trim();
  const password = args.password || process.env.SEED_ADMIN_PASSWORD || "";
  const firstName = args.firstName || process.env.SEED_ADMIN_FIRST_NAME || "Super";
  const lastName = args.lastName || process.env.SEED_ADMIN_LAST_NAME || "Admin";

  if (!email || !password) {
    console.error(
      "Missing required fields. Pass --email and --password, or set SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD.",
    );
    process.exit(1);
  }
  if (password.length < 8) {
    console.error("Password must be at least 8 characters.");
    process.exit(1);
  }

  await mongoose.connect(config.db.uri);
  console.log("Connected to MongoDB.");

  const existing = await UserModel.findOne({ email });
  if (existing) {
    console.error(`A user with email "${email}" already exists (role: ${existing.role}). Aborting.`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await UserModel.create({
    email,
    passwordHash,
    role: "super_admin",
    firstName,
    lastName,
    isActive: true,
    isEmailVerified: true,
    permissions: defaultPermissions.super_admin,
    fcmTokens: [],
  });

  console.log(`✅ Super admin created: ${email}`);
  console.log("You can now log in at /login with this email and password.");

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
