# Brono MCP setup (Pro / Ultra only)

MCP is **not** on Free/Plus. Source: [Brono MCP blog](https://brono.ai/blog/extend-your-design-workflow-introducing-brono-mcp).

## Steps

1. Upgrade to **Pro** or **Ultra** on [brono.ai](https://brono.ai/).
2. Open Brono dashboard → copy your **remote MCP server URL**.
3. Add the server in Cursor (project or user config).

### Project file (recommended for the team)

Copy [mcp.brono.example.json](../../.cursor/mcp.brono.example.json) entries into:

- `nilechain-frontend-main/.cursor/mcp.json`, or
- `%USERPROFILE%\.cursor\mcp.json` (merge with existing servers)

Example:

```json
{
  "mcpServers": {
    "brono": {
      "url": "PASTE_YOUR_BRONO_REMOTE_SERVER_URL"
    }
  }
}
```

4. Reload Cursor window. Confirm **brono** shows green under MCP settings.
5. From Brono Canvas, copy Screen IDs into [SCREEN_IDS.md](./SCREEN_IDS.md).
6. In Agent chat:

```text
Using Brono MCP: get_design_image and get_audit_report for screen <ID>.
Then adapt visuals into our Angular feature — keep NileChain tokens.
```

## Tools expected

- `get_design_code` — HTML + Tailwind (adapt to Angular)
- `get_audit_report`
- `get_design_image`
- `get_group_designs`
- `get_project_designs`

Never commit the real remote URL if it embeds a personal secret; keep secrets in user-level `mcp.json`.
