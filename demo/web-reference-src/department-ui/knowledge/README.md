# Knowledge Web 1.2.2

The existing `pages/knowledge/index` entry renders four views: knowledge dashboard, material directory, knowledge assistant, and generation/my works. Legacy `tab=catalog|playbook|proposal` links open business references. `pc/knowledge-data.js` and `KnowledgeAdvice.jsx` retain existing behavior; their sample catalog and CRM advice are not counted or cited as knowledge retrieval.

`Knowledge` accepts a `service` prop for isolated verification. Production uses the existing runtime API and current session. This subtree contains no provider URL, credential access or separate login implementation.

## Fixed integration dependencies

- Domain base: `dff52afe206c889811e106462a6ac1efb130d281`.
- Internal API G1: `d79b7c4b229c2a6e77f5114b95c6ab8594f7c787`; G2: `14d1632b31427d6bc880f0a67ecd4ba4d113745a`. G2 supersedes the earlier paging-only boundary.
- Approved shared Web file bridge: `3dc4e29864ee20144e31b41f080e9625f1049ddd`, with upload identity successor `983ef51e2c3c156312efa0f71891a6f39666d5d1`. Both are consumed as complete approved histories. Their shared files are maintained by the Web owner, not this slice.

`service.js` calls the internal knowledge API through `apiClient.request` with `fresh: true` and caller-owned UUID idempotency keys. Catalog, directory, detail/versions, manageable ACL, contributions and version append use the frozen DTOs. Save success is displayed only after material detail is read back. The 14 business fields use current catalog enums and standard CRM references; changing categories clears hidden fields. Business audience does not grant system access. Same-name conflict requires an explicit existing-material version choice or a changed supplement.

## Directory and dashboard

G2 performs q/category/product/state/scope/period/retrievable filters on the complete currently authorized set before pagination. The adapter requires `{items,total,limit,offset,capabilities:{create}}`; create capability is server-produced. It maps `can_edit/can_manage` only for display, never as an authorization grant.

Personal scope includes all owned materials, including shared ones. Team and shared scopes may overlap. `period=30d` refers to material creation, not new-version upload. `state` is the latest saved version; `active_version_state` is separate. Reference pickers request `retrievable=true`, require an active retrievable version and never label the latest failed/saved version as the retrieved source.

Dashboard values come from `/knowledge/stats` with source `salesbuddy.internal_materials`, server `observed_at`, and the same filters. Metrics retain the full KnowledgeCount shape, preserving real zero versus unknown. Contributions are a composition by contributor, not a ranking. Trend is the current readable set accumulated by creation date over UTC days, not a historical authorization snapshot. Failed/latest and retrievable/active counts can overlap. JingSocial count is a distinct external source; it is not substituted with internal totals.

## Shared file transport

Production calls the approved `pc/knowledge-file-transport.js` wrapper, which uses the existing authenticated transport:

- `uploadKnowledgeFile(file, {idempotencyKey}) -> {file_id, filename, media_type, size_bytes, sha256}`. Multipart `file`, 0 < size <= 50 MiB. The shared transport sends and validates the UUID Idempotency-Key and keeps the same file/key during auth refresh.
- `readKnowledgeFile(fileId, {versionId, preview}) -> {data: ArrayBuffer, contentType, filename}`. The adapter validates bytes then builds a Blob. Every click uses a fresh authenticated current-ACL request. The UI never treats a cached storage URL as authorization.

`upload-intent.js` binds uncertain uploads to current identity, file metadata and SHA-256 content. Only opaque digest slots and UUIDs are saved in sessionStorage, with an in-memory fallback. Retrying or reselecting the same file keeps its key until a confirmed file receipt; bytes and credentials are not persisted. Material writes similarly retain an unchanged form's key during retries. A saved material with a failed readback can retry the read without a second POST.

Current backend preview supports UTF-8 text/plain, text/markdown and text/csv. Unsupported formats return an actual error and remain downloadable. Source links are opened only after fresh exact-version membership/current-access checks. Citation links open the specific cited version and do not silently replace an inaccessible version with the latest.

## Object-scoped ACL candidates (WEB-KB-01)

The sharing picker uses `GET /knowledge/materials/{material_id}/acl-candidates?subject_kind=user|team&q=&limit=20&offset=0`. This frozen Backend contract replaces the incompatible generic directory call. The server verifies current material read+manage, then returns `{material_id,subject_kind,items:[{subject_id,display_name}],total,limit,offset}` with stable name/UUID pagination. Query is limited to 100 characters, page size 1–100 and offset 0–100000. The adapter rejects another object's/type's response or incomplete pagination; 403/404 remain errors.

Candidates are server-authorized active users of every role or valid active teams, including empty teams. The UI does not apply a business-role whitelist or infer scope from CRM. Search and paging retain selected subjects. Changing subject kind clears the previous kind's selection and starts at page one. Requests depend on material ID, kind, query, offset and runtime identity, so late responses cannot populate a newer query or object.

Existing grants and `denied_user_ids` survive missing/inactive candidates and pagination. Historical deny entries can be explicitly removed; adding inactive deny entries is outside this defect. Company grants keep `subject_id:null` and do not query the directory. Saving retains the original ACL revision and same-body idempotency key; the backend rechecks current permissions. Read permissions granted by the ACL remain intersected with the recipient's current feature/object scope.

## Provider and works boundary

The current slice adds a real provider capability/status route and a backend adapter for the confirmed dataset list and retrieval-test endpoints. `KNOWLEDGE_PROVIDER_BASE_URL`, `KNOWLEDGE_PROVIDER_DATASET_IDS` and optional auth settings are server-only configuration; an empty configuration remains `unconfigured`, and provider failures remain `unavailable` rather than becoming zero. The adapter validates the exact material/version allowlist before accepting chunks. Material-to-provider document binding, citation response, generation, archived-work download and team publication are still separate contracts and remain unavailable until their write/readback paths are implemented. Saved materials stay saved with `active_version_id=null` until the backend verifies indexing. DOCX and PPTX require independent verified configuration.

An injectable service may supply `status`, `ask`, `listWorks`, `generate`, `getWork` and `publishWork` for later integration. These are UI ports, not a declaration that corresponding production APIs exist. `ask` requires selected materials and displays only an answer with exact material/version/location citations or a no-evidence result. The backend must freeze and authorize the actual source versions. `succeeded` without archived files displays archive-pending and cannot download. Drafts, dialogs, selections and answers remount on runtime identity/permission changes; cached answers are never submitted as later evidence.

## Verification

From `frontend/web`:

```sh
node --test tests/knowledge-122-acl.test.mjs tests/knowledge-122-model.test.mjs tests/knowledge-customer-scope.test.mjs tests/browser-file-transport.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node --test tests/knowledge-122.browser.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node --test tests/knowledge-advice.browser.mjs
SALES_WEB_DIST_DIR=.runtime/knowledge-122-build npm run build
```

Browser fixtures fulfill only an isolated localhost URL and abort all other requests. All material/CRM/ACL data is synthetic. Optional `KNOWLEDGE_EVIDENCE_DIR` writes screenshots outside the source tree. These tests and build do not prove live HTTP/PG, deployed permissions or supplier behavior; paired runtime verification belongs to the combined candidate.
