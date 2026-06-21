# Workshop Frontend Auth Guide

## Backend already supports this

Workshop backend already has the auth-link scaffold:

- `GET /v1/me`
  - Requires `Authorization: Bearer <accessToken>`.
  - Calls AoTTG2 auth-service `GET /v1/me`.
  - If token valid, upserts local `workshop_users` mirror row.
  - Returns Workshop user mirror.
- `POST /v1/assets`
  - Requires bearer token.
  - Upserts Workshop user first.
  - Creates asset with `ownerAuthAccountId = auth accountId`.
- `PATCH /v1/assets/{id}` / `DELETE /v1/assets/{id}`
  - Requires bearer token.
  - Allows owner, `admin`, or `moderator`.
- `GET /v1/assets` / `GET /v1/assets/{id}`
  - Public for now.

## Use AoTTG2 auth-service for login

Do not create Workshop auth.

```text
Frontend -> AoTTG2 auth-service /v1/auth/login
Frontend receives accessToken + refreshToken + profile
Frontend -> Workshop API with Authorization bearer accessToken
Workshop backend validates by calling auth-service /v1/me
Workshop backend creates/updates local workshop_users row
```

## Local URLs

```ts
const AUTH_API_URL = "http://localhost:5010";
const WORKSHOP_API_URL = "http://localhost:5011";
```

Production should move these to env config.

## Login

```ts
type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  photonToken: string;
  accessTokenExpiresAt: string;
  photonTokenExpiresAt: string;
  profile: {
    accountId: string;
    email: string;
    displayName: string;
    photonUserId: string;
    roles: string[];
    avatarKey?: string | null;
  };
};

export async function login(email: string, password: string) {
  const res = await fetch(`${AUTH_API_URL}/v1/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) throw new Error("Login failed");
  return (await res.json()) as LoginResponse;
}
```

## After login: sync Workshop user

Call Workshop `/v1/me` once after login and again on app boot if you still have a token.

```ts
export async function getWorkshopMe(accessToken: string) {
  const res = await fetch(`${WORKSHOP_API_URL}/v1/me`, {
    headers: { authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 401) return null;
  if (!res.ok) throw new Error("Failed to load Workshop user");
  return await res.json();
}
```

## Authenticated Workshop requests

```ts
export async function createAsset(accessToken: string, asset: unknown) {
  const res = await fetch(`${WORKSHOP_API_URL}/v1/assets`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(asset),
  });

  if (res.status === 401) throw new Error("Not logged in");
  if (!res.ok) throw new Error("Create asset failed");
  return await res.json();
}
```

## Token rules

- Never put tokens in URLs.
- Frontend may decode JWT for UI hints only.
- Frontend must not trust decoded token for permissions.
- Workshop backend validates the token.
- On `401`, refresh token or send user to login.

## Simple storage choice

Lazy safe default:

```text
accessToken: memory state
refreshToken: localStorage only if you need persistent login
```

Best later: httpOnly cookie/BFF. Not needed for scaffold.

## Refresh

```ts
export async function refresh(refreshToken: string) {
  const res = await fetch(`${AUTH_API_URL}/v1/auth/refresh`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) return null;
  return (await res.json()) as LoginResponse;
}
```

## Logout

```ts
export async function logout(refreshToken: string) {
  await fetch(`${AUTH_API_URL}/v1/auth/logout`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
}
```

Then clear frontend token state.

## Mental model

```text
Auth account = real account in auth-service
Workshop user = local cached mirror row
Asset owner = auth account id
```

If valid token and no Workshop user row: backend creates it.
If valid token and row exists: backend updates cached display/profile fields.
If invalid token: backend returns `401`.
