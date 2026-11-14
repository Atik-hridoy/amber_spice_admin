# Amber Spice Admin

## Menu categories

Open **Products → Add Category** to create a saved menu category. Name is required; description, image, display order, visibility and a custom slug are optional. Use **Choose Image** to select a JPG, PNG or WebP file up to 5 MB, preview it and replace/remove it before saving. An external image URL is also supported. The modal displays backend validation errors and stays open when saving fails.

Files upload as authenticated multipart form data when saving. The backend validates and stores the image, returns its public `imageUrl`, and the saved category tab displays that URL after creation and page reload. Apply the backend migration with `python manage.py migrate` before using uploads. Server-side validation also limits images to 6000 pixels per side and 25 megapixels.

The category list and Add/Edit Dish dropdown use `GET /api/v1/menu/categories/`, following all pagination pages. Creating a category uses an authenticated `POST` to the same endpoint. Saved categories appear immediately and are loaded from the backend after a page reload. Hidden categories are labeled and excluded from the active dish dropdown.

Use a connected account with `menu:manage` permission. Offline preview credentials cannot save categories. Both remembered and browser-session logins supply API credentials, with access-token refresh when available.

## Dishes and Added by

**Products → Add New Dish** creates a dish through `POST /api/v1/menu/dishes/` using a real integer category ID. Name, category and positive price are required. The form supports description, image upload or external URL, kitchen station, spice, dietary labels, preparation time and availability/popular/bestseller/special flags. Uploads use the same limits as category images.

Products load from the backend, following pagination. Edit uses PATCH and preserves the existing image unless changed. Availability switches call the availability API and read back the saved record. Failed saves keep the form open; list failures offer retry. Saved records survive reload. The local mock dish store has been removed. The customer website reads the same categories and dishes.

Category tabs and dish cards display **Added by** from the read-only API response. The backend selects the logged-in creator and preserves it on edit. Older records without recorded creators show **Not recorded**. The form cannot set another creator.

Dish API contract: `../resturent_backend/docs/menu-dishes.md`.

## Development and verification

- Start Django on `http://127.0.0.1:8000` and run `npm run dev` for the admin on port 5174.
- Optional: copy `.env.example` into `.env.local` to configure `VITE_API_BASE_URL`. The default is `http://127.0.0.1:8000/api/v1`.
- `npm test` runs the service/form integration tests in jsdom with mocked HTTP responses.
- `npm run build` checks TypeScript and builds the production app; `npm run lint` runs Oxlint.
- Category API contract: `../resturent_backend/docs/menu-categories.md`.

## React tooling

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
