function LoadingScreen() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-champagne">
      <span className="sr-only">Loading content…</span>
      <div className="h-16 w-16 animate-spin rounded-full border-4 border-midnight/10 border-t-jade"></div>
    </div>
  );
}

export default LoadingScreen;
