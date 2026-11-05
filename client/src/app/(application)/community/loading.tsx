export default function Loading() {
  return (
    <div className="mx-auto grid max-w-3xl gap-6" aria-busy aria-label="Loading posts">
      {[0, 1, 2].map((i) => (
        <div key={i} className="sheet h-56 animate-pulse" />
      ))}
    </div>
  );
}
