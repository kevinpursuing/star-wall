export default function Loading() {
  return (
    <div className="gallery-notice" role="status" aria-live="polite">
      <span className="curtain__seal" aria-hidden>
        萤
      </span>
      <span className="curtain__text">正在为你开灯</span>
    </div>
  );
}
