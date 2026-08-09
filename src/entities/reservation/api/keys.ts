export const reservationKeys = {
  all: ['reservations'] as const,
  mine: () => [...reservationKeys.all, 'mine'] as const,
};
