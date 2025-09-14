type Callback = (payload: any) => void;

class CallEventEmitter {
  private events: {[key: string]: Callback[]} = {};

  on(event: string, callback: Callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  off(event: string, callback: Callback) {
    if (!this.events[event]) return;
    this.events[event] = this.events[event].filter(cb => cb !== callback);
  }

  emit(event: string, payload: any) {
    if (!this.events[event]) return;
    this.events[event].forEach(cb => cb(payload));
  }
}

export default new CallEventEmitter();
