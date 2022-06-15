export default {
  template: `
    <div class="modal-wrapper" v-if="modal">
      <div class="modal-backdrop"></div>
      <div class="modal">
        <div class="modal-header" v-if="modal.header" v-html="modal.header"></div>
        <div class="modal-body" v-if="modal.body" v-html="modal.body"></div>
        <div class="modal-footer">
          <input type="button" value="Отмена" @click="resultCancel">
          <input type="button" value="Ок" @click="resultOk">
        </div>
      </div>
    </div>
  `,
  props: {
    modals: {
      type: Array,
      required: true
    }
  },
  computed: {
    modal () {
      return this.modals[0];
    }
  },
  methods: {
    resultOk () {
      this.modal.resolve(true);
      this.close();
    },
    resultCancel () {
      this.modal.resolve(false);
      this.close();
    },
    close () {
      this.$emit('close');
    }
  }
}