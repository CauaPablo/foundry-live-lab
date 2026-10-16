# Plan: 064-follow-newest-version

- `AgentDetail.tsx` `Versions`: when `agent.pinned && canPromote` and no version carries
  `promote_reason === 'not_owned'`, render a button under the pinned notice that sets the
  confirmation to `@latest`; the existing `Confirm` asks with its own title for that case; confirm
  calls `onPromote('@latest')`. `state/promote.ts` already URL-encodes the version.
- Strings: `versions.followLatest`, `versions.confirm.titleLatest` (en + pt).
- Tests in `AgentDetail.test.tsx`: AC1–AC4.
