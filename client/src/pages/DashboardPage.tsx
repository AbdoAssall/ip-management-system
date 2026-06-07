import { useState, useMemo } from "react";
import { mockData } from "@/lib/mockData";
import {
  DEVICE_CATEGORIES,
  DEFAULT_VLANS,
  DEFAULT_BRANCHES,
  DEFAULT_DEPARTMENTS,
} from "@/lib/constants";
import { formatDate, formatDateTime, timeAgo } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useWebSocket } from "@/contexts/WebSocketContext";
import type { Device } from "@/types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  Monitor,
  Server,
  Router,
  Network,
  Layers,
  Laptop,
  Fingerprint,
  Camera,
  Shield,
  Phone,
  Wifi,
  HardDrive,
  Globe,
  CheckCircle2,
  XCircle,
  Wrench,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowLeft,
  Edit2,
  Activity,
  Zap,
  WifiOff,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Router,
  Network,
  Layers,
  Server,
  Monitor,
  Laptop,
  Fingerprint,
  Camera,
  Shield,
  Phone,
  Wifi,
};

export default function DashboardPage() {
  const { user } = useAuth();
  const { isConnected, deviceStatuses, statusEvents } = useWebSocket();
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [detailTab, setDetailTab] = useState(0);

  // Use live WebSocket data for online/offline counts, fallback to mock
  const liveStats = useMemo(() => {
    if (deviceStatuses.size > 0) {
      let online = 0, offline = 0, maintenance = 0;
      deviceStatuses.forEach((s) => {
        if (s.status === 'Online') online++;
        else if (s.status === 'Offline') offline++;
        else if (s.status === 'Maintenance') maintenance++;
      });
      return { online, offline, maintenance, total: deviceStatuses.size };
    }
    return null;
  }, [deviceStatuses]);

  const stats = useMemo(() => {
    const devices = mockData.devices;
    const ips = mockData.ipAddresses;
    const online = liveStats?.online ?? devices.filter((d) => d.status === "Online").length;
    const offline = liveStats?.offline ?? devices.filter((d) => d.status === "Offline").length;
    const maintenance = liveStats?.maintenance ?? devices.filter(
      (d) => d.status === "Maintenance",
    ).length;
    const total = liveStats?.total ?? devices.length;
    const assigned = ips.filter((ip) => ip.status === "Assigned").length;
    const available = ips.filter((ip) => ip.status === "Available").length;
    const seen = new Map<string, number>();
    ips.forEach((ip) =>
      seen.set(ip.ipAddress, (seen.get(ip.ipAddress) || 0) + 1),
    );
    let dupCount = 0;
    seen.forEach((c) => {
      if (c > 1) dupCount++;
    });
    const byCategory = DEVICE_CATEGORIES.map((cat) => ({
      name: cat.name,
      count: devices.filter((d) => d.categoryId === cat.id).length,
      color: cat.color,
      icon: cat.icon,
    })).filter((c) => c.count > 0);
    const subnetUtil = DEFAULT_VLANS.map((v) => {
      const used = ips.filter(
        (ip) => ip.vlanId === v.id && ip.status !== "Available",
      ).length;
      return {
        name: v.name,
        subnet: v.subnet,
        used,
        total: 254,
        pct: Math.round((used / 254) * 100),
      };
    });
    const warrantyExpiring = devices.filter((d) => {
      const diff =
        (new Date(d.warrantyExpiration).getTime() - Date.now()) / 86400000;
      return diff > 0 && diff < 90;
    }).length;
    return {
      total,
      online,
      offline,
      maintenance,
      totalIPs: ips.length,
      assigned,
      available,
      duplicates: dupCount,
      byCategory,
      subnetUtil,
      recent: devices.slice(-8).reverse(),
      warrantyExpiring,
    };
  }, [liveStats]);

  const recentActivity = useMemo(() => mockData.auditLogs.slice(0, 5), []);
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }, []);

  if (selectedDevice) {
    const dev = selectedDevice;
    const cat = DEVICE_CATEGORIES.find((c) => c.id === dev.categoryId);
    const dtabs = [
      { l: "General", i: Monitor },
      { l: "Network", i: Globe },
      { l: "Location", i: Layers },
      { l: "Responsibility", i: Phone },
      { l: "Security", i: Shield },
    ];
    const td: Record<string, [string, string | undefined][]> = {
      General: [
        ["Device Name", dev.deviceName],
        ["Hostname", dev.hostname],
        ["Asset Tag", dev.assetTag],
        ["Serial Number", dev.serialNumber],
        ["Brand", dev.brand],
        ["Model", dev.model],
        ["Purchase Date", formatDate(dev.purchaseDate)],
        ["Warranty Expiry", formatDate(dev.warrantyExpiration)],
        ["Notes", dev.notes || "—"],
      ],
      Network: [
        ["IP Address", dev.ipAddress],
        ["Subnet Mask", dev.subnetMask],
        ["Default Gateway", dev.defaultGateway],
        ["MAC Address", dev.macAddress],
        ["DNS", dev.dns],
        ["DHCP / Static", dev.dhcpStatic],
        ["VLAN", DEFAULT_VLANS.find((v) => v.id === dev.vlanId)?.name || "—"],
      ],
      Location: [
        [
          "Branch",
          DEFAULT_BRANCHES.find((b) => b.id === dev.branchId)?.name || "—",
        ],
        [
          "Department",
          DEFAULT_DEPARTMENTS.find((d) => d.id === dev.departmentId)?.name ||
            "—",
        ],
        ["Building", dev.building],
        ["Floor", dev.floor],
        ["Room", dev.room],
      ],
      Responsibility: [
        ["Employee", dev.employee?.fullName || "—"],
        ["Employee Code", dev.employee?.employeeCode || "—"],
        ["Phone", dev.employee?.phone || "—"],
        ["Email", dev.employee?.email || "—"],
      ],
      Security: [
        ["Security Level", dev.securityLevel],
        ["Backup Status", dev.backupStatus],
        ["Monitoring", dev.monitoringEnabled ? "Enabled" : "Disabled"],
        ["Last Maintenance", formatDate(dev.lastMaintenance)],
      ],
    };
    const rows = td[dtabs[detailTab].l] || [];
    return (
      <div className="animate-fade-in">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <button
              onClick={() => {
                setSelectedDevice(null);
                setDetailTab(0);
              }}
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
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-heading)",
                  }}
                >
                  {dev.deviceName}
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 20,
                    background:
                      dev.status === "Online"
                        ? "#10B98120"
                        : dev.status === "Offline"
                          ? "#EF444420"
                          : "#F59E0B20",
                    color:
                      dev.status === "Online"
                        ? "#10B981"
                        : dev.status === "Offline"
                          ? "#EF4444"
                          : "#F59E0B",
                    fontWeight: 600,
                  }}
                >
                  {dev.status}
                </span>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  marginTop: 2,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: cat?.color,
                    display: "inline-block",
                    marginRight: 6,
                  }}
                />
                {cat?.name} • {dev.brand} {dev.model}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid var(--border-primary)",
          }}
        >
          {dtabs.map((t, i) => (
            <button
              key={t.l}
              onClick={() => setDetailTab(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 20px",
                border: "none",
                background: "none",
                fontSize: 13,
                fontWeight: detailTab === i ? 600 : 400,
                color:
                  detailTab === i ? "var(--text-primary)" : "var(--text-muted)",
                cursor: "pointer",
                borderBottom:
                  detailTab === i
                    ? "2px solid var(--accent-primary)"
                    : "2px solid transparent",
              }}
            >
              <t.i size={15} /> {t.l}
            </button>
          ))}
        </div>
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: "0 0 14px 14px",
            border: "1px solid var(--border-primary)",
            borderTop: "none",
            padding: "28px 32px",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}
          >
            {rows.map(([label, value]) => (
              <div
                key={label}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--border-secondary)",
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--accent-primary)",
                    marginBottom: 4,
                    fontWeight: 500,
                  }}
                >
                  {label}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: "var(--text-primary)",
                    fontWeight: 500,
                  }}
                >
                  {value || "—"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "TOTAL DEVICES",
      value: stats.total,
      sub: "Across all categories",
      trend: "↑ 8% vs last month",
      up: true,
      icon: Monitor,
      iconColor: "#008793",
    },
    {
      label: "ACTIVE DEVICES",
      value: stats.online,
      sub: `${Math.round((stats.online / stats.total) * 100)}% of fleet online`,
      trend: "↑ 3% vs last month",
      up: true,
      icon: CheckCircle2,
      iconColor: "#10B981",
    },
    {
      label: "OFFLINE DEVICES",
      value: stats.offline,
      sub: "Requires attention",
      trend: "↓ 1% vs last month",
      up: false,
      icon: XCircle,
      iconColor: "#EF4444",
    },
    {
      label: "IN MAINTENANCE",
      value: stats.maintenance,
      sub: "Scheduled work",
      trend: "",
      up: true,
      icon: Wrench,
      iconColor: "#F59E0B",
    },
    {
      label: "MANAGED IPS",
      value: stats.totalIPs,
      sub: `${stats.available} available`,
      trend: "",
      up: true,
      icon: Globe,
      iconColor: "#008793",
    },
  ];

  return (
    <div className="animate-fade-in">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <div>
          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
            }}
          >
            {greeting}, {user?.fullName?.split(" ")[0]} 👋
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
            Here's what's happening with your infrastructure today
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: isConnected ? '#10B98112' : '#EF444412', border: `1px solid ${isConnected ? '#10B98130' : '#EF444430'}` }}>
            <div className={isConnected ? 'ws-connected-dot' : 'ws-disconnected-dot'} />
            <span style={{ fontSize: 12, fontWeight: 600, color: isConnected ? '#10B981' : '#EF4444' }}>
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock size={14} /> {formatDateTime(new Date().toISOString())}
          </div>
        </div>
      </div>

      {/* Row 1: 3 stat cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {statCards.slice(0, 3).map((c, i) => (
          <div
            key={c.label}
            className={`animate-fade-in stagger-${i + 1}`}
            style={{
              background: "var(--stat-card-bg)",
              borderRadius: 14,
              padding: "20px 22px",
              border: "1px solid var(--stat-card-border)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${c.iconColor}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <c.icon size={20} color={c.iconColor} />
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--stat-card-label)",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "var(--stat-card-value)",
                fontFamily: "var(--font-heading)",
                lineHeight: 1,
              }}
            >
              {c.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--stat-card-sub)",
                marginTop: 6,
              }}
            >
              {c.sub}
            </div>
            {c.trend && (
              <div
                style={{
                  fontSize: 12,
                  color: c.up ? "#10B981" : "#EF4444",
                  marginTop: 6,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {c.up ? <TrendingUp size={13} /> : <TrendingDown size={13} />}{" "}
                {c.trend}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Row 2: 2 stat cards + Alerts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 16,
          marginBottom: 24,
        }}
      >
        {statCards.slice(3, 5).map((c, i) => (
          <div
            key={c.label}
            className={`animate-fade-in stagger-${i + 4}`}
            style={{
              background: "var(--stat-card-bg)",
              borderRadius: 14,
              padding: "20px 22px",
              border: "1px solid var(--stat-card-border)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 16,
                right: 16,
                width: 40,
                height: 40,
                borderRadius: 10,
                background: `${c.iconColor}20`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <c.icon size={20} color={c.iconColor} />
            </div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "var(--stat-card-label)",
                letterSpacing: 0.5,
                marginBottom: 8,
              }}
            >
              {c.label}
            </div>
            <div
              style={{
                fontSize: 36,
                fontWeight: 700,
                color: "var(--stat-card-value)",
                fontFamily: "var(--font-heading)",
                lineHeight: 1,
              }}
            >
              {c.value}
            </div>
            <div
              style={{
                fontSize: 12,
                color: "var(--stat-card-sub)",
                marginTop: 6,
              }}
            >
              {c.sub}
            </div>
          </div>
        ))}
        <div
          className="animate-fade-in stagger-6"
          style={{
            background: "var(--bg-card)",
            borderRadius: 14,
            padding: "20px 22px",
            border: "1px solid var(--border-primary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Alerts
            </span>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#F59E0B15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AlertTriangle size={18} color="#F59E0B" />
            </div>
          </div>
          <div
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: "var(--text-primary)",
              fontFamily: "var(--font-heading)",
              lineHeight: 1,
            }}
          >
            {stats.duplicates + stats.warrantyExpiring}
          </div>
          <div style={{ display: "flex", gap: 16, marginTop: 10 }}>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#EF4444" }}>
                {stats.duplicates}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginLeft: 4,
                }}
              >
                dup IPs
              </span>
            </div>
            <div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#F59E0B" }}>
                {stats.warrantyExpiring}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginLeft: 4,
                }}
              >
                warranties ending
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 14,
            padding: "22px 24px",
            border: "1px solid var(--border-primary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: 20,
              fontFamily: "var(--font-heading)",
            }}
          >
            Device Distribution
          </h3>
          <div style={{ display: "flex", alignItems: "center" }}>
            <ResponsiveContainer width="50%" height={220}>
              <PieChart>
                <Pie
                  data={stats.byCategory}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="count"
                >
                  {stats.byCategory.map((e) => (
                    <Cell key={e.name} fill={e.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 8,
                    fontSize: 12,
                    color: "var(--text-primary)",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {stats.byCategory.map((cat) => {
                const Icon = iconMap[cat.icon];
                return (
                  <div
                    key={cat.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12.5,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 2,
                        background: cat.color,
                        flexShrink: 0,
                      }}
                    />
                    {Icon && (
                      <Icon
                        size={14}
                        style={{ color: cat.color, flexShrink: 0 }}
                      />
                    )}
                    <span style={{ color: "var(--text-secondary)", flex: 1 }}>
                      {cat.name}
                    </span>
                    <span
                      style={{ color: "var(--text-primary)", fontWeight: 600 }}
                    >
                      {cat.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div
          style={{
            background: "var(--stat-card-bg)",
            borderRadius: 14,
            padding: "22px 24px",
            border: "1px solid var(--stat-card-border)",
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--stat-card-value)",
              marginBottom: 20,
              fontFamily: "var(--font-heading)",
            }}
          >
            IP Subnet Utilization
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {stats.subnetUtil.map((s) => (
              <div key={s.subnet}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--stat-card-sub)",
                      fontFamily: "monospace",
                    }}
                  >
                    {s.subnet}
                  </span>
                  <span
                    style={{ fontSize: 13, color: "#10B981", fontWeight: 600 }}
                  >
                    {s.pct}%
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 3,
                    background: "var(--subnet-bar-bg)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${s.pct}%`,
                      borderRadius: 3,
                      background: "linear-gradient(90deg, #10B981, #059669)",
                      transition: "width 0.8s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 20 }}>
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 14,
            padding: "22px 24px",
            border: "1px solid var(--border-primary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-heading)",
              }}
            >
              Recently Added Devices
            </h3>
            <a
              href="/devices"
              style={{
                fontSize: 12,
                color: "var(--accent-primary)",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              View All →
            </a>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Device", "IP Address", "Category", "Status", "Added"].map(
                  (h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        borderBottom: "1px solid var(--border-secondary)",
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {stats.recent.map((dev) => {
                const cat = DEVICE_CATEGORIES.find(
                  (c) => c.id === dev.categoryId,
                );
                const Icon = cat ? iconMap[cat.icon] : HardDrive;
                return (
                  <tr
                    key={dev.id}
                    style={{
                      borderBottom: "1px solid var(--border-secondary)",
                    }}
                  >
                    <td style={{ padding: "10px 12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: `${cat?.color}15`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {Icon && (
                            <Icon size={16} style={{ color: cat?.color }} />
                          )}
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              setSelectedDevice(dev);
                              setDetailTab(0);
                            }}
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--accent-primary)",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              textDecoration: "underline",
                              textUnderlineOffset: 2,
                              fontFamily: "var(--font-body)",
                            }}
                          >
                            {dev.deviceName}
                          </button>
                          <div
                            style={{ fontSize: 11, color: "var(--text-muted)" }}
                          >
                            {dev.assetTag}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: 13,
                        color: "var(--text-secondary)",
                        fontFamily: "monospace",
                      }}
                    >
                      {dev.ipAddress}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <span
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: `${cat?.color}15`,
                          color: cat?.color,
                          fontWeight: 500,
                        }}
                      >
                        {cat?.name}
                      </span>
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: "50%",
                            background:
                              dev.status === "Online"
                                ? "#10B981"
                                : dev.status === "Offline"
                                  ? "#EF4444"
                                  : "#F59E0B",
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: "var(--text-secondary)",
                          }}
                        >
                          {dev.status}
                        </span>
                      </div>
                    </td>
                    <td
                      style={{
                        padding: "10px 12px",
                        fontSize: 12,
                        color: "var(--text-muted)",
                      }}
                    >
                      {timeAgo(dev.createdAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div
          style={{
            background: "var(--bg-card)",
            borderRadius: 14,
            padding: "22px 24px",
            border: "1px solid var(--border-primary)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--text-primary)",
                fontFamily: "var(--font-heading)",
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Activity size={16} style={{ color: 'var(--accent-primary)' }} />
              Live Status Feed
            </h3>
            {isConnected && <div className="ping-pulse" />}
          </div>
          <p
            style={{
              fontSize: 12,
              color: "var(--accent-primary)",
              marginBottom: 16,
            }}
          >
            Real-time device connectivity events
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 320, overflowY: 'auto' }}>
            {statusEvents.length === 0 && (
              <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                <Zap size={20} style={{ marginBottom: 8, opacity: 0.4 }} />
                <div>No status events yet</div>
                <div style={{ fontSize: 11, marginTop: 4 }}>Events will appear when devices change state</div>
              </div>
            )}
            {statusEvents.slice(0, 15).map((evt) => {
              const isDown = evt.newStatus === 'Offline';
              const isRecovery = evt.previousStatus === 'Offline' && evt.newStatus === 'Online';
              return (
                <div
                  key={evt.id}
                  className="status-feed-item"
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--border-secondary)",
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: isDown ? '#EF444415' : isRecovery ? '#10B98115' : 'var(--bg-tertiary)',
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  >
                    {isDown ? <WifiOff size={14} color="#EF4444" /> : <Zap size={14} color={isRecovery ? '#10B981' : 'var(--text-muted)'} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: "var(--text-primary)", display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontWeight: 600 }}>{evt.deviceName}</span>
                      {evt.isCritical && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: '#EF444420', color: '#EF4444', fontWeight: 700, textTransform: 'uppercase' }}>Critical</span>}
                    </div>
                    <div style={{ fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: isDown ? '#EF4444' : '#10B981', fontWeight: 500 }}>
                        {evt.previousStatus} → {evt.newStatus}
                      </span>
                      {evt.responseTimeMs != null && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>{evt.responseTimeMs}ms</span>}
                    </div>
                    <div
                      style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}
                    >
                      {evt.category} • {timeAgo(evt.timestamp)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
