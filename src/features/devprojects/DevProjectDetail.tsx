import { useState } from "react";
import { useDevProjectDetail } from "./useDevProjects";
import type { DevProject } from "./useDevProjects";

interface DevProjectDetailProps {
  project: DevProject;
  onBack: () => void;
  onUpdateStatus: (
    id: string,
    input: Partial<Omit<DevProject, "id" | "user_id">>,
  ) => Promise<{ error: string | null }>;
}

type Tab = "log" | "todo" | "issue";

export default function DevProjectDetail({
  project,
  onBack,
  onUpdateStatus,
}: DevProjectDetailProps) {
  const {
    logs,
    todos,
    issues,
    loading,
    addLog,
    deleteLog,
    addTodo,
    toggleTodo,
    deleteTodo,
    addIssue,
    resolveIssue,
    deleteIssue,
  } = useDevProjectDetail(project.id);

  const [tab, setTab] = useState<Tab>("log");
  const [logInput, setLogInput] = useState("");
  const [todoInput, setTodoInput] = useState("");
  const [issueInput, setIssueInput] = useState("");
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [solusiInput, setSolusiInput] = useState("");

  const inputClass =
    "flex-1 px-3 py-2 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg text-sm";

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
      >
        ← Semua Project
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {project.nama}
          </h1>
          {project.riset_kebutuhan && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {project.riset_kebutuhan}
            </p>
          )}
        </div>
        <select
          value={project.status}
          onChange={(e) =>
            onUpdateStatus(project.id, {
              status: e.target.value as DevProject["status"],
            })
          }
          className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-700 dark:bg-gray-900 dark:text-white rounded-lg"
        >
          <option value="Aktif">Aktif</option>
          <option value="Selesai">Selesai</option>
          <option value="Ditunda">Ditunda</option>
        </select>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {(["log", "todo", "issue"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3 py-2 text-sm font-medium border-b-2 whitespace-nowrap shrink-0 ${tab === t ? "border-gray-900 dark:border-white text-gray-900 dark:text-white" : "border-transparent text-gray-400"}`}
          >
            {t === "log"
              ? "Log Harian"
              : t === "todo"
                ? `To-Do (${todos.filter((t) => !t.is_done).length})`
                : `Masalah (${issues.filter((i) => i.status === "Open").length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-400 text-sm py-8 text-center">Memuat...</p>
      ) : (
        <>
          {tab === "log" && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Hari ini ngapain?"
                  value={logInput}
                  onChange={(e) => setLogInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && logInput) {
                      addLog(logInput, new Date().toISOString().split("T")[0]);
                      setLogInput("");
                    }
                  }}
                  className={inputClass}
                />
                <button
                  onClick={() => {
                    if (logInput) {
                      addLog(logInput, new Date().toISOString().split("T")[0]);
                      setLogInput("");
                    }
                  }}
                  className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-4 rounded-lg text-sm"
                >
                  +
                </button>
              </div>
              {logs.map((l) => (
                <div
                  key={l.id}
                  className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex justify-between items-start"
                >
                  <div>
                    <p className="text-xs text-gray-400">
                      {new Date(l.tanggal).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                      })}
                    </p>
                    <p className="text-sm text-gray-900 dark:text-white">
                      {l.catatan}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteLog(l.id)}
                    className="text-xs text-red-500"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              {logs.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  Belum ada log.
                </p>
              )}
            </div>
          )}

          {tab === "todo" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Tambah to-do..."
                  value={todoInput}
                  onChange={(e) => setTodoInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && todoInput) {
                      addTodo(todoInput);
                      setTodoInput("");
                    }
                  }}
                  className={inputClass}
                />
                <button
                  onClick={() => {
                    if (todoInput) {
                      addTodo(todoInput);
                      setTodoInput("");
                    }
                  }}
                  className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-4 rounded-lg text-sm"
                >
                  +
                </button>
              </div>
              {todos.map((t) => (
                <div
                  key={t.id}
                  className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center gap-3"
                >
                  <input
                    type="checkbox"
                    checked={t.is_done}
                    onChange={() => toggleTodo(t)}
                    className="w-4 h-4"
                  />
                  <span
                    className={`flex-1 text-sm ${t.is_done ? "line-through text-gray-400" : "text-gray-900 dark:text-white"}`}
                  >
                    {t.judul}
                  </span>
                  <button
                    onClick={() => deleteTodo(t.id)}
                    className="text-xs text-red-500"
                  >
                    Hapus
                  </button>
                </div>
              ))}
              {todos.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  Belum ada to-do.
                </p>
              )}
            </div>
          )}

          {tab === "issue" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Masalah yang ditemui..."
                  value={issueInput}
                  onChange={(e) => setIssueInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && issueInput) {
                      addIssue(issueInput);
                      setIssueInput("");
                    }
                  }}
                  className={inputClass}
                />
                <button
                  onClick={() => {
                    if (issueInput) {
                      addIssue(issueInput);
                      setIssueInput("");
                    }
                  }}
                  className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-4 rounded-lg text-sm"
                >
                  +
                </button>
              </div>
              {issues.map((i) => (
                <div
                  key={i.id}
                  className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${i.status === "Open" ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-300" : "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-300"}`}
                      >
                        {i.status}
                      </span>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {i.masalah}
                      </p>
                      {i.solusi && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          💡 {i.solusi}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteIssue(i.id)}
                      className="text-xs text-red-500 shrink-0 ml-2"
                    >
                      Hapus
                    </button>
                  </div>
                  {i.status === "Open" &&
                    (resolvingId === i.id ? (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="text"
                          placeholder="Solusinya apa?"
                          value={solusiInput}
                          onChange={(e) => setSolusiInput(e.target.value)}
                          className={inputClass}
                        />
                        <button
                          onClick={() => {
                            resolveIssue(i.id, solusiInput);
                            setResolvingId(null);
                            setSolusiInput("");
                          }}
                          className="bg-gray-900 dark:bg-white dark:text-gray-900 text-white px-3 rounded-lg text-xs"
                        >
                          Simpan
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingId(i.id)}
                        className="text-xs text-blue-500 hover:underline mt-2"
                      >
                        Tandai selesai + isi solusi
                      </button>
                    ))}
                </div>
              ))}
              {issues.length === 0 && (
                <p className="text-gray-400 text-sm text-center py-4">
                  Belum ada masalah tercatat.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
