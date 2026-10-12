const KEY_PREFIX = 'worksphere:birthday-wish:';

const keyFor = (employeeId: string, date: string) => `${KEY_PREFIX}${employeeId}:${date}`;

export const isBirthdayWishSeen = (employeeId: string, date: string) =>
  sessionStorage.getItem(keyFor(employeeId, date)) === '1';

export const markBirthdayWishSeen = (employeeId: string, date: string) =>
  sessionStorage.setItem(keyFor(employeeId, date), '1');

/** Called on logout so the wish pops up again on the next login. */
export const clearBirthdayWishSeen = () => {
  Object.keys(sessionStorage)
    .filter((key) => key.startsWith(KEY_PREFIX))
    .forEach((key) => sessionStorage.removeItem(key));
};
