import { createServer } from 'node:http';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createDesignerServer } from './dist/index.js';

const port = Number(process.env.PORT || 7620);
const httpServer = createServer(async (req, res) => {
  const path = new URL(req.url || '/', 'http://127.0.0.1').pathname;
  const send = (status, body) => {
    res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  if (path === '/health' && req.method === 'GET') return send(200, { status: 'ok', service: 'designer-mcp' });
  if (path !== '/mcp') return send(404, { error: 'Not found' });
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) return send(405, { error: 'Method not allowed' });
  let mcp;
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 4194304) return send(413, { error: 'Payload too large' });
      chunks.push(chunk);
    }
    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') headers.set(key, value);
    }
    const request = new Request('http://127.0.0.1:' + port + (req.url || '/'), {
      method: req.method, headers,
      ...(req.method === 'POST' ? { body: Buffer.concat(chunks) } : {}),
    });
    mcp = createDesignerServer();
    const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
    await mcp.connect(transport);
    const response = await transport.handleRequest(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    console.error('MCP request failed', error);
    if (!res.headersSent) send(500, { error: 'MCP request failed' });
  } finally {
    if (mcp) await mcp.close();
  }
});
httpServer.requestTimeout = 120000;
httpServer.listen(port, '127.0.0.1', () => console.log('Designer MCP: http://127.0.0.1:' + port + '/mcp'));