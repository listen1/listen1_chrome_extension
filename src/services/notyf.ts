import { Notyf } from 'notyf';

declare interface NotyfType extends Notyf {
  warning(msg: string, replace?: boolean): void;
  info(msg: string, replace?: boolean): void;
}
const notyf = new Notyf({
  duration: 5000,
  ripple: true,
  position: { x: 'center', y: 'top' },
  types: [
    {
      type: 'warning',
      background: 'darkorange',
      icon: false
    },
    {
      type: 'info',
      background: 'deepskyblue',
      icon: false
    }
  ]
}) as NotyfType;
notyf.warning = (msg, replace) => {
  if (replace) {
    notyf.dismissAll();
  }
  notyf.open({
    type: 'warning',
    message: msg
  });
};
notyf.info = (msg, replace) => {
  if (replace) {
    notyf.dismissAll();
  }
  notyf.open({
    type: 'info',
    message: msg
  });
};
export default notyf;
