interface SectionHeadingProps {
  eyebrow: string;
  title: string;
  description?: string;
  level?: "h1" | "h2";
}

export function SectionHeading({ eyebrow, title, description, level = "h2" }: SectionHeadingProps) {
  return (
    <div className="max-w-3xl">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#19d3ff]">{eyebrow}</p>
      {level === "h1" ? <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1> : <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h2>}
      {description ? <p className="mt-4 text-base leading-7 text-slate-400">{description}</p> : null}
    </div>
  );
}
