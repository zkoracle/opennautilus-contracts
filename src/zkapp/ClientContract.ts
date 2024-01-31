import { Field, SmartContract, State, method, state } from 'o1js';

export class OracleClient extends SmartContract {
  @state(Field) req0 = State<Field>();
  @state(Field) req1 = State<Field>();
  @state(Field) req2 = State<Field>();
  @state(Field) req3 = State<Field>();

  // bytesToFields
  init() {
    super.init();
    this.req0.set(Field(0));
    this.req1.set(Field(1));
    this.req2.set(Field(2));
    this.req3.set(Field(3));
  }

  @method request(req0: Field, req1: Field, req2: Field, req3: Field) {
    const currentReq0 = this.req0.get();
    this.req0.requireEquals(currentReq0);
    // square.assertEquals(currentState.mul(current State));
    this.req0.set(req0);

    const currentReq1 = this.req1.get();
    this.req1.requireEquals(currentReq1);
    // square.assertEquals(currentState.mul(current State));
    this.req1.set(req1);

    const currentReq2 = this.req2.get();
    this.req2.requireEquals(currentReq2);
    // square.assertEquals(currentState.mul(current State));
    this.req2.set(req2);

    const currentReq3 = this.req3.get();
    this.req3.requireEquals(currentReq3);
    // square.assertEquals(currentState.mul(current State));
    this.req3.set(req3);
  }
}
