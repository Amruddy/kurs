#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

const seedOrganizationId = "00000000-0000-4000-8000-000000000001";
const disabledSmokeUserId = "90000000-0000-4000-8000-000000000001";
const disabledSmokeMemberId = "90000000-0000-4000-8000-000000000002";

const roleAccounts = [
  {
    label: "Администратор",
    email: "admin@example.test",
    userId: "10000000-0000-4000-8000-000000000001",
    expectedRole: "admin",
    homePath: "/admin",
    forbiddenPath: "/teacher",
    forbiddenRedirect: "/forbidden?required=teacher",
  },
  {
    label: "Преподаватель",
    email: "teacher@example.test",
    userId: "10000000-0000-4000-8000-000000000002",
    expectedRole: "teacher",
    homePath: "/teacher",
    forbiddenPath: "/admin",
    forbiddenRedirect: "/forbidden?required=admin",
  },
  {
    label: "Ученик",
    email: "student@example.test",
    userId: "10000000-0000-4000-8000-000000000003",
    expectedRole: "student",
    homePath: "/student",
    forbiddenPath: "/teacher",
    forbiddenRedirect: "/forbidden?required=teacher",
  },
];

loadLocalEnv();

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
const baseUrl = normalizeBaseUrl(process.env.SMOKE_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000");
const smokePassword = process.env.DESHAR_AUTH_SMOKE_PASSWORD || `DesharSmoke!${randomUUID()}aA1`;
const disabledSmokeEmail = normalizeEmail(process.env.DESHAR_AUTH_SMOKE_DISABLED_EMAIL || "disabled-smoke@example.test");

if (!publishableKey?.trim()) {
  fail("Не задан NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY или NEXT_PUBLIC_SUPABASE_ANON_KEY.");
}

const adminClient = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

console.log(`Auth smoke: ${baseUrl}`);

await expectRedirect("/admin", null, "/login");
console.log("  [ok] неавторизованный /admin перенаправляет на /login");
await expectLoginDevAuthVisibility();

for (const account of roleAccounts) {
  console.log(`\n${account.label}`);
  const authUserId = await upsertAuthUser(account.email, smokePassword);
  await linkDomainUser(account, authUserId);
  await assertActiveMember(account);

  const session = await signInWithCookieSession(account.email, smokePassword);
  await expectOk(account.homePath, session.cookieHeader(), account.label);
  await expectOk("/profile", session.cookieHeader(), `${account.label}: профиль`);
  await expectRedirect(account.forbiddenPath, session.cookieHeader(), account.forbiddenRedirect);
  console.log(`  [ok] чужая рабочая область заблокирована: ${account.forbiddenPath}`);

  if (account.expectedRole === "admin") {
    await session.client.auth.signOut();
    await expectRedirect("/profile", session.cookieHeader(), "/login");
    console.log("  [ok] logout очищает auth-сессию");
  }
}

console.log("\nОтключенный профиль");
const disabledAuthUserId = await upsertAuthUser(disabledSmokeEmail, smokePassword);
await upsertDisabledSmokeProfile(disabledAuthUserId);
const disabledSession = await signInWithCookieSession(disabledSmokeEmail, smokePassword);
await expectRedirect("/student", disabledSession.cookieHeader(), "/login?error=profile_disabled");
console.log("  [ok] users.auth_status = disabled не проходит session resolver");

console.log("\nAuth smoke прошел.");

async function upsertAuthUser(email, password) {
  const existingUser = await findAuthUserByEmail(email);

  if (existingUser) {
    const { data, error } = await adminClient.auth.admin.updateUserById(existingUser.id, {
      email_confirm: true,
      password,
      user_metadata: {
        deshar_smoke: true,
      },
    });

    if (error || !data.user?.id) {
      fail(`Не удалось обновить Supabase Auth пользователя ${email}: ${error?.message ?? "пустой ответ"}`);
    }

    return data.user.id;
  }

  const { data, error } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    password,
    user_metadata: {
      deshar_smoke: true,
    },
  });

  if (error || !data.user?.id) {
    fail(`Не удалось создать Supabase Auth пользователя ${email}: ${error?.message ?? "пустой ответ"}`);
  }

  return data.user.id;
}

async function findAuthUserByEmail(email) {
  const targetEmail = normalizeEmail(email);
  let page = 1;
  const perPage = 100;

  while (true) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });

    if (error) {
      fail(`Не удалось прочитать Supabase Auth users: ${error.message}`);
    }

    const users = data?.users ?? [];
    const found = users.find((user) => normalizeEmail(user.email ?? "") === targetEmail);

    if (found) {
      return found;
    }

    if (users.length < perPage) {
      return null;
    }

    page += 1;
  }
}

async function linkDomainUser(account, authUserId) {
  const { data, error } = await adminClient
    .from("users")
    .update({
      auth_status: "active",
      auth_user_id: authUserId,
      status: "active",
    })
    .eq("id", account.userId)
    .select("id,email,auth_status,auth_user_id,status")
    .maybeSingle();

  if (error || !data) {
    fail(`Не удалось связать доменный профиль ${account.email}: ${error?.message ?? "профиль не найден"}`);
  }

  if (data.auth_user_id !== authUserId || data.auth_status !== "active" || data.status !== "active") {
    fail(`Доменный профиль ${account.email} не перешел в active auth-состояние.`);
  }

  console.log("  [ok] Supabase Auth user связан с users.auth_user_id");
}

