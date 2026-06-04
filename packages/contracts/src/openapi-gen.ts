/**
 * OpenAPI 3.1 generation from Zod schemas.
 * Run: pnpm contracts:build
 * Output: docs/api/openapi.json
 *
 * ADR-001: We use zod-to-json-schema + manual OpenAPI wrapper at MVP instead of
 * a heavier codegen tool. Revisit when schema count > ~50 contracts.
 */

import { zodToJsonSchema } from "zod-to-json-schema";
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import {
  SignupRequestSchema, SignupResponseSchema,
  LoginRequestSchema, LoginResponseSchema,
  MeResponseSchema, LogoutResponseSchema,
} from "./auth.js";
import {
  CreateOrgRequestSchema, CreateOrgResponseSchema,
  InviteMemberRequestSchema, InviteMemberResponseSchema,
  ChangeMemberRoleRequestSchema, ChangeMemberRoleResponseSchema,
} from "./org.js";
import {
  DiagnosticUploadRequestSchema, DiagnosticUploadResponseSchema, DiagnosticResultSchema,
  DiagnosticErrorCodeSchema,
} from "./diagnostic.js";
import { AuthErrorCodeSchema, BillingErrorCodeSchema, GeneralErrorCodeSchema } from "./errors.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../../../docs/api");

function schemaRef(name: string): object {
  return { $ref: `#/components/schemas/${name}` };
}

