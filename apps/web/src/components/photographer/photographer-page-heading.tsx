interface PhotographerPageHeadingProps {
  title: string;
  subtitle?: string;
}

export function PhotographerPageHeading({ title, subtitle }: PhotographerPageHeadingProps) {
  return (
    <div className="mb-6">
      <h1 className="font-jakarta text-2xl font-bold text-[--color-text-primary] md:text-3xl">
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-1 font-nunito text-sm text-[--color-text-secondary] md:text-base">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
