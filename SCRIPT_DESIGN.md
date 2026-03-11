# Script Design

## Goal
Define the minimum scripts needed to migrate safely without touching live legacy data.

## Planned Scripts
### `scripts/backup-legacy-data.js`
Purpose:
- Read Firebase `appData`
- Save a full JSON backup locally
- Write backup metadata to Firebase if desired

Inputs:
- Firebase config
- Output file path

Outputs:
- Local JSON backup file
- Optional `legacySnapshots/{snapshotId}` metadata

Behavior:
- Fail fast if `appData` is empty or Firebase is unreachable
- Never modify `appData`

### `scripts/migrate-legacy-to-academy.js`
Purpose:
- Copy legacy data from `appData` into `academies/{academyId}`
- Create academy metadata and code index
- Create initial academy admin record

Inputs:
- `academyId`
- `academyCode`
- `academyName`
- Optional dry-run flag

Outputs:
- `academies/{academyId}`
- `academiesByCode/{academyCode}`
- `migrationLogs/{migrationId}`

Behavior:
- Default to dry-run unless explicitly told to write
- Preserve original record IDs and values
- Add migration metadata only in the new path
- Never delete legacy records

### `scripts/verify-migration.js`
Purpose:
- Compare legacy and academy-scoped data
- Print a concise report
- Mark migration log as success or failed

Inputs:
- `academyId`
- Optional list of months to verify

Outputs:
- Terminal report
- Optional `migrationLogs/{migrationId}` verification update

Behavior:
- Compare collection counts
- Compare payroll totals for recent months
- Exit non-zero if critical mismatches exist

## Suggested Runtime
- Node.js script using Firebase Admin SDK

Reason:
- Safer than browser-only execution
- Easier to add dry-run and verification
- Better for local backups and reporting

## Shared Utility Module
Recommended helper file:
- `scripts/lib/firebase-admin.js`
- `scripts/lib/migration-utils.js`

Suggested responsibilities:
- Firebase initialization
- Timestamp helpers
- Count comparison helpers
- Payroll summary helpers
- Migration log writer

## Required Safety Flags
### Dry run default
- Migration script should print what it will copy.
- Real writes should require an explicit flag like `--write`.

### Explicit academy target
- Require `academyId` and `academyCode`.
- Refuse to run if target path already exists unless `--force` is given.

### Explicit backup path
- Backup script should require an output filename or auto-generate one with timestamp.

## Minimal CLI Examples
```bash
node scripts/backup-legacy-data.js --out backups/appData-20260310.json
node scripts/migrate-legacy-to-academy.js --academyId acad_ganghan --academyCode ganghan --academyName "강한영어수학학원"
node scripts/migrate-legacy-to-academy.js --academyId acad_ganghan --academyCode ganghan --academyName "강한영어수학학원" --write
node scripts/verify-migration.js --academyId acad_ganghan --months 2026-01,2026-02,2026-03
```

## Verification Report Format
The verify script should at minimum report:
- Collection counts
- Mismatch list
- Payroll total comparison by month
- Deduction total comparison by month
- Business-level headcount comparison
- Pass or fail summary

Example output shape:
```text
Migration verify: acad_ganghan
- businesses: OK (2)
- staff: OK (13)
- workLogs: OK (1520)
- payroll 2026-01: OK
- payroll 2026-02: OK
- payroll 2026-03: MISMATCH
Result: FAILED
```

## Password Migration Policy
- Do not keep long-term authentication inside staff domain records.
- Create academy user records separately.
- For the first migration, set `mustChangePassword: true`.
- If existing passwords are weak or inconsistent, reset them instead of blindly trusting them.

## Recommended Next Implementation Step
1. Create the `scripts/` directory.
2. Add backup script first.
3. Add dry-run migration script second.
4. Add verify script third.
5. Only then start wiring academy login into the app.
