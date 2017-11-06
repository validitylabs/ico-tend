/**
 * @title IcoCrowdsale
 * Simple time and capped based crowdsale.
 *
 * @version 1.0
 * @author Patrice Juergens <pj@validitylabs.org>
 */
pragma solidity ^0.4.18;

import "../../../node_modules/zeppelin-solidity/contracts/crowdsale/CappedCrowdsale.sol";
import "./IcoToken.sol";

contract IcoCrowdsale is CappedCrowdsale {

    /**
     * @dev Deploy capped ico crowdsale contract
     * @param _startTime uint256 Start time of the crowdsale
     * @param _endTime uint256 End time of the crowdsale
     * @param _rate uint256 Rate of crowdsale
     * @param _cap uint256 Cap of crowdsale
     * @param _wallet address Wallet address of the crowdsale
     */
    function IcoCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, uint256 _cap, address _wallet)
        public
        CappedCrowdsale(_cap)
        Crowdsale(_startTime, _endTime, _rate, _wallet)
    {

    }

    /**
     * @dev Create new instance of ico token contract
     */
    function createTokenContract() internal returns (MintableToken) {
        return new IcoToken();
    }
}
