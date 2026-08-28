import Navbar from "../components/layout/Navbar";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f8ff] text-blue-950">
      <Navbar />

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-indigo-100" />

        <div className="pointer-events-none absolute -right-40 top-0 h-[450px] w-[450px] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-40 bottom-0 h-[350px] w-[450px] rounded-full bg-indigo-200/25 blur-3xl" />
        <div className="pointer-events-none absolute left-[38%] top-[20%] h-[260px] w-[260px] rounded-full bg-blue-100/30 blur-3xl" />

        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-full opacity-40">
          <div className="absolute bottom-8 left-[-10%] h-24 w-[120%] rotate-[-3deg] rounded-[50%] border-t border-blue-200/60" />
          <div className="absolute bottom-1 left-[-10%] h-24 w-[120%] rotate-[-3deg] rounded-[50%] border-t border-blue-200/40" />
        </div>

        <div className="relative z-10 mx-auto grid max-w-[1400px] items-center gap-8 px-6 pt-16 pb-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10 lg:px-10 lg:pt-16 lg:pb-8">
          <HeroContent />
          <DashboardPreview />
        </div>
      </section>
    </main>
  );
}

function HeroContent() {
  return (
    <div className="relative z-20">
      <div className="mb-4 inline-flex rounded-full border border-blue-200 bg-blue-100/70 px-4 py-2 backdrop-blur">
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-700">
          AI-Powered Data Analytics
        </span>
      </div>

      <h1 className="max-w-[650px] text-5xl font-bold leading-[1.02] tracking-[-0.035em] text-blue-950 sm:text-6xl lg:text-[56px]">
        Know what your data
        <br />
        means,{" "}
        <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
          not just what it says.
        </span>
      </h1>

      <p className="mt-5 max-w-[590px] text-base leading-7 text-slate-600 sm:text-lg">
        InsightOS turns your raw data into dashboards, alerts, and
        plain-language reports — automatically, every day.
      </p>

      <div className="mt-6 flex max-w-[590px] flex-col gap-3 sm:flex-row">
        <div className="flex h-14 flex-1 items-center rounded-xl border border-blue-200 bg-white/90 px-4 shadow-sm backdrop-blur">
          <span className="mr-3 text-slate-400">✉</span>

          <input
            type="email"
            placeholder="Enter your email"
            aria-label="Email address"
            className="w-full bg-transparent text-sm text-blue-950 outline-none placeholder:text-slate-400"
          />
        </div>

        <a
          href="/login"
          className="flex h-14 items-center justify-center rounded-xl bg-blue-900 px-7 text-sm font-bold text-white shadow-xl shadow-blue-900/20 transition duration-200 hover:-translate-y-0.5 hover:bg-blue-800"
        >
          Start free trial →
        </a>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-[11px] text-slate-500">
        <TrustPoint icon="✓" text="No credit card required" />
        <TrustPoint icon="◷" text="14-day free trial" />
        <TrustPoint icon="✓" text="Cancel anytime" />
      </div>
    </div>
  );
}