async function assertActiveMember(account) {
  const { data, error } = await adminClient
    .from("organization_members")
    .select("roles,status")
    .eq("organization_id", seedOrganizationId)
    .eq("user_id", account.userId)
    .maybeSingle();

  if (error || !data) {
    fail(`Не найдено активное членство organization_members для ${account.email}: ${error?.message ?? "нет строки"}`);
  }

  const roles = Array.isArray(data.roles) ? data.roles : [];

  if (data.status !== "active" || !roles.includes(account.expectedRole)) {
    fail(`У ${account.email} нет роли ${account.expectedRole} в активной организации.`);
  }

  console.log("  [ok] активная роль найдена в organization_members");
}

async function upsertDisabledSmokeProfile(authUserId) {
  const { error: userError } = await adminClient.from("users").upsert(
    {
      auth_status: "disabled",
      auth_user_id: authUserId,
      email: disabledSmokeEmail,
      id: disabledSmokeUserId,
      name: "Smoke Disabled Auth",
      status: "active",
    },
    { onConflict: "id" },
  );

  if (userError) {
    fail(`Не удалось подготовить disabled smoke profile: ${userError.message}`);
  }

  const { error: memberError } = await adminClient.from("organization_members").upsert(
    {
      id: disabledSmokeMemberId,
      organization_id: seedOrganizationId,
      permissions: [],
      roles: ["student"],
      status: "active",
      user_id: disabledSmokeUserId,
    },
    { onConflict: "organization_id,user_id" },
  );

  if (memberError) {
    fail(`Не удалось подготовить disabled smoke membership: ${memberError.message}`);
  }
}

async function signInWithCookieSession(email, password) {
  const jar = new Map();
  const client = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return [...jar.entries()].map(([name, value]) => ({ name, value }));
      },
      setAll(cookiesToSet) {
        for (const cookie of cookiesToSet) {
          if (cookie.options?.maxAge === 0 || cookie.value === "") {
            jar.delete(cookie.name);
          } else {
            jar.set(cookie.name, cookie.value);
          }
        }
      },
    },
  });

  const { data, error } = await client.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    fail(`Не удалось войти через Supabase Auth как ${email}: ${error?.message ?? "пустой ответ"}`);
  }

  if (!cookieHeaderFromJar(jar)) {
    fail(`Supabase SSR client не записал auth cookies для ${email}.`);
  }

  console.log("  [ok] Supabase Auth signInWithPassword создал SSR cookies");

  return {
    client,
    cookieHeader() {
      return cookieHeaderFromJar(jar);
    },
  };
}

async function expectOk(path, cookieHeader, label = path) {
  const response = await requestPath(path, cookieHeader);

  if (response.status < 200 || response.status >= 300) {
    fail(`${label}: ожидался 2xx, получено ${response.status}${formatLocation(response.location)}`);
  }

  console.log(`  [ok] ${label}: ${path}`);
}

async function expectRedirect(path, cookieHeader, expectedPathPrefix) {
  const response = await requestPath(path, cookieHeader);
  const location = response.location ? locationPath(response.location) : "";

  if (response.status < 300 || response.status >= 400 || !location.startsWith(expectedPathPrefix)) {
    fail(`${path}: ожидался redirect на ${expectedPathPrefix}, получено ${response.status}${formatLocation(response.location)}`);
  }
}

async function requestPath(path, cookieHeader) {
  const response = await fetch(new URL(path, baseUrl), {
    headers: cookieHeader ? { cookie: cookieHeader } : {},
    redirect: "manual",
  });

  const body = await response.text();

  return {
    body,
    location: response.headers.get("location"),
    status: response.status,
  };
}

async function expectLoginDevAuthVisibility() {
  const response = await requestPath("/login", null);

  if (response.status < 200 || response.status >= 300) {
    fail(`/login: ожидался 2xx, получено ${response.status}${formatLocation(response.location)}`);
  }

  const hasDevButton = response.body.includes("Войти как админ");
  const devAuthExpected = process.env.DESHAR_ENABLE_DEV_AUTH === "1";

  if (hasDevButton !== devAuthExpected) {
    const expectedText = devAuthExpected ? "видимым" : "скрытым";
    fail(`dev-auth должен быть ${expectedText} при DESHAR_ENABLE_DEV_AUTH=${process.env.DESHAR_ENABLE_DEV_AUTH ?? ""}.`);
  }

  console.log(`  [ok] dev-auth ${devAuthExpected ? "доступен по флагу" : "скрыт без флага"}`);
}

function cookieHeaderFromJar(jar) {
  return [...jar.entries()].map(([name, value]) => `${name}=${value}`).join("; ");
}

function loadLocalEnv() {
  const originalKeys = new Set(Object.keys(process.env));
  const merged = {
    ...readEnvFile(".env"),
    ...readEnvFile(".env.local"),
  };

  for (const [key, value] of Object.entries(merged)) {
    if (!originalKeys.has(key)) {
      process.env[key] = value;
    }
  }
}

function readEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const parsed = {};
  const lines = readFileSync(path, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    parsed[key] = value;
  }

  return parsed;
}

function requiredEnv(name) {
  const value = process.env[name];

  if (!value?.trim()) {
    fail(`Не задана переменная окружения ${name}.`);
  }

  return value;
}

function locationPath(location) {
  try {
    const parsed = new URL(location, baseUrl);
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return location;
  }
}

function formatLocation(location) {
  return location ? ` -> ${locationPath(location)}` : "";
}

function normalizeBaseUrl(value) {
  return value.endsWith("/") ? value : `${value}/`;
}

function normalizeEmail(value) {
  return value.trim().toLowerCase();
}

function fail(message) {
  console.error(`\nAuth smoke не прошел: ${message}`);
  process.exit(1);
}
