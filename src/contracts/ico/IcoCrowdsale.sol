/**
 * @title IcoCrowdsale
 * Simple time and capped based crowdsale.
 *
 * @version 1.0
 * @author Patrice Juergens <pj@validitylabs.org>
 */
pragma solidity ^0.4.18;

import "../../../node_modules/zeppelin-solidity/contracts/crowdsale/Crowdsale.sol";
import "../../../node_modules/zeppelin-solidity/contracts/ownership/Ownable.sol";
import "./IcoToken.sol";

contract IcoCrowdsale is Crowdsale, Ownable {

    // allow managers to whitelist and confirm contributions by manager accounts
    // (managers can be set and altered by owner, multiple manager accounts are possible
    mapping(address => bool) public isManager;

    // true if address is allowed to invest
    mapping(address => bool) public isWhitelisted;

    event ChangedInvestorWhitelisting(address investor, bool whitelisted);



    event ChangedManager(address manager, bool active);

    /**
     * @dev Deploy capped ico crowdsale contract
     * @param _startTime uint256 Start time of the crowdsale
     * @param _endTime uint256 End time of the crowdsale
     * @param _rate uint256 Rate of crowdsale
     * @param _wallet address Wallet address of the crowdsale
     */
    function IcoCrowdsale(uint256 _startTime, uint256 _endTime, uint256 _rate, address _wallet)
        public
        Crowdsale(_startTime, _endTime, _rate, _wallet)
    {
        setManager(msg.sender, true);
    }

    /**
     * @dev Create new instance of ico token contract
     */
    function createTokenContract() internal returns (MintableToken) {
        return new IcoToken();
    }

    /**
     * @dev Set / alter manager / whitelister "account". This can be done from owner only
     * @param manager address address of the manager to create/alter
     * @param active bool flag that shows if the manager account is active
     */
    function setManager(address manager, bool active) public onlyOwner {
        isManager[manager] = active;
        ChangedManager(manager, active);
    }

    function whiteListInvestor(address investor) public {
        require(isManager[msg.sender]);

        isWhitelisted[investor] = true;
        ChangedInvestorWhitelisting(investor, true);
    }

    function batchWhiteListInvestors(address[] investors) public {
        require(isManager[msg.sender]);
        address investor;

        for (uint256 c; c < investors.length; c.add(1)) {
            investor = investors[c]; // gas optimization
            isWhitelisted[investor] = true;
            ChangedInvestorWhitelisting(investor, true);
        }
    }

    function unWhiteListInvestor(address investor) public {
        require(isManager[msg.sender]);

        isWhitelisted[investor] = false;
        ChangedInvestorWhitelisting(investor, false);
    }

    // override so that funds do not get forwarded to beneficiary wallet
    // sending funds happens after crowdsale is over and confirmation period is over
    function forwardFunds() internal {}

    struct payment {
        address investor;
        address beneficiary;
        uint256 amount;
        bool confirmed;
    }

    payment[] public investments; // @TODO (Sebastian): or mapping better than array?

    // extend core functionality by whitelist check
    function buyTokens(address beneficiary) public payable {
        // @TODO: (just in case) check we're in contribution period window (maybe use FinalizableCrowdsale???)
        require(isWhitelisted[msg.sender]);

        // register payment so that later on it can be confirmed (and tokens issued and ethere paid out)
        payment memory newPayment = payment(msg.sender, beneficiary, msg.value, false);
        investments.push(newPayment);

        super.buyTokens(beneficiary);
    }

    function confirmPayment(uint256 investmentId) public {
        // @TODO: only within 30 days after contribution period is over
        require(isManager[msg.sender]);

        investments[investmentId].confirmed = true;
    }

    function batchConfirmPayments(uint256[] investmentIds) public {
        require(isManager[msg.sender]);
        uint256 investmentId;

        for (uint256 c; c < investmentIds.length; c.add(1)) {
            investmentId = investmentIds[c]; // gas optimization
            investments[investmentId].confirmed = true;
            // @TODO: add event similar to below:
            //ChangedInvestorWhitelisting(investmentId, true);
        }
    }

    function unConfirmPayment(uint256 investmentId) public {
        // @TODO: only within 30 days after contribution period is over
        require(isManager[msg.sender]);

        investments[investmentId].confirmed = false;
    }
}
