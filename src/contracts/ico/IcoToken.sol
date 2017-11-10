/**
 * @title ICO token
 * @version 1.0
 * @author Patrice Juergens <pj@validitylabs.org>
 */
pragma solidity ^0.4.18;

import "../../../node_modules/zeppelin-solidity/contracts/token/MintableToken.sol";
import "../../../node_modules/zeppelin-solidity/contracts/token/PausableToken.sol";
import "./DividendToken.sol";

contract IcoToken is DividendToken, MintableToken, PausableToken {
    string public constant name = "Tend Token";
    string public constant symbol = "TND";
    uint8 public constant decimals = 18;

    // DividendToken public dividendToken;

    /**
     * @dev Constructor of IcoToken that instantiate a new DividendToken
     */
    function IcoToken() public DividendToken(msg.sender) {
        paused = true; // token should not be transferrable until after all tokens have been issued
    }
}
