export function setPrototypeOfLocalStorage(): void {
  const proto = Object.getPrototypeOf(localStorage);
  proto.getObject = function getObject(key: string) {
    const value = this.getItem(key);
    return value && JSON.parse(value);
  };
  proto.setObject = function setObject(key: string, value: unknown) {
    this.setItem(key, JSON.stringify(value));
  };
  Object.setPrototypeOf(localStorage, proto);
}
