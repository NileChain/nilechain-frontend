# Brono MCP — yes, you can

**Requirement:** Brono **Pro** or **Ultra** only ([docs](https://brono.ai/blog/extend-your-design-workflow-introducing-brono-mcp)). Free/Plus = no MCP.

## Connect (2 minutes)

1. Brono dashboard → copy **Remote MCP Server URL**.
2. Open `%USERPROFILE%\.cursor\mcp.json` and **merge** (keep NileChain if present):

```json
{
  "mcpServers": {
    "NileChain": {
      "url": "https://mcp.scalar.com/mcp/9638a405-bcb7-4ad8-a0c7-af869c055570",
      "headers": {}
    },
    "brono": {
      "url": "PASTE_YOUR_BRONO_REMOTE_SERVER_URL_HERE"
    }
  }
}
```

3. Cursor → Reload Window. MCP settings → `brono` should be green.
4. In Brono: screen → More → **Copy Screen ID**.
5. In chat: `Get design image/code/audit for Brono screen <ID> and adapt to our Angular NileChain app.`

Template without secrets: [mcp.brono.example.json](../../.cursor/mcp.brono.example.json)

**Note:** MCP returns HTML/Tailwind — we port to Angular; we do not paste raw HTML.
