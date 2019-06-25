pragma solidity ^0.4.17;

contract Lottery {
    address public manager;
    address[] public players;
    
    function Lottery() public {
        manager = msg.sender;
        // msg.sender is a global variable that has the address of the owner of the contract. This way we can create the contract without having the owner passing it to the function as an argument, explicitly.
        
    }
    
    function enter() public payable {
        //msg is a global variable that has all of the data in the transaction.
        // We can get msg.data, msg.gas, msg.sender and msg.value
        require(msg.value > .01 ether);
        players.push(msg.sender);
    }
    
    function returnPlayers() public view returns(address[]){
        // The function is public because we want anyone to be able to call it
        // The function is view because it won't attempt to write into the contract
        // We use the returns keyword because we need the function to return an array with addresses
        return players;
    }
    
    function random() private view returns (uint) {
        return uint(keccak256(block.difficulty, now, players)); //sha3, block, now are a global variable such as msg that doesn't need import anything
    }
    
    //The next function can only be called by the manager and that is why we use the 'require'
    function pickWinner() public restricted {
        uint index = random() % players.length;
        //the players array is an array of addresses. The variable type address has several methods associated with it, including transfer.
        // 'this' refers to the contract
        players[index].transfer(this.balance);
        //The following creates a new dynamic players array of the type address with an initial size of 0
        players = new address[](0);
    }
    
    modifier restricted() {
        // Here we are making sure that the address from which the message in 'pickWinner' is sent is the manager variable (which is an address) 
        require(msg.sender == manager);
        //The code of all the functions declared with the name of this function (restricted) are going to replace the "_"
        _;
    }
}