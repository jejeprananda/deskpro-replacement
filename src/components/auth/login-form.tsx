"use client";

import axios from "axios";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { APP_NAME } from "@/lib/app-config";

const loginFormSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex w-full max-w-md flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm"
    >
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{APP_NAME}</h1>
        <p className="mt-1 text-sm text-zinc-600">Use your agent credentials</p>
      </div>

      {errorMessage ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm font-medium text-zinc-700">
          Username
        </label>
        <input
          id="username"
          type="text"
          autoComplete="username"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          {...register("username")}
        />
        {errors.username ? (
          <p className="text-xs text-red-600">{errors.username.message}</p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium text-zinc-700">
          Password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-500"
          {...register("password")}
        />
        {errors.password ? (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
