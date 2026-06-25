export const motionAnimate = { opacity: 1, y: 0 };

export function motionInitial(reduceMotion: boolean | null, y: number) {
  return reduceMotion ? false : { opacity: 0, y };
}

export function motionTransition(delay: number) {
  return { duration: 0.18, ease: "easeOut" as const, delay };
}

export const reactionTransition = { duration: 0.46, ease: "easeOut" as const };

export function reactionTap(reduceMotion: boolean | null) {
  return reduceMotion ? undefined : { scale: 0.82, rotate: -4 };
}

export function reactionBurst(active: boolean, reduceMotion: boolean | null) {
  if (reduceMotion || !active) return { scale: 1, rotate: 0 };
  return { scale: [1, 0.82, 1.18, 0.96, 1.04, 1], rotate: [0, -7, 7, -4, 3, 0] };
}

export function replayReaction(setBurst: (value: boolean) => void) {
  setBurst(false);
  window.requestAnimationFrame(() => setBurst(true));
}
