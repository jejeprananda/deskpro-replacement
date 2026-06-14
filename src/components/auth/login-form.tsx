"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { APP_VERSION } from "@/lib/app-config";

const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

const inputClassName =
  "w-full rounded-xl border border-[var(--login-input-border)] bg-[var(--login-input-bg)] py-2.5 text-sm text-[var(--login-input-text)] outline-none placeholder:text-[var(--login-input-placeholder)] focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/30";

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    setErrorMessage(null);

    try {
      await axios.post("/api/auth/login", {
        ...values,
        isSession: true,
        mode: "cookie",
      });
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const message =
          (error.response?.data as { message?: string } | undefined)?.message ??
          "Login failed. Please check your credentials.";
        setErrorMessage(message);
        return;
      }

      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  }

  return (
    <div className="relative z-10 flex w-full max-w-md flex-col items-center">
      <div
        className="login-card w-full rounded-2xl bg-gradient-to-b from-purple-500/40 via-fuchsia-500/20 to-cyan-500/40 p-px"
        data-surface="dark"
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5 rounded-2xl border border-white/10 bg-[var(--login-card-bg)] p-8 backdrop-blur-xl"
        >
          <div className="text-center">
            <h1 className="bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
              JEJE
            </h1>
            <p className="mt-1 text-xs font-medium tracking-[0.35em] text-[var(--login-card-text)] uppercase">
              Ticket Manager
            </p>
            <div className="mx-auto mt-4 h-px w-16 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-400" />
            <p className="mt-4 text-sm text-[var(--login-card-muted)]">
              Use your agent credentials
            </p>
          </div>

          {errorMessage ? (
            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {errorMessage}
            </div>
          ) : null}

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="username"
              className="text-sm font-medium text-[var(--login-card-text)]"
            >
              Username
            </label>
            <div className="relative">
              <User className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--login-icon)]" />
              <input
                id="username"
                type="text"
                autoComplete="username"
                placeholder="Enter your username"
                className={`${inputClassName} pr-3 pl-10`}
                {...register("username")}
              />
            </div>
            {errors.username ? (
              <p className="text-xs text-red-300">{errors.username.message}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="password"
              className="text-sm font-medium text-[var(--login-card-text)]"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--login-icon)]" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className={`${inputClassName} pr-10 pl-10`}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => {
                  setShowPassword((current) => !current);
                }}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-[var(--login-icon)] transition-colors hover:text-[var(--login-icon-hover)]"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-red-300">{errors.password.message}</p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>

      <div className="mt-8 flex flex-col items-center gap-2">
        <p className="flex items-center gap-2 text-sm text-[var(--login-page-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />
          Deskpro? Cuiiiih!!!
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
        </p>
        <p className="text-xs text-[var(--login-page-subtle)]">{APP_VERSION}</p>
      </div>
    </div>
  );
}
