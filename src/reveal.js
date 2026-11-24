// Leave content visible in the export and when motion is unavailable.
let observer;
export function revealWhenVisible(element) {
  if (
    !element ||
    typeof IntersectionObserver === "undefined" ||
    typeof element.animate !== "function" ||
    matchMedia("(prefers-reduced-motion: reduce)").matches
  )
    return;
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        observer.unobserve(entry.target);
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
          entry.target.animate(
            [
              { opacity: 0.35, transform: "translateY(20px)" },
              { opacity: 1, transform: "translateY(0)" },
            ],
            { duration: 540, easing: "cubic-bezier(.2,.7,.2,1)" },
          );
        }
      }
    },
    { threshold: 0.04 },
  );
  observer.observe(element);
  return () => observer.unobserve(element);
}
