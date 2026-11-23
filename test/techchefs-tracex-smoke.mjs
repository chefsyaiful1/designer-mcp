import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const output = "test-results";
mkdirSync(output, { recursive: true });

const transport = new StdioClientTransport({
  command: process.execPath,
  args: ["dist/index.js"],
  env: { ...process.env, HELA_PHENOTYPE_STITCH: "0" },
});
const client = new Client(
  { name: "techchefs-tracex-evaluation", version: "1.0.0" },
  { capabilities: {} },
);

async function call(name, args) {
  const response = await client.callTool({ name, arguments: args });
  assert.notEqual(response.isError, true, name + " returned an MCP error");
  const text = response.content.filter((part) => part.type === "text")
    .map((part) => part.text).join("\n");
  assert.ok(text, name + " returned no text");
  return text;
}

try {
  await client.connect(transport);
  const advertised = (await client.listTools()).tools.map((tool) => tool.name);
  for (const name of [
    "evaluate_style", "generate_template", "get_component", "design_audit"
  ]) assert.ok(advertised.includes(name), name + " not advertised");

  const brief = "TraceX enterprise CMMS Laravel maintenance admin dashboard: "
    + "work orders, technician assignments, requester sites, SLA overview, "
    + "recent service activity, responsive desktop and mobile layout";
  const recommended = JSON.parse(await call("evaluate_style", { description: brief }));
  const style = recommended.recommended;
  const palette = recommended.recommended_palette;
  const archetype = recommended.recommended_archetype;
  assert.ok(style && palette && archetype, "Style recommendation incomplete");

  const original = await call("generate_template", { style, palette, archetype });
  assert.match(original, /<!DOCTYPE html>/i);
  assert.match(original, /<main\b/i);
  assert.match(original, /sm:grid-cols-2|lg:grid-cols-4/, "Missing responsive grid");

  const sidebar = await call("get_component", { component: "sidebar", style, framework: "html" });
  const card = await call("get_component", { component: "card", style, framework: "html" });
  assert.ok(sidebar.length > 100 && card.length > 100, "Components too short");

  let html = original;
  for (const [before, after] of [
    ["<title>Dashboard</title>", "<title>TraceX | Maintenance Operations Demo</title>"],
    [">Dashboard</div>", ">TraceX CMMS</div>"],
    [">Overview</h1>", ">Maintenance Overview</h1>"],
    ["Welcome back. Here's what's happening.", "Illustrative demo data only — not connected to TraceX."],
    [">Revenue</p>", ">Open Work Orders</p>"],
    [">$48,352</p>", ">128</p>"],
    [">Users</p>", ">Active Technicians</p>"],
    [">2,420</p>", ">24</p>"],
    [">Orders</p>", ">Jobs This Week</p>"],
    [">1,210</p>", ">86</p>"],
    [">Conversion</p>", ">SLA On Time</p>"],
    [">3.24%</p>", ">93.2%</p>"],
    [">Analytics Overview</h2>", ">Work Order Trends</h2>"],
    [">Quick Actions</h2>", ">Maintenance Actions</h2>"],
    [">New Order</button>", ">Create Work Order</button>"],
    [">View Reports</button>", ">Review Work Orders</button>"],
    [">Manage Users</button>", ">Assign Technicians</button>"],
    [">Recent Activity</h2>", ">Recent Job Updates</h2>"],
    [">Customers</a>", ">Sites</a>"],
    [">Products</a>", ">Requesters</a>"],
    [">Analytics</a>", ">Work Orders</a>"],
    ["name: 'Revenue'", "name: 'Open work orders'"],
    ["name: 'Users'", "name: 'Completed jobs'"],
    ["New order #1234", "New work order (sample)"],
    ["Payment received", "Technician assigned (sample)"],
    ["New user registered", "Requester registered (sample)"],
  ]) html = html.replace(before, after);

  assert.match(html, /Open Work Orders/);
  assert.match(html, /Illustrative demo data only/);
  const accessibility = JSON.parse(await call("design_audit", { action: "accessibility", html }));
  const antiSlop = JSON.parse(await call("design_audit", { action: "slop", content: html, genre: "modern-minimal" }));
  assert.ok(Number.isFinite(accessibility.score));
  assert.ok(Number.isFinite(antiSlop.total));
  const mobileNavigationGap = html.includes("hidden lg:block")
    && !html.includes('aria-label="Open navigation"');
  const report = {
    testedVia: "MCP stdio session on GitHub Actions runner",
    project: "TraceX CMMS (illustrative only, no project access)",
    version: "Designer MCP 3.2.3",
    toolsCalled: ["tools/list", "evaluate_style", "generate_template", "get_component:sidebar", "get_component:card", "design_audit:accessibility", "design_audit:slop"],
    selected: { style, palette, archetype },
    recommendation: { rankedStyles: recommended.ranked_styles?.slice(0, 3).map((item) => ({style: item.style,score: item.score})) },
    generatedHtmlBytes: Buffer.byteLength(html),
    accessibility: { score: accessibility.score, grade: accessibility.grade, issues: accessibility.issue_count, topIssues: accessibility.issues?.slice(0, 10) },
    antiSlop: { total: antiSlop.total, passed: antiSlop.passed, failed: antiSlop.failed, failedGates: antiSlop.gates?.filter((gate) => !gate.pass).map((gate) => ({ id: gate.id, name: gate.name })) },
    findings: {
      mobileNavigationGap,
      genericDashboardRequiresDomainCustomization: true,
      externalTailwindCDN: html.includes("cdn.tailwindcss.com"),
      externalChartCDN: html.includes("cdn.jsdelivr.net/npm/apexcharts"),
      sampleDataOnly: true,
      runtimeLaravelIntegrationVerified: false
    }
  };
  writeFileSync(output + "/tracex-dashboard.html", html);
  writeFileSync(output + "/report.json", JSON.stringify(report, null, 2) + "\n");
  console.log("DESIGNER_MCP_TRACEX_SMOKE_SUCCESS");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await client.close();
}
