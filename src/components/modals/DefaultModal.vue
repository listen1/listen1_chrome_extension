<template>
  <div class="modal-mask">
    <div class="modal-wrapper" @click.self="$parent?.$emit('close')">
      <div class="modal-container">
        <div class="modal-header">
          <div class="modal-header-slot">
            <slot name="header">default header</slot>
          </div>
          <span class="modal-close" @click="$parent?.$emit('close')">×</span>
        </div>

        <div class="modal-body">
          <slot name="body">default body</slot>
        </div>

        <div class="modal-footer">
          <slot name="footer">
            default footer
            <button class="modal-default-button" @click="$parent?.$emit('close')">OK</button>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: table;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

.modal-container {
  width: 400px;
  height: 500px;
  margin: 0px auto;
  padding: 20px 30px;
  background-color: var(--dialog-background-color);
  color: var(--dialog-text-color);
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
  font-family: Helvetica, Arial, sans-serif;
}

.modal-header {
  font-size: 15px;
  font-weight: bold;
  text-align: left;
  display: flex;
}

.modal-header-slot {
  width: 380px;
}

.modal-close {
  font-size: 26px;
  cursor: pointer;
  width: 20px;
}

.modal-body {
  padding: 0 20px;
  height: 370px;
  overflow-y: auto;
  background-color: var(--dialog-background-color);
}

.modal-body input {
  width: 100%;
  font-size: larger;
}

.modal-footer {
  display: flex;
  justify-content: space-evenly;
  margin-top: 1rem;
}

.modal-default-button {
  display: block;
}
</style>