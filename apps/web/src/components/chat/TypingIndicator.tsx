export function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 animate-slide-in">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
        CA
      </div>
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
        <span
          className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-pulse"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-pulse"
          style={{ animationDelay: '200ms' }}
        />
        <span
          className="inline-block h-2 w-2 rounded-full bg-muted-foreground animate-pulse"
          style={{ animationDelay: '400ms' }}
        />
      </div>
    </div>
  );
}
