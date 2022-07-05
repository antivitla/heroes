export default {
  template: `
    <div class="modal-wrapper" v-if="modal">
      <div class="modal-backdrop"></div>
      <div class="modal" v-if="modal.type === 'input'">
        <div class="modal-header" v-if="modal.header" v-html="modal.header"></div>
        <div class="modal-body">
          <input type="text" v-model="inputModel" ref="modalInput">
        </div>
        <div class="modal-footer">
          <input type="button" value="Отмена" @click="resultCancel">
          <input type="button" value="Ок" @click="resultOk">
        </div>
      </div>
      <div class="modal" v-else>
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
  data () {
    return {
      inputModel: ''
    };
  },
  watch: {
    modal: {
      handler () {
        if (this.modal?.type === 'input') {
          requestAnimationFrame(() => {
            this.$refs.modalInput.focus();
          });
        }
      },
      deep: true
    }
  },
  computed: {
    modal () {
      return this.modals[0];
    }
  },
  methods: {
    resultOk () {
      if (this.modal.type === 'input') {
        this.modal.resolve(this.inputModel);
      } else {
        this.modal.resolve(true);
      }
      this.close();
    },
    resultCancel () {
      this.modal.resolve(false);
      this.close();
    },
    close () {
      this.inputModel = '';
      this.$emit('close');
    }
  }
}