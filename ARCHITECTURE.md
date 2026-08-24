# Project structure

The application is organized by feature. Code that changes for the same product
feature should normally live together.

## Frontend

- `frontend/src/features`: feature-owned views, components, types, and helpers.
- `frontend/src/shared/components`: reusable UI with no feature ownership.
- `frontend/src/shared/composables`: application-wide browser, API, session, and socket utilities.
- `frontend/src/shared/types`: types shared by several features.
- `frontend/src/components`: application-shell components such as the top bar.
- `frontend/src/router`: route definitions; feature pages are lazy-loaded from here.
- `frontend/src/i18n`: translation setup and locale catalogs.

When adding a page, start in `features/<feature>/views`. Keep components and
types beside that page unless at least two unrelated features use them.

## Server

- `server/src/modules`: HTTP routes, services, and schemas grouped by domain.
- `server/src/database`: connection setup and data repositories.
- `server/database/migrations`: database schema and migration SQL.
- `server/database/seeds`: explicit development/test seed data.
- `server/src/shared/middleware`: middleware used by multiple modules.
- `server/src/infrastructure`: process-level infrastructure such as socket management.
- `server/src/integrations`: external systems, email, and event scrapers.
- `server/src/jobs`: scheduled orchestration.
- `server/src/config`: environment and security configuration.

`server/src/data.ts` is a compatibility facade for existing socket and scheduler
callers. New database operations should be placed in a domain repository instead
of expanding the facade.

## Naming

- Vue pages: `PascalCaseView.vue`
- Vue components: `PascalCase.vue`
- Server routes: `<domain>Routes.ts`
- Services: `<domain>Service.ts`
- Repositories: `<domain>Repository.ts`
- Tests: next to the unit under test as `<name>.test.ts`
