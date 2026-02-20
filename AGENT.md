# AGENT.md — Journy.io CLI for AI Agents

This document explains how to use the Journy.io CLI as an AI agent.

## Overview

The `journy` CLI provides programmatic access to Journy.io's customer analytics API. Use it for tracking users, accounts, and events in B2B SaaS applications.

## Prerequisites

```bash
journy config set --api-key <key>
```

Get your API key at: https://system.journy.io

## All Commands

### Config

```bash
journy config set --api-key <key>
journy config show
```

### Users

```bash
# Create or update user
journy user upsert user-123 --email user@example.com --properties '{"name":"John Doe","plan":"Pro"}'
journy user upsert user-123 --json

# Delete user
journy user delete user-123
journy user delete user-123 --email user@example.com --json
```

### Accounts

```bash
# Create or update account
journy account upsert acme-corp --domain acme.com --properties '{"name":"ACME","mrr":499}'
journy account upsert acme-corp --json

# Delete account
journy account delete acme-corp
journy account delete acme-corp --domain acme.com --json

# Add users to account (max 100)
journy account add-users acme-corp user-1 user-2 user-3
journy account add-users acme-corp user-1 user-2 --json

# Remove users from account (max 100)
journy account remove-users acme-corp user-1 user-2
journy account remove-users acme-corp user-1 --json
```

### Events

```bash
# Track user event
journy event track "signed_in" --user-id user-123
journy event track "completed_profile" --user-id user-123 --metadata '{"steps":5}' --json

# Track account event
journy event track "created_invoice" --account-id acme-corp --metadata '{"amount":100}'

# Track event for both user and account
journy event track "upgraded_plan" --user-id user-123 --account-id acme-corp --metadata '{"plan":"Enterprise"}'

# List all available events
journy event list
journy event list --json
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
# Link user to account
journy link user-123 acme-corp
journy link user-123 acme-corp --json
```

### Validate

```bash
# Validate API key
journy validate
journy validate --json
```

### Snippet

```bash
# Get tracking snippet
journy snippet
journy snippet --json
```

## Tips for Agents

1. Always use `--json` when parsing results programmatically
2. Properties and metadata must be valid JSON strings
3. Use `journy validate` to check API key before making multiple calls
4. Event names should use past tense (e.g., "signed_in", "created_invoice")
5. User IDs should be static database IDs, not emails
6. Account IDs should be static database IDs
7. Maximum 100 users per add/remove operation
8. Rate limit: 1800 requests per minute

## Common Workflows

### Track new user registration

```bash
journy user upsert user-123 --email newuser@example.com --properties '{"registered_at":"2024-01-20T10:00:00Z","plan":"trial"}'
journy event track "registered" --user-id user-123
```

### Create B2B account with users

```bash
journy account upsert acme-corp --domain acme.com --properties '{"name":"ACME Corp","plan":"Enterprise"}'
journy account add-users acme-corp user-1 user-2 user-3
journy event track "account_created" --account-id acme-corp
```

### Track feature usage

```bash
journy event track "feature_used" --user-id user-123 --account-id acme-corp --metadata '{"feature":"advanced_reports","duration":120}'
```

## JSON Output Parsing

All commands support `--json` for structured output:

```bash
# Get request ID
journy user upsert user-123 --json | jq '.meta.requestId'

# List all event names
journy event list --json | jq '.data[].name'

# Check validation status
journy validate --json | jq '.meta.status'
```

## Error Handling

- HTTP 400: Bad request (check field/parameter validation)
- HTTP 401: Unauthorized (invalid API key)
- HTTP 403: API key disabled
- HTTP 429: Rate limit exceeded (1800 req/min)
- HTTP 500: Server error

All errors include detailed field validation messages.
