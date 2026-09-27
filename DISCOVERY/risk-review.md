# Discovery risk review

Status: pass for discovery-only implementation; production integrations remain out of scope

| Risk | Current boundary | Required mitigation |
|---|---|---|
| Payment / tax / e-invoice | Prototype must not imply these are integrated | Keep explicit mock labels and scope them out of this milestone |
| Personal data | Customer, staff, and order data may become personal data | Keep local-first claims precise; define retention/export/delete behavior before cloud features |
| Offline data loss | Browser storage can be cleared or corrupted | Validate JSON snapshot/export and recovery UX before claiming reliability |
| Community research privacy | Public posts may contain personal information | Store URLs and aggregate findings; do not copy unnecessary personal data |
| International rollout | Locale, currency, tax, and legal requirements differ | Treat locale UI as prototype evidence, not production compliance |

No production payment, auth, tax, migration, or cloud-sync change is approved by this document.

## Review result

The current milestone contains only local-first prototype hardening and implementation scope. No database migration, authentication, authorization, payment, billing, secret, infrastructure deletion, or cloud-sync change is authorized. Risk status is `pass` for this bounded scope. Any later change crossing those boundaries must reopen human review.
