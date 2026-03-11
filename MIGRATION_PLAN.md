# Migration Plan

## Goal
- Keep all existing Firebase `appData` records intact.
- Add a new multi-academy structure alongside the legacy structure.
- Migrate by copying, not moving.
- Verify before any production cutover.

## Non-Negotiable Rules
- Do not overwrite or delete `appData` during migration.
- Do not switch the production UI to the new structure before verification passes.
- Do not rely on a single backup method.
- Do not remove legacy data immediately after cutover.

## Current State
- The app reads and writes a single Firebase path: `appData`.
- Admin auth is hardcoded in frontend code.
- Staff auth is mixed into staff records.
- `businessId` exists, but it models branches inside one academy, not separate academies.

## Target State
- One URL for all academies.
- Login format: `academyCode + loginId + password`.
- Each academy manages its own staff accounts and payroll settings.
- Data is isolated per academy.

## Firebase Target Structure
```text
appData

academies/{academyId}
  profile
  settings
  businesses
  staff
  commissionInstructors
  insuranceTeachers
  specialLectures
  workLogs
  workLogHistories
  commissionStudents
  insuranceAbsences
  specialLectureStudents
  users

academiesByCode/{academyCode}
migrationLogs/{migrationId}
legacySnapshots/{snapshotId}
```

## First Academy Bootstrap
- `academyId`: `acad_ganghan`
- `academyCode`: `ganghan`
- `name`: current academy name

This first academy receives a copy of the current `appData` contents.

## Migration Strategy
### Phase 1. Backup
- Export full `appData` from Firebase.
- Save a local JSON backup.
- Record backup metadata in `legacySnapshots/{snapshotId}`.

### Phase 2. Provision New Paths
- Create `academies/{academyId}`.
- Create `academiesByCode/{academyCode}`.
- Create a migration log entry with `status: started`.

### Phase 3. Copy Legacy Data
- Read from `appData`.
- Copy each collection into `academies/{academyId}`.
- Preserve original IDs and values.
- Add migration metadata where useful:
  - `migratedAt`
  - `source: legacy-appData`

### Phase 4. Create User Records
- Add a dedicated `users` collection under the academy.
- Create at least one academy admin account.
- Create staff user records linked by `staffId`.
- Mark migrated users with `mustChangePassword: true`.

### Phase 5. Verification
- Compare counts between legacy and new paths.
- Compare recent payroll totals between legacy and new paths.
- Compare branch-level distributions.
- Log results to `migrationLogs/{migrationId}`.

### Phase 6. Test Mode
- Keep the production app on legacy `appData`.
- Use a test build or test mode to read from `academies/{academyId}` only.
- Validate real screens with copied data.

### Phase 7. Cutover
- Switch the app to the new academy-scoped data source.
- Keep legacy `appData` untouched for rollback safety.

### Phase 8. Stabilization
- Monitor for issues.
- Keep legacy data until the new path is stable in production.

## Collection Mapping
| Legacy path | New path |
| --- | --- |
| `appData.businesses` | `academies/{academyId}/businesses` |
| `appData.staff` | `academies/{academyId}/staff` |
| `appData.workLogs` | `academies/{academyId}/workLogs` |
| `appData.workLogHistories` | `academies/{academyId}/workLogHistories` |
| `appData.commissionInstructors` | `academies/{academyId}/commissionInstructors` |
| `appData.commissionStudents` | `academies/{academyId}/commissionStudents` |
| `appData.insuranceTeachers` | `academies/{academyId}/insuranceTeachers` |
| `appData.insuranceAbsences` | `academies/{academyId}/insuranceAbsences` |
| `appData.specialLectures` | `academies/{academyId}/specialLectures` |
| `appData.specialLectureStudents` | `academies/{academyId}/specialLectureStudents` |
| `appData.settings` | `academies/{academyId}/settings/payrollRules` |

## Verification Checklist
- `businesses` count matches.
- `staff` count matches.
- `commissionInstructors` count matches.
- `insuranceTeachers` count matches.
- `specialLectures` count matches.
- `workLogs` count matches.
- `workLogHistories` count matches.
- `commissionStudents` count matches.
- `insuranceAbsences` count matches.
- `specialLectureStudents` count matches.
- Core settings values match.
- Payroll totals for the latest 3 months match.
- Deduction totals for the latest 3 months match.
- Staff counts by `businessId` match.

## Cutover Blockers
- Any collection count mismatch.
- Payroll mismatch in verification months.
- Missing academy admin account.
- User-to-staff link failures.
- Any case where a user can access another academy's data.

## Rollback Plan
- Stop using the new academy-scoped mode.
- Point the app back to legacy `appData`.
- Keep migrated academy data for debugging.
- Fix the issue and rerun migration or patch the target path.

Rollback must be a routing change, not a data recovery operation.

## Implementation Order
1. Add migration documentation.
2. Build backup script.
3. Build dry-run migration script.
4. Build actual copy migration script.
5. Build verification script.
6. Add academy-scoped login flow.
7. Add academy `users` management.
8. Test with copied legacy data.
9. Cut over after verification passes.

## Out of Scope for First Migration
- Self-service academy sign-up.
- SMS-based login.
- Deleting or cleaning legacy `appData`.
- Full pricing or subscription logic.
