/** The centred orange eyebrow used above every light section. */
export default function MiniHeader({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={`mini-header ${className}`}>
      <h2>{children}</h2>
    </div>
  );
}
