type PaginationProps = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  blockSize?: number;
};

const DEFAULT_BLOCK = 5;

export default function Pagination({
  currentPage,
  totalPages,
  onChange,
  blockSize = DEFAULT_BLOCK,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const blockIndex = Math.floor(currentPage / blockSize);
  const start = blockIndex * blockSize;
  const end = Math.min(start + blockSize - 1, totalPages - 1);
  const pages: number[] = [];
  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  const goToBlock = (direction: -1 | 1) => {
    const next = start + direction * blockSize;
    if (next < 0 || next >= totalPages) return;
    onChange(next);
  };

  return (
    <div className="mt-8 flex items-center justify-center gap-2 text-sm text-slate-300">
      <button
        onClick={() => goToBlock(-1)}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 disabled:opacity-40"
        disabled={start === 0}
      >
        이전 블럭
      </button>
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onChange(page)}
          className={`min-w-[40px] rounded-xl border px-3 py-2 transition ${
            page === currentPage
              ? "border-sky-500 bg-sky-500 text-slate-950"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          }`}
        >
          {page + 1}
        </button>
      ))}
      <button
        onClick={() => goToBlock(1)}
        className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 transition hover:bg-white/10 disabled:opacity-40"
        disabled={end >= totalPages - 1}
      >
        다음 블럭
      </button>
    </div>
  );
}