function TrustPoint({
  icon,
  text,
}: {
  icon: string;
  text: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
        {icon}
      </span>
      {text}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[650px]">
      <div className="pointer-events-none absolute -inset-6 rounded-[40px] bg-blue-300/25 blur-3xl" />

      <div className="relative rounded-[26px] border border-white/90 bg-white/85 p-2 shadow-[0_20px_55px_rgba(30,64,175,0.14)] backdrop-blur-xl">
        <div className="rounded-[20px] border border-blue-100 bg-white p-3.5">
          <DashboardHeader />

          <div className="grid grid-cols-3 gap-1.5">
            <StatCard
              title="Total Revenue"
              value="$124.8K"
              change="+18.4%"
              icon="$"
              color="blue"
            />

            <StatCard
              title="Total Users"
              value="24.8K"
              change="+12.6%"
              icon="♙"
              color="purple"
            />

            <StatCard
              title="Conversion Rate"
              value="7.8%"
              change="+8.1%"
              icon="▥"
              color="sky"
            />
          </div>

          <div className="mt-2.5 grid grid-cols-[1.55fr_0.8fr] gap-2.5">
            <RevenueCard />
            <InsightCard />
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardHeader() {
  return (
    <div className="mb-3 flex items-center justify-between">
      <div>
        <p className="text-[10px] font-medium text-slate-400">Analytics</p>
        <h2 className="text-lg font-bold text-blue-950">Overview</h2>
      </div>

      <button
        type="button"
        className="rounded-lg border border-blue-100 bg-white px-3 py-1.5 text-[10px] text-slate-600 shadow-sm"
      >
        This Month
      </button>
    </div>
  );
}

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  icon: string;
  color: "blue" | "purple" | "sky";
};

function StatCard({
  title,
  value,
  change,
  icon,
  color,
}: StatCardProps) {
  const colors = {
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-purple-100 text-purple-600",
    sky: "bg-sky-100 text-sky-600",
  };

  return (
    <div className="rounded-xl border border-blue-100 bg-white p-2 shadow-[0_2px_8px_rgba(30,64,175,0.06)]">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[7px] text-slate-400">{title}</p>

          <p className="mt-0.5 text-[15px] font-bold tracking-tight text-blue-950">
            {value}
          </p>

          <p className="mt-0.5 text-[7px] font-semibold text-emerald-500">
            ↑ {change}
          </p>
        </div>

        <span
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[8px] font-bold ${colors[color]}`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-1 flex h-2.5 items-end gap-[2px]">
        <span className="h-1 w-1 rounded bg-blue-200" />
        <span className="h-1.5 w-1 rounded bg-blue-300" />
        <span className="h-1 w-1 rounded bg-blue-200" />
        <span className="h-2 w-1 rounded bg-blue-400" />
        <span className="h-1.5 w-1 rounded bg-blue-300" />
        <span className="h-2.5 w-1 rounded bg-blue-500" />
        <span className="h-2 w-1 rounded bg-blue-400" />
      </div>
    </div>
  );
}

function RevenueCard() {
  return (
    <div className="min-w-0 rounded-2xl border border-blue-100 bg-white p-3">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-bold text-blue-950">
            Revenue Overview
          </p>

          <p className="text-[9px] text-slate-400">
            Monthly performance
          </p>
        </div>

        <span className="text-[11px] font-semibold text-blue-500">
          +18.4%
        </span>
      </div>

      <div className="mt-2 h-[105px]">
        <RevenueChart />
      </div>
    </div>
  );
}

function InsightCard() {
  return (
    <div className="min-w-0 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-3">
      <p className="text-sm font-bold text-blue-950">Insight</p>

      <div className="mt-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-base shadow-sm">
        ✦
      </div>

      <p className="mt-3 text-[11px] font-semibold leading-5 text-blue-950">
        Revenue is up 18.4% this month.
      </p>

      <p className="mt-1 text-[9px] leading-4 text-slate-500">
        Your top-performing channel is Organic Search.
      </p>

      <button
        type="button"
        className="mt-3 rounded-lg bg-white px-3 py-1.5 text-[9px] font-semibold text-blue-700 shadow-sm"
      >
        View Insight →
      </button>
    </div>
  );
}

function RevenueChart() {
  const path = `
    M0 120
    C35 105, 55 98, 85 112
    C115 126, 130 92, 160 82
    C190 72, 205 110, 235 95
    C265 80, 275 48, 305 60
    C335 72, 345 102, 375 76
    C405 50, 420 64, 445 38
    C465 20, 485 32, 500 8
  `;

  const points = [
    [85, 112],
    [160, 82],
    [235, 95],
    [305, 60],
    [375, 76],
    [445, 38],
    [500, 8],
  ];

  return (
    <div className="relative h-full w-full">
      <div className="absolute left-0 top-0 flex h-[82px] flex-col justify-between text-[7px] text-slate-400">
        <span>$150K</span>
        <span>$100K</span>
        <span>$50K</span>
        <span>$0</span>
      </div>

      <svg
        viewBox="0 0 500 150"
        className="ml-6 h-[82px] w-[calc(100%-24px)]"
        preserveAspectRatio="none"
        aria-label="Revenue growth chart"
      >
        <defs>
          <linearGradient
            id="revenueGradient"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="0%"
              stopColor="#3b82f6"
              stopOpacity="0.20"
            />
            <stop
              offset="100%"
              stopColor="#3b82f6"
              stopOpacity="0"
            />
          </linearGradient>
        </defs>

        {[10, 55, 100, 145].map((y) => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="500"
            y2={y}
            stroke="#e7eefc"
            strokeWidth="1"
          />
        ))}

        <path
          d={`${path} L500 145 L0 145 Z`}
          fill="url(#revenueGradient)"
        />

        <path
          d={path}
          fill="none"
          stroke="#2563eb"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {points.map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={cx === 500 ? 3.5 : 3}
            fill="#2563eb"
          />
        ))}
      </svg>

      <div className="absolute bottom-0 left-6 right-0 flex justify-between text-[7px] text-slate-400">
        <span>Jan</span>
        <span>Feb</span>
        <span>Mar</span>
        <span>Apr</span>
        <span>May</span>
        <span>Jun</span>
      </div>
    </div>
  );
}