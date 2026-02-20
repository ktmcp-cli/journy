![Banner](https://raw.githubusercontent.com/ktmcp-cli/journy/main/banner.svg)

> "Six months ago, everyone was talking about MCPs. And I was like, screw MCPs. Every MCP would be better as a CLI."
>
> — [Peter Steinberger](https://twitter.com/steipete), Founder of OpenClaw
> [Watch on YouTube (~2:39:00)](https://www.youtube.com/@lexfridman) | [Lex Fridman Podcast #491](https://lexfridman.com/peter-steinberger/)

# Journy.io CLI

> **⚠️ Unofficial CLI** - Not officially sponsored or affiliated with Journy.io.

A production-ready command-line interface for [Journy.io](https://www.journy.io/) — Track users, accounts, and events from your terminal. Ideal for B2B SaaS analytics, customer journey tracking, and user behavior monitoring.

## Features

- **User Management** — Create, update, and delete users
- **Account Management** — Manage B2B accounts and teams
- **Event Tracking** — Track custom events with metadata
- **Link Users to Accounts** — Associate users with their organizations
- **Properties** — View user and account properties
- **Segments** — List user and account segments
- **Tracking Snippet** — Get JavaScript tracking snippet
- **API Key Validation** — Verify your API credentials
- **JSON output** — All commands support `--json` for scripting
- **Colorized output** — Clean terminal output with chalk
- **Rate Limit Tracking** — 1800 requests/minute monitoring

## Installation

```bash
npm install -g @ktmcp-cli/journy
```

## Quick Start

```bash
# Get your API key at https://system.journy.io
journy config set --api-key YOUR_API_KEY

# Validate your API key
journy validate

# Create a user
journy user upsert user-123 --email john@example.com --properties '{"name":"John Doe","plan":"Pro"}'

# Create an account
journy account upsert acme-corp --domain acme.com --properties '{"name":"ACME Corp","mrr":499}'

# Link user to account
journy link user-123 acme-corp

# Track an event
journy event track "signed_in" --user-id user-123 --account-id acme-corp
```

## Commands

### Config

```bash
journy config set --api-key <key>
journy config show
```

### Users

```bash
# Create or update a user
journy user upsert <userId> --email <email> --properties '{"name":"John"}'

# Delete a user
journy user delete <userId>
```

Properties JSON example:
```json
{
  "full_name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "registered_at": "2024-01-15T10:00:00Z",
  "is_admin": true,
  "plan": "Pro"
}
```

### Accounts

```bash
# Create or update an account
journy account upsert <accountId> --domain acme.com --properties '{"name":"ACME"}'

# Delete an account
journy account delete <accountId>

# Add users to an account (up to 100)
journy account add-users <accountId> user1 user2 user3

# Remove users from an account (up to 100)
journy account remove-users <accountId> user1 user2
```

Account properties JSON example:
```json
{
  "name": "ACME Corporation",
  "mrr": 499,
  "plan": "Enterprise",
  "registered_at": "2024-01-01T00:00:00Z",
  "is_paying": true,
  "employee_count": 50
}
```

### Events

```bash
# Track an event (user event)
journy event track "signed_in" --user-id user-123

# Track an event (account event)
journy event track "created_invoice" --account-id acme-corp --metadata '{"amount":100}'

# Track an event (both user and account)
journy event track "upgraded_plan" --user-id user-123 --account-id acme-corp --metadata '{"plan":"Pro"}'

# List all available events
journy event list
journy event list --json
```

Event metadata example:
```json
{
  "amount": 100,
  "currency": "USD",
  "invoice_id": "INV-123",
  "allow_wire_transfer": true
}
```

### Properties

```bash
# List user properties
journy properties users
journy properties users --json

# List account properties
journy properties accounts
journy properties accounts --json
```

### Segments

```bash
# List user segments
journy segments users
journy segments users --json

# List account segments
journy segments accounts
journy segments accounts --json
```

### Link

```bash
# Link a user to an account
journy link <userId> <accountId>
journy link user-123 acme-corp --json
```

### Validate

```bash
# Validate your API key
journy validate
journy validate --json
```

### Snippet

```bash
# Get JavaScript tracking snippet for your website
journy snippet
journy snippet --json
```

## JSON Output

All commands support `--json` for structured output:

```bash
journy user upsert user-123 --email john@example.com --json | jq '.meta.requestId'
journy event list --json | jq '.data[] | select(.name | contains("invoice"))'
journy properties users --json | jq '.data[] | .name'
```

## Use Cases

### B2B SaaS Analytics
Track users and accounts to understand product adoption and engagement across your customer base.

```bash
journy account upsert acme-corp --properties '{"name":"ACME","mrr":999,"plan":"Enterprise"}'
journy account add-users acme-corp user-1 user-2 user-3
journy event track "feature_enabled" --account-id acme-corp --metadata '{"feature":"advanced_analytics"}'
```

### User Onboarding Tracking
Monitor user registration and onboarding progress.

```bash
journy user upsert user-123 --email new-user@example.com --properties '{"registered_at":"2024-01-20T10:00:00Z"}'
journy event track "completed_onboarding" --user-id user-123 --metadata '{"steps_completed":5}'
```

### Customer Journey Mapping
Track events across the customer lifecycle.

```bash
journy event track "trial_started" --user-id user-123 --account-id acme-corp
journy event track "feature_used" --user-id user-123 --metadata '{"feature":"reports"}'
journy event track "upgraded_plan" --account-id acme-corp --metadata '{"from":"Pro","to":"Enterprise"}'
```

## API Reference

The CLI wraps these Journy.io API endpoints:

- `POST /users/upsert` - Create or update users
- `DELETE /users` - Delete users
- `POST /accounts/upsert` - Create or update accounts
- `DELETE /accounts` - Delete accounts
- `POST /accounts/users/add` - Add users to accounts
- `POST /accounts/users/remove` - Remove users from accounts
- `POST /track` - Track events
- `GET /events` - List available events
- `GET /properties/users` - List user properties
- `GET /properties/accounts` - List account properties
- `GET /segments/users` - List user segments
- `GET /segments/accounts` - List account segments
- `POST /link` - Link users to accounts
- `GET /validate` - Validate API key
- `GET /tracking/snippet` - Get tracking snippet

## Rate Limits

- **1800 requests per minute** - The API uses a sliding window rate limit
- Rate limit headers are included in all responses: `X-RateLimit-Limit` and `X-RateLimit-Remaining`

## Why CLI > MCP?

No server to run. No protocol overhead. Just install and go.

- **Simpler** — Just a binary you call directly
- **Composable** — Pipe to `jq`, `grep`, `awk`
- **Scriptable** — Works in cron jobs, CI/CD, shell scripts
- **No Dependencies** — No MCP server, no background processes

## License

MIT — Part of the [Kill The MCP](https://killthemcp.com) project.
