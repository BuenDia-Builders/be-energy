## Summary

Investigate the email verification authentication flow to determine whether the existing email OTP endpoints are part of the application's active authentication process.

**Verdict: DEAD — the email OTP endpoints have no active application entry point in the current repository.**

## Findings

* **Email sending:** `POST /api/auth/email/send` initiates Supabase OTP email delivery, but no current application code calls this endpoint.
* **OTP verification:** `POST /api/auth/email/verify` accepts an email and OTP token, but no current application code calls this endpoint.
* **Current authentication:** The login page uses Supabase password authentication through `signInWithPassword`.
* **Historical implementation:** Git history shows that commit `68b19da` replaced the previous login UI with password-based login while leaving the email OTP endpoints in place.
* **Callback route:** `/auth/callback` supports Supabase PKCE code exchange and token-hash verification. However, the repository does not establish that an active email-verification initiator or the required deployed Supabase configuration exists.
* **Session handling:** The callback and OTP verification endpoint contain logic for establishing the application's authenticated session, but the dormant OTP endpoints are not connected to the current login flow.

## Testing and Limitations

* No manual end-to-end test was performed because an appropriate Supabase test environment and authorized test account were unavailable.
* `npm run test:api` could not run because Vitest was unavailable in the workspace dependencies.
* Findings are based on repository inspection and Git history; deployed Supabase email templates and redirect allowlisting were not verified.

## Recommended Follow-up

A separate issue should establish the intended authentication behavior:

1. Restore and test an email OTP interface that calls the existing send and verify endpoints; or
2. Remove or archive the dormant endpoints and document password-only authentication.

If email magic links are intended, the follow-up should also establish an active initiation path and verify the Supabase email templates and redirect allowlisting for `/auth/callback`.

## Scope

* No authentication bugs were fixed.
* No Supabase configuration was changed.
* The wallet authentication path was not modified.
* No files were changed during this investigation.
