"use client";

import { useMemo, useState } from "react";

import { api } from "@/platform/lib/api";
import { day, downloadCsv, rwf, rwfLabel } from "@/platform/v2/format";
import { RoleGate } from "@/platform/v2/Shell";
import { Button, Card, Empty, ErrorNote, Loading, Page, Stat, StatGrid, Table, Td, inputClass } from "@/platform/v2/ui";
import { listOf, useLoad } from "@/platform/v2/useLoad";

type Customer = {
  id: string; first_name: string; last_name: string; email: string;
  total_tickets: number; total_spent: string | number | null; last_active: string | null;
};

const nameOf = (c: Customer) => `${c.first_name || ""} ${c.last_name || ""}`.trim() || c.email;

function Customers() {
  const { data, error, loading } = useLoad(() => api.get("/tickets/checkout/customers/").then((r) => listOf<Customer>(r.data)));
  const [search, setSearch] = useState("");
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((c) => !q || [nameOf(c), c.email].some((v) => (v || "").toLowerCase().includes(q)));
  }, [data, search]);
  const all = data ?? [];

  if (loading) return <Loading />;
  const spent = all.reduce((s, c) => s + Number(c.total_spent || 0), 0);
  const tickets = all.reduce((s, c) => s + (c.total_tickets || 0), 0);

  return (
    <Page
      title="Customers"
      subtitle="People who bought tickets online."
      actions={
        <>
          <input type="search" aria-label="Search customers" placeholder="Name or email" className={`${inputClass} min-w-[240px]`} value={search} onChange={(e) => setSearch(e.target.value)} />
          <Button
            onClick={() =>
              downloadCsv("customers.csv", ["Name", "Email", "Tickets", "Spent (RWF)", "Last bought"],
                visible.map((c) => [nameOf(c), c.email, c.total_tickets, Math.round(Number(c.total_spent || 0)), day(c.last_active)]))
            }
          >
            Download CSV
          </Button>
        </>
      }
    >
      {error && <ErrorNote>{error}</ErrorNote>}
      <StatGrid>
        <Stat dark label="Spent with you" value={rwf(spent)} unit="RWF" />
        <Stat label="Customers" value={all.length} />
        <Stat label="Tickets bought" value={tickets} />
        <Stat label="Average per customer" value={rwf(all.length ? spent / all.length : 0)} unit="RWF" />
      </StatGrid>
      <Card padded={false} title="All customers">
        <Table head={["Customer", "Tickets", "Spent", "Last bought"]} minWidth={640} empty={visible.length === 0 && <Empty>No customers yet.</Empty>}>
          {visible.map((c) => (
            <tr key={c.id ?? c.email}>
              <Td first><b>{nameOf(c)}</b><br /><span className="text-xs text-[#5B6472]">{c.email}</span></Td>
              <Td className="tabular-nums">{c.total_tickets}</Td>
              <Td className="font-semibold tabular-nums">{rwfLabel(c.total_spent)}</Td>
              <Td last className="text-[#5B6472]">{day(c.last_active)}</Td>
            </tr>
          ))}
        </Table>
      </Card>
    </Page>
  );
}

export default function CustomersPage() {
  return <RoleGate roles={["COMPANY"]}><Customers /></RoleGate>;
}
