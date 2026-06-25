export function cardMotionInitial(reduceMotion: boolean | null, y: number) {
  return reduceMotion ? false : { opacity: 0, y };
}

export function cardMotionTransition(delay: number) {
  return { duration: 0.16, ease: "easeOut" as const, delay };
}
