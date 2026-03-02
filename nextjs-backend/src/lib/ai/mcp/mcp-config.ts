export interface MCPServerConfig {
  name: string
  url: string
  headers?: Record<string, string>
}

export const MCP_SERVERS: MCPServerConfig[] = [
  {
    name: 'windows-mcp',
    url: 'http://localhost:8001/mcp',
  },
]
