# Security Considerations

## Design principles

- Least privilege by role
- Explicitly authorised asset discovery and scanning
- Structured audit logging for sensitive actions
- Demo-safe telemetry with clear lab labelling
- No destructive or offensive functionality

## Auth controls

- Password hashing is implemented in the production-ready design path using a strong password hashing library.
- JWT access tokens and refresh tokens are supported in the application design.
- Audit logging records auth events and configuration actions.

## AI safety

The AI layer only uses internal structured records and is instructed to distinguish facts from recommendations, cite evidence, and state uncertainty when data is insufficient.
