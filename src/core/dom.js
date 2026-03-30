/*
 * Tiny DOM write helpers.
 * These utilities keep common DOM mutations out of the feature modules and make
 * simple UI updates easier to test and stub.
 */
export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value ?? "--";
}
