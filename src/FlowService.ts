import * as fcl from "@onflow/fcl";
import { ec as EC } from "elliptic";
import { SHA3 } from "sha3";

const ec: EC = new EC("p256");

export interface TransactionProps {
  transaction: any;
  args: any;
  proposer: any;
  authorizations: any;
  payer: any;
  gasLimit: any;
}

class FlowService {
  constructor(
    private readonly minterFlowAddress: string,
    private readonly minterPrivateKeyHex: string,
    private readonly minterAccountIndex: string | number
  ) {}

  authz = () => {
    return async (account: any = {}) => {
      const user = await this.getAccount(this.minterFlowAddress);
      const key = user.keys[this.minterAccountIndex];

      const sign = this.signWithKey;
      const pk = this.minterPrivateKeyHex;

      return {
        ...account,
        tempId: `${user.address}-${key.index}`,
        addr: fcl.sansPrefix(user.address),
        keyId: Number(key.index),
        signingFunction: (signable: any) => {
          return {
            addr: fcl.withPrefix(user.address),
            keyId: Number(key.index),
            signature: sign(pk, signable.message),
          };
        },
      };
    };
  };

  getAccount = async (addr: string) => {
    const { account } = await fcl.send([fcl.getAccount(addr)]);
    return account;
  };

  private signWithKey = (privateKey: string, msg: string) => {
    const key = ec.keyFromPrivate(Buffer.from(privateKey, "hex"));
    const sig = key.sign(this.hashMsg(msg));
    const n = 32;
    const r = sig.r.toArrayLike(Buffer, "be", n);
    const s = sig.s.toArrayLike(Buffer, "be", n);
    return Buffer.concat([r, s]).toString("hex");
  };

  private hashMsg = (msg: string) => {
    const sha = new SHA3(256);
    sha.update(Buffer.from(msg, "hex"));
    return sha.digest();
  };

  sendTx = async (props: TransactionProps): Promise<any> => {
    const response = await fcl.send([
      fcl.transaction`
        ${props.transaction}
      `,
      fcl.args(props.args),
      fcl.proposer(props.proposer),
      fcl.authorizations(props.authorizations),
      fcl.payer(props.payer),
      fcl.limit(props.gasLimit),
    ]);
    return await fcl.tx(response).onceSealed();
  };

  // async executeScript<T>({ script, args }): Promise<T> {
  //   const response = await fcl.send([fcl.script`${script}`, fcl.args(args)]);
  //   return await fcl.decode(response);
  // }
}

export { FlowService };
