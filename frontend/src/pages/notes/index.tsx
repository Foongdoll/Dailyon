
import {
  DndContext,
  PointerSensor,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { Loader2, Plus, Search, Settings2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDeferredValue, useEffect, useMemo, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type CategoryPayload,
} from "../../shared/api/noteCategoryApi";
import {
  createNote,
  deleteNote,
  fetchNotes,
  updateNote,
  updateNoteLayouts,
  type LayoutUpdatePayload,
  type NoteUpsertPayload,
} from "../../shared/api/noteApi";
import type { Note, NotePage } from "../../shared/types/note";
import CategoryManager from "./components/CategoryManager";
import NoteDialog from "./components/NoteDialog";
import Pagination from "./components/Pagination";
import { SortableNoteCard } from "./components/NoteCard";
import { useNavigate, useSearchParams } from "react-router-dom";

const PAGE_SIZE = 10;
const defaultLayoutForIndex = (index: number) => ({
  x: index % 3,
  y: Math.floor(index / 3),
  width: 1,
  height: 1,
});

export default function NotesIndex() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const parseCategoryParam = (value: string | null): number | null => {
    if (value == null) return null;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const parsePageParam = (value: string | null): number => {
    if (value == null) return 0;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 0 ? 0 : parsed;
  };

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(() =>
    parseCategoryParam(searchParams.get("cat"))
  );
  const [page, setPage] = useState(() => parsePageParam(searchParams.get("page")));
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const deferredSearch = useDeferredValue(search);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [boardNotes, setBoardNotes] = useState<Note[]>([]);

  const categoriesQuery = useQuery({
    queryKey: ["noteCategories"],
    queryFn: fetchCategories,
  });

  useEffect(() => {
    if (!categoriesQuery.data?.length) return;
    if (selectedCategoryId == null) {
      setSelectedCategoryId(categoriesQuery.data[0].id);
      setPage(0);
    } else if (!categoriesQuery.data.some((cat) => cat.id === selectedCategoryId)) {
      setSelectedCategoryId(categoriesQuery.data[0].id);
      setPage(0);
    }
  }, [categoriesQuery.data, selectedCategoryId]);

  const notesQuery = useQuery<NotePage>({
    queryKey: ["notes", selectedCategoryId, page, deferredSearch],
    enabled: selectedCategoryId != null,
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      fetchNotes({
        categoryId: selectedCategoryId!,
        page,
        size: PAGE_SIZE,
        keyword: deferredSearch,
      }),
  });

  useEffect(() => {
    if (notesQuery.data?.notes) {
      setBoardNotes(notesQuery.data.notes);
    }
  }, [notesQuery.data]);

  const searchParamsString = searchParams.toString();

  useEffect(() => {
    const existingCategory = parseCategoryParam(searchParams.get("cat"));
    if (existingCategory !== selectedCategoryId) {
      setSelectedCategoryId(existingCategory);
    }
    const existingPage = parsePageParam(searchParams.get("page"));
    if (existingPage !== page) {
      setPage(existingPage);
    }
    const existingSearch = searchParams.get("q") ?? "";
    if (existingSearch !== search) {
      setSearch(existingSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParamsString]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParamsString);
    if (selectedCategoryId != null) {
      nextParams.set("cat", String(selectedCategoryId));
    } else {
      nextParams.delete("cat");
    }
    nextParams.set("page", String(page));
    if (search) {
      nextParams.set("q", search);
    } else {
      nextParams.delete("q");
    }

    const nextString = nextParams.toString();
    if (nextString !== searchParamsString) {
      setSearchParams(nextParams, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategoryId, page, search, searchParamsString]);

  const layoutMutation = useMutation({
    mutationFn: (payload: LayoutUpdatePayload[]) => updateNoteLayouts(payload),
    onError: () => toast.error("레이아웃 저장에 실패했습니다."),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", selectedCategoryId] });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (payload: NoteUpsertPayload) => createNote(payload),
    onSuccess: () => {
      toast.success("노트가 저장되었습니다.");
      queryClient.invalidateQueries({ queryKey: ["notes", selectedCategoryId] });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: NoteUpsertPayload }) =>
      updateNote(id, payload),
    onSuccess: () => {
      toast.success("노트를 수정했습니다.");
      queryClient.invalidateQueries({ queryKey: ["notes", selectedCategoryId] });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: number) => deleteNote(id),
    onSuccess: () => {
      toast.success("노트를 삭제했습니다.");
      queryClient.invalidateQueries({ queryKey: ["notes", selectedCategoryId] });
    },
  });



  const handleCategoryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const { value } = event.target;
    if (value === "") {
      setSelectedCategoryId(null);
    } else {
      const parsed = Number.parseInt(value, 10);
      setSelectedCategoryId(Number.isNaN(parsed) ? null : parsed);
    }
    setPage(0);
  };

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearch(event.target.value);
    setPage(0);
  };

  const createCategoryMutation = useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      toast.success("카테고리를 추가했습니다.");
      queryClient.invalidateQueries({ queryKey: ["noteCategories"] });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CategoryPayload }) =>
      updateCategory(id, payload),
    onSuccess: () => {
      toast.success("카테고리를 수정했습니다.");
      queryClient.invalidateQueries({ queryKey: ["noteCategories"] });
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: () => {
      toast.success("카테고리를 삭제했습니다.");
      queryClient.invalidateQueries({ queryKey: ["noteCategories"] });
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const currentIndex = boardNotes.findIndex((note) => note.id === Number(active.id));
    const newIndex = boardNotes.findIndex((note) => note.id === Number(over.id));
    if (currentIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(boardNotes, currentIndex, newIndex);
    setBoardNotes(reordered);
    const payload = reordered.map((note, index) => ({
      noteId: note.id,
      position: reordered.length - index,
      layout: note.layout ?? defaultLayoutForIndex(index),
    }));
    layoutMutation.mutate(payload);
  };

  const handleSaveNote = async (payload: NoteUpsertPayload, noteId?: number) => {
    if (noteId) {
      await updateNoteMutation.mutateAsync({ id: noteId, payload });
    } else {
      await createNoteMutation.mutateAsync(payload);
      setPage(0);
    }
  };

  const handleDeleteNote = (note: Note) => {
    if (!confirm(`"${note.title}" 노트를 삭제할까요?`)) return;
    deleteNoteMutation.mutate(note.id);
  };

  const handleDetail = (note: Note) => {
    navigate(`/notes/detail/${note.id}`, {
      state: {
        categoryFields: selectedCategory?.fields ?? [],
        categoryId: selectedCategoryId,
        page,
        search,
      },
      preventScrollReset: true,
    });
  }

  const selectedCategory = useMemo(
    () => categoriesQuery.data?.find((category) => category.id === selectedCategoryId),
    [categoriesQuery.data, selectedCategoryId]
  );

  const totalPages = notesQuery.data?.totalPages ?? 0;
  const isLoading =
    categoriesQuery.isLoading || notesQuery.isLoading || notesQuery.isRefetching;

  return (
    <section className="min-h-full bg-gradient-to-br from-slate-950 via-slate-950/95 to-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg shadow-slate-950/40 backdrop-blur">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-white">나의 노트</h1>
            <p className="text-sm text-slate-400">
              카테고리별 맞춤 필드를 정의하고, 원하는 순서로 배치해 보세요.
            </p>
          </div>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm shadow-inner shadow-black/30 transition focus-within:border-sky-400/60 focus-within:bg-slate-900/80">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={handleSearchChange}
                type="search"
                placeholder="제목, 내용, 필드 값으로 검색"
                className="w-full bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
            </div>
            <div className="flex flex-1 items-center gap-3">
              <select
                value={selectedCategoryId ?? ""}
                onChange={handleCategoryChange}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none"
              >
                <option className="text-black" value="">- 선택 -</option>
                {categoriesQuery.data?.map((category) => (
                  <option className="text-black" key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setCategoryModalOpen(true)}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200 transition hover:border-sky-400/60 hover:text-sky-200"
              >
                <Settings2 className="h-4 w-4" />
                카테고리 설정
              </button>
            </div>
            <button
              onClick={() => {
                setEditingNote(null);
                setNoteModalOpen(true);
              }}
              disabled={!selectedCategory}
              className="flex items-center gap-2 rounded-2xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              새 노트 작성
            </button>
          </div>
        </header>

        {selectedCategory ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-5 text-sm text-slate-300 shadow-inner shadow-black/30">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">선택한 카테고리</p>
                <p className="text-base font-semibold text-white">{selectedCategory.name}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="rounded-full border border-white/10 px-3 py-1">
                  필드 {selectedCategory.fields.length}개
                </span>
                {selectedCategory.description ? (
                  <span className="max-w-[360px] truncate text-slate-400">
                    {selectedCategory.description}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {isLoading ? (
          <div className="flex min-h-[240px] items-center justify-center text-slate-400">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            데이터를 불러오는 중입니다...
          </div>
        ) : boardNotes.length === 0 ? (
          <div className="flex min-h-[240px] flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 bg-white/5 p-12 text-center text-sm text-slate-400">
            <p>아직 노트가 없습니다. 카테고리를 선택하고 새 노트를 작성해보세요.</p>
            <button
              onClick={() => {
                setEditingNote(null);
                setNoteModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              <Plus className="h-4 w-4" />
              노트 만들기
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={boardNotes.map((note) => note.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
                {boardNotes.map((note, index) => (
                  <SortableNoteCard
                    key={note.id}
                    note={{ ...note, layout: note.layout ?? defaultLayoutForIndex(index) }}
                    fields={selectedCategory?.fields ?? []}
                    onEdit={(target) => {
                      setEditingNote(target);
                      setNoteModalOpen(true);
                    }}
                    onDelete={handleDeleteNote}
                    onDetail={handleDetail}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <Pagination currentPage={page} totalPages={totalPages} onChange={setPage} />
      </div>

      <CategoryManager
        open={categoryModalOpen}
        categories={categoriesQuery.data ?? []}
        onClose={() => setCategoryModalOpen(false)}
        onCreate={(payload) => createCategoryMutation.mutateAsync(payload)}
        onUpdate={(id, payload) => updateCategoryMutation.mutateAsync({ id, payload })}
        onDelete={(id) => deleteCategoryMutation.mutateAsync(id)}
      />

      <NoteDialog
        open={noteModalOpen}
        category={selectedCategory}
        note={editingNote}
        onClose={() => setNoteModalOpen(false)}
        onSubmit={handleSaveNote}
      />
    </section>
  );
}
