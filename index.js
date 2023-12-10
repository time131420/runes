const neonJs = require("@cityofzion/neon-js");
require("dotenv").config();

var count = 0; // 记录初始值
var MAX_COUNT = 99; // 最大成功次数

// 钱包信息
const privateKey = process.env.PRIVATEKEY;
const sender = process.env.WALLET;
const account = new neonJs.wallet.Account(privateKey);

// 脚本数据
const data = `data:,{"p":"nrc-20","op":"mint","tick":"neos","amt":"500"}`;
const builder = new neonJs.sc.ScriptBuilder();
builder.emitBytes(neonJs.u.str2ab(data));

const addressToHash = (address) => {
  const BASE58CHARS =
    "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  return `0x${[
    ...[...address]
      .map((c) => BASE58CHARS.indexOf(c))
      .reduce(
        (acc, i) =>
          acc.map((j) => {
            const x = j * 58 + i;
            i = x >> 8;
            return x;
          }),
        new Uint8Array(25)
      ),
  ]
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("")
    .slice(8, 48)}`;
};

async function sendRawTransaction() {
  try {
    const rpcClient = new neonJs.rpc.RPCClient(
      "https://n3seed2.ngd.network:10332/"
    );

    const lastSeenHeight = await rpcClient.getBlockCount();
    const transaction = new neonJs.tx.Transaction({
      version: 0,
      systemFee: 9975,
      networkFee: 122862,
      validUntilBlock: lastSeenHeight + 1000,
      attributes: [],
      signers: [
        {
          account: addressToHash(sender),
          scopes: 1,
        },
      ],
      script: builder.str,
    });

    transaction.sign(account.privateKey);
    rpcClient.sendRawTransaction(transaction).then((response) => {
      console.log(`发送成功次数: ${count}, 交易hash: ${response}`);
      count++;
    });
  } catch (error) {
    console.log(`发送交易失败: ${error.message}`);
  } finally {
    let time = setTimeout(sendRawTransaction, 3000);
    if (count === MAX_COUNT) {
      clearTimeout(time);
    }
  }
}

sendRawTransaction();
