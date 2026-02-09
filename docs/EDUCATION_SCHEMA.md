# KonnectEd Education Platform – Database Schema (Proposed, Industry-Style)

This repo uses **PostgreSQL + Drizzle ORM**. The API layer will be **Hono**.

## Non-goal: Users/Auth

This schema **does not own auth/users**. Any `userId`/`authorId`/`createdBy` columns store the **external auth server’s user id** (e.g., Better Auth user id). There are **no foreign keys** to an auth schema.

## Core content model (your requirement)

Hierarchy:

`Book → Topic → (Subtopic | Note | Question)`

Notes/Questions can be attached **directly to a Topic** (no subtopic) or attached to a **Subtopic**:

- `notes.topicId` (required), `notes.subtopicId` (nullable)
- `questions.topicId` (required), `questions.subtopicId` (nullable)

### Content lifecycle & visibility

Use:

- `status` (`content_status`): `DRAFT | PENDING_REVIEW | PUBLISHED | REJECTED`
- `visibility` (`content_visibility`): `PUBLIC | UNLISTED | PRIVATE`
- `accessLevel` (`access_level`): `FREE | PREMIUM | PAID`

These fields exist on:

- `books`, `topics`, `subtopics`, `notes`, `questions`

Recommended rules:

- `visibility=PRIVATE` means “only collaborators/owners/admins”.
- `accessLevel=PAID` means “requires an entitlement for access (purchase/subscription)”.
- `accessLevel=PREMIUM` means “requires an active subscription entitlement”.

## Collaboration (new tables)

Defined in `/src/db/schema/collaboration.ts`.

### `note_documents`

Stores the current collaborative document for a note, in **JSON** (Lexical/ProseMirror/etc).

Common query:

- fetch latest editor state: `where note_id = ?`

### `note_revisions`

Append-only snapshots for audit/rollback.

Common query:

- list history: `where note_id = ? order by version desc`

### `note_collaborators`

Explicit ACLs for private/unlisted notes.

Roles (`collaborator_role`):

- `OWNER`, `EDITOR`, `COMMENTER`, `VIEWER`

### `content_comments`, `content_reactions`

Polymorphic engagement tables (work across notes/questions/answers).

Use `resourceType` (`resource_type`) + `resourceId` to point at content.

## Commerce & entitlement system (new tables)

Defined in `/src/db/schema/commerce.ts`.

### Design principle

Avoid “ad-hoc purchase tables per content type”. Instead:

- sell `products`
- attach `product_prices`
- record `orders`, `order_items`, `payments` (and `refunds`)
- grant access via `entitlements`

This scales from:

- “buy one note”
- “subscription to premium”
- “bundle of notes”
- “buy an entire book”

### Tables

- `products`: canonical sellable items (`ONE_TIME` or `SUBSCRIPTION`)
- `product_prices`: prices (currency, amount, optional billing interval)
- `product_content_grants`: what content a product grants access to
- `orders`: user checkout/receipt
- `order_items`: line items
- `payments` / `refunds`: provider status + reconciliation
- `subscriptions`: recurring relationship (provider ids + periods)
- `entitlements`: the *authorization primitive* the API checks

### Entitlement checks (API-side)

When serving a `PAID` resource:

1. Look for `entitlements` where:
   - `userId = caller`
   - `resourceType/resourceId` matches target (or parent bundle rules you define)
   - `expiresAt IS NULL OR expiresAt > now()`
2. If none → `402`/`403` depending on your product policy.

## Taxonomy (new tables)

Defined in `/src/db/schema/taxonomy.ts`.

- `tags`: canonical tags
- `content_tags`: polymorphic many-to-many (`resourceType/resourceId`)
- `user_tag_follows`: optional future feature

This replaces “`tags text[]`” long-term (arrays are fine for prototypes, but a tags table is better for moderation, analytics, deduping, and search).

## API suggestions (Hono, resource-first)

### Public content

- `GET /public/books`
- `GET /public/books/:bookId`
- `GET /public/books/:bookId/topics`
- `GET /public/topics/:topicId/subtopics`
- `GET /public/topics/:topicId/notes` (include `subtopicId` filter)
- `GET /public/topics/:topicId/questions` (include `subtopicId` filter)

### Authoring & moderation

- `POST /books`, `PATCH /books/:id`
- `POST /topics`, `PATCH /topics/:id`
- `POST /subtopics`, `PATCH /subtopics/:id`
- `POST /notes`, `PATCH /notes/:id`
- `POST /notes/:id/publish` (sets `status=PUBLISHED`, `publishedAt`)
- `POST /moderation/review-tasks/:id/approve|reject`

### Collaboration

- `GET /notes/:id/document`
- `PUT /notes/:id/document` (optimistic concurrency via `version`)
- `POST /notes/:id/revisions` (server creates snapshot)
- `POST /notes/:id/collaborators` / `DELETE /notes/:id/collaborators/:userId`
- `GET /content/:type/:id/comments`
- `POST /content/:type/:id/comments`

### Commerce

- `GET /products` (public catalog)
- `POST /checkout` (creates `orders` + provider checkout session)
- `POST /webhooks/:provider` (updates `payments`, `subscriptions`, creates `entitlements`)
- `GET /me/entitlements`

## Migration notes (from current v1)

The repo already has a v1 schema (`/src/db/schema/content.ts`, `/src/db/schema/social.ts`, `/src/db/schema/qa.ts`, …).

Recommended path:

1. Keep v1 tables running.
2. Start recording **orders/payments/entitlements** for all new purchases.
3. Gradually deprecate `note_purchases` once orders are stable.
4. Move note editing to `note_documents` (and store snapshots in `note_revisions`).
5. Move `questions.tags (text[])` to `tags` + `content_tags` for cleaner analytics/search.

