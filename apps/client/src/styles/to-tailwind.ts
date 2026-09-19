type StyleValue = Record<string, unknown> | Array<unknown> | null | false | undefined;

const spacing = (key: string, value: unknown) => {
  if (typeof value !== "number" && typeof value !== "string") return "";
  const v = typeof value === "number" ? `${value}px` : value;
  return `${key}-[${String(v).replaceAll(" ", "_")}]`;
};

function convert(style: Record<string, unknown>): string[] {
  const classes: string[] = [];
  for (const [key, value] of Object.entries(style)) {
    if (value == null || value === false || typeof value === "function") continue;
    if (key === "flex" && value === 1) classes.push("flex-1");
    else if (key === "flexDirection") classes.push(value === "row" ? "flex-row" : "flex-col");
    else if (key === "alignItems") classes.push(`items-${value === "center" ? "center" : value === "flex-end" ? "end" : value === "flex-start" ? "start" : value}`);
    else if (key === "justifyContent") classes.push(`justify-${value === "space-between" ? "between" : value === "flex-end" ? "end" : value === "flex-start" ? "start" : value}`);
    else if (key === "position" || key === "overflow" || key === "display" || key === "textAlign") classes.push(String(value) === "flex" ? "flex" : `${key === "textAlign" ? "text" : key}-${String(value)}`);
    else if (key === "padding") classes.push(spacing("p", value));
    else if (key === "paddingTop") classes.push(spacing("pt", value));
    else if (key === "paddingRight") classes.push(spacing("pr", value));
    else if (key === "paddingBottom") classes.push(spacing("pb", value));
    else if (key === "paddingLeft") classes.push(spacing("pl", value));
    else if (key === "margin") classes.push(spacing("m", value));
    else if (key === "marginTop") classes.push(spacing("mt", value));
    else if (key === "marginRight") classes.push(spacing("mr", value));
    else if (key === "marginBottom") classes.push(spacing("mb", value));
    else if (key === "marginLeft") classes.push(spacing("ml", value));
    else if (key === "gap") classes.push(spacing("gap", value));
    else if (key === "width") classes.push(spacing("w", value));
    else if (key === "height") classes.push(spacing("h", value));
    else if (key === "maxWidth") classes.push(spacing("max-w", value));
    else if (key === "maxHeight") classes.push(spacing("max-h", value));
    else if (key === "minHeight") classes.push(spacing("min-h", value));
    else if (key === "borderRadius") classes.push(spacing("rounded", value));
    else if (key === "fontSize") classes.push(spacing("text", value));
    else if (key === "lineHeight") classes.push(spacing("leading", value));
    else if (key === "fontWeight") classes.push(`font-${value === "600" || value === 600 ? "semibold" : value === "700" || value === 700 ? "bold" : "normal"}`);
    else if (key === "opacity") classes.push(spacing("opacity", value));
    else if (key === "backgroundColor") classes.push(`bg-[${String(value).replaceAll(" ", "_")}]`);
    else if (key === "color") classes.push(`text-[${String(value).replaceAll(" ", "_")}]`);
    else if (key === "borderColor") classes.push(`border-[${String(value).replaceAll(" ", "_")}]`);
    else if (key === "borderWidth") classes.push(`border-[${String(value).replaceAll(" ", "_")}]`);
    else if (key === "zIndex") classes.push(`z-[${String(value)}]`);
  }
  return classes.filter(Boolean);
}

export function toTailwind(style: StyleValue): string {
  const values = Array.isArray(style) ? style : [style];
  return values.flatMap((value) => typeof value === "function" ? [] : value && typeof value === "object" ? convert(value as Record<string, unknown>) : []).join(" ");
}
