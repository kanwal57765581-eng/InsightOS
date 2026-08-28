export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f5f8ff] text-blue-950">
      <div className="flex min-h-screen items-center justify-center px-6 py-12">

        <div className="w-full max-w-md">

          {/* Logo / Brand */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-blue-950">
              InsightOS
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Turn your data into smarter decisions.
            </p>
          </div>

          {/* Login Card */}
          <div className="rounded-2xl border border-blue-100 bg-white p-8 shadow-[0_20px_50px_rgba(30,64,175,0.10)]">

            <h2 className="text-2xl font-bold text-blue-950">
              Welcome back
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue to your dashboard.
            </p>

            {/* Email */}
            <div className="mt-6">
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-blue-950"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="h-12 w-full rounded-xl border border-blue-200 bg-blue-50/30 px-4 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Password */}
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-blue-950"
                >
                  Password
                </label>

                <button
                  type="button"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </button>
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                className="h-12 w-full rounded-xl border border-blue-200 bg-blue-50/30 px-4 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Login Button */}
            <button
              type="button"
              className="mt-6 h-12 w-full rounded-xl bg-blue-900 text-sm font-bold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-800"
            >
              Sign in →
            </button>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="h-px flex-1 bg-blue-100" />
              <span className="text-xs text-slate-400">
                or
              </span>
              <div className="h-px flex-1 bg-blue-100" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="h-12 w-full rounded-xl border border-blue-200 bg-white text-sm font-semibold text-blue-950 transition hover:bg-blue-50"
            >
              Continue with Google
            </button>

            {/* Sign Up */}
            <p className="mt-6 text-center text-sm text-slate-500">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="font-semibold text-blue-600 hover:text-blue-800"
              >
                Create account
              </a>
            </p>

          </div>

          {/* Back */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm font-medium text-slate-500 hover:text-blue-700"
            >
              ← Back to home
            </a>
          </div>

        </div>
      </div>
    </main>
  );
}