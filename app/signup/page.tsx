export default function SignupPage() {
  return (
    <main className="min-h-screen bg-[#f5f8ff] text-blue-950">
      {/* Header */}
      <div className="pt-8 text-center">
        <h1 className="text-4xl font-bold text-blue-950">
          InsightOS
        </h1>

        <p className="mt-2 text-base text-slate-500">
          Turn your data into smarter decisions.
        </p>
      </div>

      {/* Signup Card */}
      <div className="mx-auto mt-10 w-full max-w-[600px] px-6 pb-10">
        <div className="rounded-[24px] border border-blue-100 bg-white p-8 shadow-[0_20px_60px_rgba(30,64,175,0.08)] sm:p-10">

          <h2 className="text-3xl font-bold text-blue-950">
            Create your account
          </h2>

          <p className="mt-2 text-base text-slate-500">
            Start turning your data into meaningful insights.
          </p>

          {/* Name */}
          <div className="mt-7">
            <label className="text-sm font-semibold text-blue-950">
              Full name
            </label>

            <input
              type="text"
              placeholder="Enter your full name"
              className="mt-2 h-14 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Email */}
          <div className="mt-5">
            <label className="text-sm font-semibold text-blue-950">
              Email
            </label>

            <input
              type="email"
              placeholder="Enter your email"
              className="mt-2 h-14 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Password */}
          <div className="mt-5">
            <label className="text-sm font-semibold text-blue-950">
              Password
            </label>

            <input
              type="password"
              placeholder="Create a password"
              className="mt-2 h-14 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Confirm Password */}
          <div className="mt-5">
            <label className="text-sm font-semibold text-blue-950">
              Confirm password
            </label>

            <input
              type="password"
              placeholder="Confirm your password"
              className="mt-2 h-14 w-full rounded-xl border border-blue-200 bg-white px-4 text-sm text-blue-950 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Button */}
          <button
            type="button"
            className="mt-7 flex h-14 w-full items-center justify-center rounded-xl bg-blue-900 text-sm font-bold text-white shadow-xl shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
          >
            Create account →
          </button>

          {/* Divider */}
          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-blue-100" />
            <span className="text-sm text-slate-400">or</span>
            <div className="h-px flex-1 bg-blue-100" />
          </div>

          {/* Google */}
          <button
            type="button"
            className="flex h-14 w-full items-center justify-center rounded-xl border border-blue-200 bg-white text-sm font-semibold text-blue-950 transition hover:bg-blue-50"
          >
            Continue with Google
          </button>

          {/* Login */}
          <p className="mt-7 text-center text-sm text-slate-500">
            Already have an account?{" "}
            <a
              href="/login"
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Sign in
            </a>
          </p>

        </div>
      </div>
    </main>
  );
}