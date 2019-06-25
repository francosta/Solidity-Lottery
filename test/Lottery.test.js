const assert = require("assert");
const ganache = require("ganache-cli");
const Web3 = require("web3"); //Class
const provider = ganache.provider();
const OPTIONS = {
  defaultBlock: "latest",
  transactionConfirmationBlocks: 1,
  transactionBlockTimeout: 5
};
const web3 = new Web3(provider, null, OPTIONS); // Instance of web3 that we are connecting to the ganache test network.
const { interface, bytecode } = require("../compile");

let lottery;
let accounts;

beforeEach(async function() {
  accounts = await web3.eth.getAccounts();

  lottery = await new web3.eth.Contract(JSON.parse(interface))
    .deploy({ data: bytecode })
    .send({ from: accounts[0], gas: "1000000" });
});

describe("Lottery Contract", async function() {
  it("deploys a contract", () => {
    assert.ok(lottery.options.address);
  });

  it("allows one account to enter", async function() {
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether")
    });

    const players = await lottery.methods.returnPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(1, players.length);
  });

  it("allows multiple accounts to enter", async function() {
    this.timeout(40000);
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("0.02", "ether")
    });
    await lottery.methods.enter().send({
      from: accounts[1],
      value: web3.utils.toWei("0.02", "ether")
    });
    await lottery.methods.enter().send({
      from: accounts[2],
      value: web3.utils.toWei("0.02", "ether")
    });

    const players = await lottery.methods.returnPlayers().call({
      from: accounts[0]
    });

    assert.equal(accounts[0], players[0]);
    assert.equal(accounts[1], players[1]);
    assert.equal(accounts[2], players[2]);
    assert.equal(3, players.length);
  });

  it("requires a minimum amount of ether to enter", async function() {
    // As we want to throw an error here, we use the try/catch functionality.
    // We run the method we want to throw an error within 'try'
    try {
      await lottery.methods.enter().send({
        from: accounts[0],
        value: 0
      });
      // If the error is not thrown, we 'assert(false)'. If there is an error, the code goes to the 'catch'.
      assert(false);
      // the catch is always initialized with the error.
    } catch (err) {
      assert(err);
    }
  });

  it("only the manager can pick a winner", async function() {
    //We only have to check for the restricted function
    try {
      await lottery.methods.pickWinner().send({
        from: accounts[1]
      });
      assert(false);
    } catch (err) {
      assert(err);
    }
  });

  it("sends money to the winner and resets the players array", async function() {
    this.timeout(40000);
    // Enter one player to the lottery
    await lottery.methods.enter().send({
      from: accounts[0],
      value: web3.utils.toWei("2", "ether")
    });

    // At this point, we have already sent 2 ether from account 0, so the balance should be less 2 ether.
    const initialBalance = await web3.eth.getBalance(accounts[0]);

    // When we call 'pickWinner' account[0] should get the money back
    await lottery.methods.pickWinner().send({ from: accounts[0] });
  });

  // The final balance will have to be more or less the same as the initial balance at this point (minus the gas paid for the transactions.)
  const finalBalance = await web3.eth.getBalance(accounts[0]);

  // We will test if the difference between the two balances is close but lower to 2 ether to account for gas.
  const difference = finalBalance - initialBalance;
  assert(difference > web3.utils.toWei("1.8", "ether"));

  const players = lottery.methods.returnPlayers();
  assert.equal(0, players.length);
});
