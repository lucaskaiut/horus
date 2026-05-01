/**
 * Exibe timestamps ISO em formato legível no fuso horário e locale do navegador.
 */
export function formatReceivedAtForDisplay(value: string | null | undefined): string {
  if (value == null || value === "") {
    return "—";
  }

  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(ms);
}
