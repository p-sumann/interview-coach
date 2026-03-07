"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        <div className="text-center space-y-4 max-w-md px-6">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-neutral-400 text-sm">
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-amber-500 text-black rounded-lg font-medium hover:bg-amber-400 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
