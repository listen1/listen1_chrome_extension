export function setPrototypeOfLocalStorage() {
  const proto = Object.getPrototypeOf(localStorage);
  proto.getObject = function getObject(key: any) {
    const value = this.getItem(key);
    return value && JSON.parse(value);
  };
  proto.setObject = function setObject(key: any, value: any) {
    this.setItem(key, JSON.stringify(value));
  };
  Object.setPrototypeOf(localStorage, proto);
}
