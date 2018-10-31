/**
 * @title ICO token
 * @version 1.0
 * @author Validity Labs AG <info@validitylabs.org>
 */
pragma solidity ^0.4.18;

import "../../../node_modules/zeppelin-solidity/contracts/token/ERC20/MintableToken.sol";
import "../../../node_modules/zeppelin-solidity/contracts/token/ERC20/PausableToken.sol";
import "./DividendToken.sol";

contract IcoToken is MintableToken, PausableToken, DividendToken {
    string public constant name = "Tend Token";
    string public constant symbol = "TND";
    uint8 public constant decimals = 18;

    /**
     * @dev Constructor of IcoToken that instantiate a new DividendToken
     */
    function IcoToken() public DividendToken() {
        // token should not be transferrable until after all tokens have been issued
        paused = true;
    }
}
