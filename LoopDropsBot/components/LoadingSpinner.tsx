export function LoadingSpinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex justify-center items-center">
      <div
        className="animate-spin rounded-full border-b-2 border-blue-500"
        style={{ width: size, height: size }}
      ></div>
    </div>
  );
}

