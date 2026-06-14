export type SnippetVariables = {
  requesterName: string | null;
  subject: string | null;
};

function resolveSnippetVariable(
  field: string,
  vars: SnippetVariables,
): string {
  switch (field) {
    case "user.name":
      return vars.requesterName ?? "";
    case "subject":
    case "user.subject":
      return vars.subject ?? "";
    default:
      return "";
  }
}

export function applySnippetVariables(
  text: string,
  vars: SnippetVariables,
): string {
  const requester = vars.requesterName ?? "";
  const subject = vars.subject ?? "";

  return text
    .replaceAll("{{ ticket.user.name }}", requester)
    .replaceAll("{{ ticket.subject }}", subject)
    .replaceAll("{{ ticket.user.subject }}", subject);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getSnippetVariableField(node: Record<string, unknown>): string | null {
  const attrs = node.attrs;
  if (!isRecord(attrs)) {
    return null;
  }

  const variableType = attrs["data-snippet-variable-type"];
  if (!isRecord(variableType)) {
    return null;
  }

  const field = variableType.field;
  return typeof field === "string" ? field : null;
}

function proseMirrorNodeToText(
  node: unknown,
  vars: SnippetVariables,
): string {
  if (!isRecord(node)) {
    return "";
  }

  const type = node.type;
  const content = node.content;

  if (type === "text" && typeof node.text === "string") {
    return node.text;
  }

  if (type === "hard_break") {
    return "\n";
  }

  if (type === "snippet-variable") {
    const field = getSnippetVariableField(node);
    return field ? resolveSnippetVariable(field, vars) : "";
  }

  if (type === "html_block" && isRecord(node.attrs)) {
    const html = node.attrs.content;
    if (typeof html === "string") {
      return htmlToPlainText(applySnippetVariables(html, vars));
    }
  }

  if (Array.isArray(content)) {
    return content.map((child) => proseMirrorNodeToText(child, vars)).join("");
  }

  return "";
}

function proseMirrorDocToText(
  doc: Record<string, unknown>,
  vars: SnippetVariables,
): string {
  const content = doc.content;
  if (!Array.isArray(content)) {
    return "";
  }

  const parts = content.map((node) => {
    if (!isRecord(node)) {
      return "";
    }

    if (node.type === "paragraph") {
      return proseMirrorNodeToText(node, vars);
    }

    return proseMirrorNodeToText(node, vars);
  });

  return parts
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function htmlToPlainText(html: string): string {
  if (typeof document === "undefined") {
    return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/\s*(p|div|li|tr|h[1-6])\s*>/gi, "\n\n")
    .replace(/<\s*(p|div|li|tr|h[1-6])[^>]*>/gi, "");

  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  const text = doc.body.textContent ?? "";

  return text
    .replace(/\u00a0/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function parseSnippetContent(
  contentRaw: string,
  vars: SnippetVariables,
): string {
  let parsed: unknown;

  try {
    parsed = JSON.parse(contentRaw);
  } catch {
    return applySnippetVariables(contentRaw, vars);
  }

  if (!isRecord(parsed)) {
    return applySnippetVariables(contentRaw, vars);
  }

  const content = parsed.content;
  if (!Array.isArray(content)) {
    return applySnippetVariables(contentRaw, vars);
  }

  const htmlBlock = content.find(
    (node) => isRecord(node) && node.type === "html_block",
  );

  if (htmlBlock && isRecord(htmlBlock) && isRecord(htmlBlock.attrs)) {
    const html = htmlBlock.attrs.content;
    if (typeof html === "string") {
      return htmlToPlainText(applySnippetVariables(html, vars));
    }
  }

  return proseMirrorDocToText(parsed, vars);
}
