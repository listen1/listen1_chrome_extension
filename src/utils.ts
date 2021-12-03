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

export function arrayMove(arr: any, old_index: number, new_index: number) {
  // https://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
  if (new_index >= arr.length) {
    let k = new_index - arr.length + 1;
    while (k > 0) {
      k -= 1;
      arr.push(undefined);
    }
  }
  arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
  return arr; // for testing
}
