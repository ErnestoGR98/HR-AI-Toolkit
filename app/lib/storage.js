// ─── Server-backed history for HR Toolkit ───
// Persists generated artifacts (job descriptions, interviews, analyses) to a
// JSON file on the server's disk (data/history.json) via the /api/history
// route. Survives browser-cache clears, unlike localStorage.

export async function getHistory() {
  try {
    const res = await fetch("/api/history");
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

export async function saveItem(item) {
  const res = await fetch("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error("No se pudo guardar en el historial");
  const data = await res.json();
  return data.item;
}

export async function deleteItem(id) {
  const res = await fetch("/api/history", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error("No se pudo borrar del historial");
  const data = await res.json();
  return data.items;
}

export async function clearHistory() {
  const res = await fetch("/api/history", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ all: true }),
  });
  if (!res.ok) throw new Error("No se pudo limpiar el historial");
}
