import { useState, useMemo } from "react";
import { toast } from "sonner";
import { mockData } from "@/lib/mockData";
import { DEFAULT_VLANS, DEVICE_CATEGORIES } from "@/lib/constants";
import { generateId } from "@/lib/utils";
import type { IPAddress, VLAN } from "@/types";
import {
  Search,
  Plus,
  AlertTriangle,
  CheckCircle2,
  X,
  Globe,
  Layers,
  Edit2,
  Trash2,
  Wifi,
  ArrowLeft,
  Save,
} from "lucide-react";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border-primary)",
  background: "var(--bg-input)",
  color: "var(--text-primary)",
  fontSize: 13,
  fontFamily: "var(--font-body)",
  outline: "none",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "var(--text-secondary)",
  marginBottom: 6,
};
const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none" as const,
  cursor: "pointer",
};

type Mode = "list" | "add" | "edit";

export default function IPAMPage() {
  const [ips, setIps] = useState<IPAddress[]>(mockData.ipAddresses);
  const [vlans, setVlans] = useState<VLAN[]>(DEFAULT_VLANS);
  const [tab, setTab] = useState<"ips" | "vlans" | "range">("ips");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterVlan, setFilterVlan] = useState("");
  const [checkIP, setCheckIP] = useState("");
  const [checkResult, setCheckResult] = useState<string | null>(null);
  const [showVlanForm, setShowVlanForm] = useState(false);
  const [vlanForm, setVlanForm] = useState<Partial<VLAN>>({});

  // ── Full-page IP form state (like DevicesPage) ──
  const [mode, setMode] = useState<Mode>("list");
  const [activeIP, setActiveIP] = useState<IPAddress | null>(null);
  const emptyIPForm = {
    ipAddress: "",
    vlanId: "vlan-01",
    status: "Available" as IPAddress["status"],
    type: "IPv4" as IPAddress["type"],
    notes: "",
  };
  const [ipForm, setIPForm] = useState(emptyIPForm);

  const goList = () => {
    setMode("list");
    setActiveIP(null);
    setIPForm(emptyIPForm);
  };
  const goAdd = () => {
    setActiveIP(null);
    setIPForm(emptyIPForm);
    setMode("add");
  };
  const goEdit = (ip: IPAddress) => {
    setActiveIP(ip);
    setIPForm({
      ipAddress: ip.ipAddress,
      vlanId: ip.vlanId,
      status: ip.status,
      type: ip.type,
      notes: ip.notes,
    });
    setMode("edit");
  };

  const ipStats = useMemo(
    () => ({
      total: ips.length,
      assigned: ips.filter((i) => i.status === "Assigned").length,
      available: ips.filter((i) => i.status === "Available").length,
      reserved: ips.filter((i) => i.status === "Reserved").length,
      duplicates: ips.filter((i) => i.status === "Duplicate").length,
    }),
    [ips],
  );

  const duplicates = useMemo(() => {
    const seen = new Map<string, IPAddress[]>();
    ips.forEach((ip) => {
      const key = ip.ipAddress;
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key)!.push(ip);
    });
    return Array.from(seen.entries()).filter(([, arr]) => arr.length > 1);
  }, [ips]);

  const filtered = useMemo(() => {
    return ips.filter((ip) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        ip.ipAddress.includes(q) ||
        ip.device?.deviceName?.toLowerCase().includes(q);
      const matchStatus = !filterStatus || ip.status === filterStatus;
      const matchVlan = !filterVlan || ip.vlanId === filterVlan;
      return matchSearch && matchStatus && matchVlan;
    });
  }, [ips, search, filterStatus, filterVlan]);

  const saveIP = () => {
    if (mode === "edit" && activeIP) {
      setIps((prev) =>
        prev.map((ip) =>
          ip.id === activeIP.id
            ? { ...ip, ipAddress: ipForm.ipAddress, vlanId: ipForm.vlanId, status: ipForm.status, type: ipForm.type, notes: ipForm.notes }
            : ip,
        ),
      );
      toast.success("IP address updated successfully");
    } else {
      const existing = ips.find((i) => i.ipAddress === ipForm.ipAddress);
      const newIP: IPAddress = {
        id: generateId(),
        ipAddress: ipForm.ipAddress,
        deviceId: null,
        vlanId: ipForm.vlanId,
        status: existing ? "Duplicate" : ipForm.status,
        type: ipForm.type,
        notes: ipForm.notes,
        assignedAt: null,
      };
      setIps((prev) => [...prev, newIP]);
      if (existing) {
        toast.warning("IP address added as Duplicate — this address already exists");
      } else {
        toast.success("IP address added successfully");
      }
    }
    goList();
  };

  const deleteIP = (id: string) => {
    if (confirm("Delete this IP?")) {
      setIps((prev) => prev.filter((i) => i.id !== id));
      toast.success("IP address deleted");
    }
  };

  const checkAvailability = () => {
    const found = ips.find((i) => i.ipAddress === checkIP);
    setCheckResult(
      found
        ? `${checkIP} is ${found.status}${found.device ? ` — assigned to ${found.device.deviceName}` : ""}`
        : `${checkIP} is Available (not in system)`,
    );
  };

  const addVlan = () => {
    const v: VLAN = {
      id: generateId(),
      vlanNumber: vlanForm.vlanNumber || 0,
      name: vlanForm.name || "",
      subnet: vlanForm.subnet || "",
      gateway: vlanForm.gateway || "",
      description: vlanForm.description || "",
    };
    setVlans((prev) => [...prev, v]);
    setShowVlanForm(false);
    setVlanForm({});
    toast.success("VLAN added successfully");
  };

  const deleteVlan = (id: string) => {
    if (confirm("Delete this VLAN?")) {
      setVlans((prev) => prev.filter((v) => v.id !== id));
      toast.success("VLAN deleted");
    }
  };

  // Generate range view for selected VLAN
  const selectedVlanForRange = filterVlan || "vlan-03";
  const rangeIPs = useMemo(() => {
    const vlan = vlans.find((v) => v.id === selectedVlanForRange);
    if (!vlan) return [];
    const base = vlan.subnet.split("/")[0].replace(/\.\d+$/, "");
    return Array.from({ length: 254 }, (_, i) => {
      const addr = `${base}.${i + 1}`;
      const found = ips.find(
        (ip) => ip.ipAddress === addr && ip.vlanId === selectedVlanForRange,
      );
      return {
        addr,
        status: found?.status || "Available",
        device: found?.device?.deviceName,
      };
    });
  }, [selectedVlanForRange, ips, vlans]);

  const statusColors: Record<string, string> = {
    Assigned: "#3B82F6",
    Available: "#10B981",
    Reserved: "#F59E0B",
    Duplicate: "#EF4444",
  };

  // ── FULL-PAGE ADD / EDIT FORM ──
  if (mode !== "list") {
    const title = mode === "edit" ? `Edit IP Address: ${activeIP?.ipAddress}` : "Add New IP Address";

    return (
      <div className="animate-fade-in">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={goList}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: "1px solid var(--border-primary)",
                background: "var(--bg-card)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-secondary)",
              }}
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                {title}
              </h2>
              <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>
                {mode === "edit" ? "Update the IP address details below" : "Fill in the details for the new IP address"}
              </p>
            </div>
          </div>
          <button
            onClick={saveIP}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #008793, #004D7A)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Save size={14} /> {mode === "edit" ? "Update" : "Save IP Address"}
          </button>
        </div>

        {/* Form Card */}
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 14,
            border: "1px solid var(--border-primary)",
            padding: "28px 32px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
            <div>
              <label style={labelStyle}>IP Address *</label>
              <input
                value={ipForm.ipAddress}
                onChange={(e) =>
                  setIPForm((p) => ({ ...p, ipAddress: e.target.value }))
                }
                style={inputStyle}
                placeholder="e.g. 10.10.30.20"
              />
            </div>
            <div>
              <label style={labelStyle}>VLAN</label>
              <select
                value={ipForm.vlanId}
                onChange={(e) =>
                  setIPForm((p) => ({ ...p, vlanId: e.target.value }))
                }
                style={selectStyle}
              >
                {vlans.map((v) => (
                  <option key={v.id} value={v.id}>
                    VLAN {v.vlanNumber} - {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={ipForm.status}
                onChange={(e) =>
                  setIPForm((p) => ({
                    ...p,
                    status: e.target.value as IPAddress["status"],
                  }))
                }
                style={selectStyle}
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Reserved">Reserved</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={ipForm.type}
                onChange={(e) =>
                  setIPForm((p) => ({
                    ...p,
                    type: e.target.value as IPAddress["type"],
                  }))
                }
                style={selectStyle}
              >
                <option value="IPv4">IPv4</option>
                <option value="IPv6">IPv6</option>
              </select>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={ipForm.notes}
                onChange={(e) =>
                  setIPForm((p) => ({ ...p, notes: e.target.value }))
                }
                rows={3}
                style={{ ...inputStyle, resize: "vertical" }}
                placeholder="Optional notes about this IP address..."
              />
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 16,
          }}
        >
          <button
            onClick={goList}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "1px solid var(--border-primary)",
              background: "transparent",
              color: "var(--text-secondary)",
              fontSize: 13,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={saveIP}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #008793, #004D7A)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {mode === "edit" ? "Update IP Address" : "Add IP Address"}
          </button>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──
  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            IP Address Management
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            {ipStats.total} total addresses tracked
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={goAdd}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #008793, #004D7A)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-heading)",
              boxShadow: "0 4px 12px rgba(0,135,147,0.25)",
            }}
          >
            <Plus size={16} /> Add IP
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: "Total", value: ipStats.total, color: "#008793" },
          { label: "Assigned", value: ipStats.assigned, color: "#3B82F6" },
          { label: "Available", value: ipStats.available, color: "#10B981" },
          { label: "Reserved", value: ipStats.reserved, color: "#F59E0B" },
          { label: "Duplicates", value: duplicates.length, color: "#EF4444" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              background: "var(--bg-card)",
              borderRadius: 12,
              padding: "16px 18px",
              border: "1px solid var(--border-primary)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: s.color,
                fontFamily: "var(--font-heading)",
              }}
            >
              {s.value}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "var(--bg-card)",
          borderRadius: 10,
          padding: 4,
          border: "1px solid var(--border-primary)",
          width: "fit-content",
        }}
      >
        {[
          { key: "ips" as const, label: "IP Addresses", icon: Globe },
          { key: "vlans" as const, label: "VLANs", icon: Layers },
          { key: "range" as const, label: "IP Range Map", icon: Wifi },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 16px",
              borderRadius: 8,
              border: "none",
              background:
                tab === t.key ? "var(--accent-primary)" : "transparent",
              color: tab === t.key ? "#fff" : "var(--text-secondary)",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {/* IP Availability Checker */}
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 12,
          padding: "16px 20px",
          border: "1px solid var(--border-primary)",
          marginBottom: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            fontWeight: 500,
            whiteSpace: "nowrap",
          }}
        >
          Check IP:
        </span>
        <input
          value={checkIP}
          onChange={(e) => {
            setCheckIP(e.target.value);
            setCheckResult(null);
          }}
          placeholder="e.g. 10.10.30.20"
          style={{ ...inputStyle, maxWidth: 200 }}
        />
        <button
          onClick={checkAvailability}
          style={{
            padding: "10px 16px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent-primary)",
            color: "#fff",
            fontSize: 13,
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          Check
        </button>
        {checkResult && (
          <span
            style={{
              fontSize: 13,
              color: checkResult.includes("Available") ? "#10B981" : "#F59E0B",
            }}
          >
            {checkResult}
          </span>
        )}
      </div>

      {/* Duplicate Alerts */}
      {duplicates.length > 0 && (
        <div
          style={{
            background: "rgba(239,68,68,0.06)",
            borderRadius: 12,
            padding: "14px 20px",
            border: "1px solid rgba(239,68,68,0.15)",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <AlertTriangle size={18} color="#EF4444" />
          <span style={{ fontSize: 13, color: "#EF4444", fontWeight: 500 }}>
            {duplicates.length} duplicate IP address(es) detected
          </span>
        </div>
      )}

      {/* IP Table */}
      {tab === "ips" && (
        <>
          <div
            style={{
              display: "flex",
              gap: 12,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search
                size={16}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-muted)",
                }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search IPs or devices..."
                style={{ ...inputStyle, paddingLeft: 40 }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                ...inputStyle,
                width: 140,
                appearance: "none" as const,
                cursor: "pointer",
              }}
            >
              <option value="">All Status</option>
              <option value="Assigned">Assigned</option>
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Duplicate">Duplicate</option>
            </select>
            <select
              value={filterVlan}
              onChange={(e) => setFilterVlan(e.target.value)}
              style={{
                ...inputStyle,
                width: 180,
                appearance: "none" as const,
                cursor: "pointer",
              }}
            >
              <option value="">All VLANs</option>
              {vlans.map((v) => (
                <option key={v.id} value={v.id}>
                  VLAN {v.vlanNumber} - {v.name}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 14,
              border: "1px solid var(--border-primary)",
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)" }}>
                  {[
                    "IP Address",
                    "Status",
                    "Device",
                    "VLAN",
                    "Type",
                    "Notes",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "12px 16px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 50).map((ip) => {
                  const vlan = vlans.find((v) => v.id === ip.vlanId);
                  return (
                    <tr
                      key={ip.id}
                      style={{
                        borderBottom: "1px solid var(--border-secondary)",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background =
                          "var(--bg-tertiary)")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "transparent")
                      }
                    >
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          fontFamily: "monospace",
                          color: "var(--text-primary)",
                        }}
                      >
                        {ip.ipAddress}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            padding: "3px 8px",
                            borderRadius: 6,
                            background: `${statusColors[ip.status]}15`,
                            color: statusColors[ip.status],
                            fontWeight: 500,
                          }}
                        >
                          {ip.status}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 13,
                          color: "var(--text-secondary)",
                        }}
                      >
                        {ip.device?.deviceName || "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}
                      >
                        {vlan ? `VLAN ${vlan.vlanNumber}` : "—"}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}
                      >
                        {ip.type}
                      </td>
                      <td
                        style={{
                          padding: "10px 16px",
                          fontSize: 12,
                          color: "var(--text-muted)",
                        }}
                      >
                        {ip.notes || "—"}
                      </td>
                      <td style={{ padding: "10px 16px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => goEdit(ip)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: "none",
                              background: "var(--bg-tertiary)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#3B82F6",
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteIP(ip.id)}
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: 6,
                              border: "none",
                              background: "var(--bg-tertiary)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#EF4444",
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* VLANs Tab */}
      {tab === "vlans" && (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 16,
            }}
          >
            <button
              onClick={() => setShowVlanForm(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                background: "var(--accent-primary)",
                color: "#fff",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              <Plus size={15} /> Add VLAN
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: 16,
            }}
          >
            {vlans.map((v) => (
              <div
                key={v.id}
                style={{
                  background: "var(--bg-card)",
                  borderRadius: 12,
                  padding: "20px",
                  border: "1px solid var(--border-primary)",
                  boxShadow: "var(--shadow-card)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        background: "rgba(0,135,147,0.1)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Layers size={18} color="#008793" />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                      >
                        VLAN {v.vlanNumber}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {v.name}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteVlan(v.id)}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: "var(--text-muted)",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                  }}
                >
                  {[
                    ["Subnet", v.subnet],
                    ["Gateway", v.gateway],
                  ].map(([k, val]) => (
                    <div
                      key={k}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 6,
                        background: "var(--bg-tertiary)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: "var(--text-primary)",
                          fontFamily: "monospace",
                          marginTop: 2,
                        }}
                      >
                        {val}
                      </div>
                    </div>
                  ))}
                </div>
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    marginTop: 10,
                  }}
                >
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* IP Range Map */}
      {tab === "range" && (
        <div>
          <div style={{ marginBottom: 16 }}>
            <select
              value={selectedVlanForRange}
              onChange={(e) => setFilterVlan(e.target.value)}
              style={{
                ...inputStyle,
                width: 250,
                appearance: "none" as const,
                cursor: "pointer",
              }}
            >
              {vlans.map((v) => (
                <option key={v.id} value={v.id}>
                  VLAN {v.vlanNumber} - {v.name} ({v.subnet})
                </option>
              ))}
            </select>
          </div>
          <div
            style={{
              background: "var(--bg-card)",
              borderRadius: 14,
              padding: 20,
              border: "1px solid var(--border-primary)",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: 12,
                marginBottom: 16,
                flexWrap: "wrap",
              }}
            >
              {Object.entries(statusColors).map(([s, c]) => (
                <div
                  key={s}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--text-secondary)",
                  }}
                >
                  <div
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 3,
                      background: c,
                    }}
                  />
                  {s}
                </div>
              ))}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(16, 1fr)",
                gap: 3,
              }}
            >
              {rangeIPs.map((ip) => (
                <div
                  key={ip.addr}
                  title={`${ip.addr}${ip.device ? ` — ${ip.device}` : ""} (${ip.status})`}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 4,
                    background: statusColors[ip.status] || "#10B981",
                    opacity: ip.status === "Available" ? 0.3 : 0.85,
                    cursor: "pointer",
                    transition: "opacity 0.2s, transform 0.15s",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 7,
                    color: "#fff",
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.opacity = "1";
                    e.currentTarget.style.transform = "scale(1.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.opacity =
                      ip.status === "Available" ? "0.3" : "0.85";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  {ip.addr.split(".").pop()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add VLAN Modal */}
      {showVlanForm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowVlanForm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="animate-scale-in"
            style={{
              background: "var(--bg-secondary)",
              borderRadius: 16,
              width: 420,
              padding: 28,
              border: "1px solid var(--border-primary)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <h3
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFamily: "var(--font-heading)",
                }}
              >
                Add VLAN
              </h3>
              <button
                onClick={() => setShowVlanForm(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={labelStyle}>VLAN Number</label>
                <input
                  type="number"
                  value={vlanForm.vlanNumber || ""}
                  onChange={(e) =>
                    setVlanForm((p) => ({ ...p, vlanNumber: +e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  value={vlanForm.name || ""}
                  onChange={(e) =>
                    setVlanForm((p) => ({ ...p, name: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Subnet</label>
                <input
                  value={vlanForm.subnet || ""}
                  onChange={(e) =>
                    setVlanForm((p) => ({ ...p, subnet: e.target.value }))
                  }
                  style={inputStyle}
                  placeholder="10.10.x.0/24"
                />
              </div>
              <div>
                <label style={labelStyle}>Gateway</label>
                <input
                  value={vlanForm.gateway || ""}
                  onChange={(e) =>
                    setVlanForm((p) => ({ ...p, gateway: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <input
                  value={vlanForm.description || ""}
                  onChange={(e) =>
                    setVlanForm((p) => ({ ...p, description: e.target.value }))
                  }
                  style={inputStyle}
                />
              </div>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                onClick={() => setShowVlanForm(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid var(--border-primary)",
                  background: "transparent",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={addVlan}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "var(--accent-primary)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Add VLAN
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