const openapi = {
  openapi: "3.1.0",
  info: {
    title: "Trajct API",
    version: "1.0.0",
    description: "Trajct platform API — contract-first, Zod-generated schemas.",
  },
  servers: [
    { url: "http://localhost:3001", description: "Local dev" },
    { url: "https://api-staging.trajct.com", description: "Staging" },
    { url: "https://api.trajct.com", description: "Production" },
  ],
  paths: {
    "/v1/auth/signup": {
      post: {
        tags: ["auth"],
        summary: "Sign up a new user (F-070)",
        requestBody: { required: true, content: { "application/json": { schema: schemaRef("SignupRequest") } } },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: schemaRef("SignupResponse") } } },
          "400": { description: "Validation error", content: { "application/json": { schema: schemaRef("GeneralError") } } },
          "409": { description: "Email already taken", content: { "application/json": { schema: schemaRef("GeneralError") } } },
        },
      },
    },
    "/v1/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Login (F-070)",
        requestBody: { required: true, content: { "application/json": { schema: schemaRef("LoginRequest") } } },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: schemaRef("LoginResponse") } } },
          "401": { description: "Invalid credentials", content: { "application/json": { schema: schemaRef("AuthError") } } },
          "429": { description: "Rate limited", content: { "application/json": { schema: schemaRef("AuthError") } } },
        },
      },
    },
    "/v1/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Get current session user",
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: schemaRef("MeResponse") } } },
          "401": { description: "Unauthorized", content: { "application/json": { schema: schemaRef("AuthError") } } },
        },
      },
    },
    "/v1/auth/logout": {
      post: {
        tags: ["auth"],
        summary: "Logout",
        security: [{ sessionAuth: [] }],
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: schemaRef("LogoutResponse") } } },
        },
      },
    },
    "/v1/orgs": {
      post: {
        tags: ["orgs"],
        summary: "Create an org (F-070)",
        security: [{ sessionAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: schemaRef("CreateOrgRequest") } } },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: schemaRef("CreateOrgResponse") } } },
        },
      },
    },
    "/v1/orgs/{orgId}/members/invite": {
      post: {
        tags: ["orgs"],
        summary: "Invite a member (F-072e)",
        security: [{ sessionAuth: [] }],
        parameters: [{ name: "orgId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        requestBody: { required: true, content: { "application/json": { schema: schemaRef("InviteMemberRequest") } } },
        responses: {
          "201": { description: "Invite sent", content: { "application/json": { schema: schemaRef("InviteMemberResponse") } } },
        },
      },
    },
    "/v1/diagnostic/upload": {
      post: {
        tags: ["diagnostic"],
        summary: "Upload resume for F-001 diagnostic",
        security: [{ sessionAuth: [] }],
        requestBody: { required: true, content: { "multipart/form-data": { schema: schemaRef("DiagnosticUploadRequest") } } },
        responses: {
          "202": { description: "Accepted — job queued", content: { "application/json": { schema: schemaRef("DiagnosticUploadResponse") } } },
          "413": { description: "File too large", content: { "application/json": { schema: schemaRef("DiagnosticError") } } },
          "415": { description: "Unsupported format", content: { "application/json": { schema: schemaRef("DiagnosticError") } } },
          "429": { description: "Rate limited", content: { "application/json": { schema: schemaRef("DiagnosticError") } } },
          "503": { description: "Engine unavailable", content: { "application/json": { schema: schemaRef("DiagnosticError") } } },
        },
      },
    },
    "/v1/diagnostic/{diagnosticId}": {
      get: {
        tags: ["diagnostic"],
        summary: "Poll diagnostic job status (F-001)",
        security: [{ sessionAuth: [] }],
        parameters: [{ name: "diagnosticId", in: "path", required: true, schema: { type: "string", format: "uuid" } }],
        responses: {
          "200": { description: "Result", content: { "application/json": { schema: schemaRef("DiagnosticResult") } } },
          "404": { description: "Not found", content: { "application/json": { schema: schemaRef("GeneralError") } } },
        },
      },
    },
    "/healthz": {
      get: {
        tags: ["health"],
        summary: "Liveness check",
        responses: { "200": { description: "OK" } },
      },
    },
    "/readyz": {
      get: {
        tags: ["health"],
        summary: "Readiness check",
        responses: { "200": { description: "Ready" }, "503": { description: "Not ready" } },
      },
    },
  },
  components: {
    securitySchemes: {
      sessionAuth: { type: "apiKey", in: "cookie", name: "session" },
    },
    schemas: {
      SignupRequest: zodToJsonSchema(SignupRequestSchema, { $refStrategy: "none" }),
      SignupResponse: zodToJsonSchema(SignupResponseSchema, { $refStrategy: "none" }),
      LoginRequest: zodToJsonSchema(LoginRequestSchema, { $refStrategy: "none" }),
      LoginResponse: zodToJsonSchema(LoginResponseSchema, { $refStrategy: "none" }),
      MeResponse: zodToJsonSchema(MeResponseSchema, { $refStrategy: "none" }),
      LogoutResponse: zodToJsonSchema(LogoutResponseSchema, { $refStrategy: "none" }),
      CreateOrgRequest: zodToJsonSchema(CreateOrgRequestSchema, { $refStrategy: "none" }),
      CreateOrgResponse: zodToJsonSchema(CreateOrgResponseSchema, { $refStrategy: "none" }),
      InviteMemberRequest: zodToJsonSchema(InviteMemberRequestSchema, { $refStrategy: "none" }),
      InviteMemberResponse: zodToJsonSchema(InviteMemberResponseSchema, { $refStrategy: "none" }),
      ChangeMemberRoleRequest: zodToJsonSchema(ChangeMemberRoleRequestSchema, { $refStrategy: "none" }),
      ChangeMemberRoleResponse: zodToJsonSchema(ChangeMemberRoleResponseSchema, { $refStrategy: "none" }),
      DiagnosticUploadRequest: zodToJsonSchema(DiagnosticUploadRequestSchema, { $refStrategy: "none" }),
      DiagnosticUploadResponse: zodToJsonSchema(DiagnosticUploadResponseSchema, { $refStrategy: "none" }),
      DiagnosticResult: zodToJsonSchema(DiagnosticResultSchema, { $refStrategy: "none" }),
      DiagnosticError: zodToJsonSchema(DiagnosticErrorCodeSchema, { $refStrategy: "none" }),
      AuthError: zodToJsonSchema(AuthErrorCodeSchema, { $refStrategy: "none" }),
      BillingError: zodToJsonSchema(BillingErrorCodeSchema, { $refStrategy: "none" }),
      GeneralError: zodToJsonSchema(GeneralErrorCodeSchema, { $refStrategy: "none" }),
    },
  },
};

mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "openapi.json"), JSON.stringify(openapi, null, 2));
console.log("✓ OpenAPI 3.1 written to docs/api/openapi.json");
